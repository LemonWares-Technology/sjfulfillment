import { prisma } from '@/app/lib/prisma'

export interface PaymentStatus {
  hasActiveSubscription: boolean
  subscriptionStatus: string | null
  needsPayment: boolean
  lastPaymentDate: Date | null
  nextBillingDate: Date | null
  amountDue: number
}

export async function checkMerchantPaymentStatus(merchantId: string): Promise<PaymentStatus> {
  try {
    // Check if merchant has any active subscription
    const activeSubscription = await prisma.subscription.findFirst({
      where: {
        merchantId,
        status: 'ACTIVE'
      },
      select: {
        id: true,
        status: true,
        startDate: true,
        nextBillingDate: true,
        totalAmount: true
      },
      orderBy: { createdAt: 'desc' }
    })

    // Check for pending payments
    const pendingPayment = await prisma.billingRecord.findFirst({
      where: {
        merchantId,
        status: 'PENDING'
      },
      select: {
        amount: true,
        dueDate: true
      },
      orderBy: { dueDate: 'asc' }
    })

    // Check last successful payment
    const lastPayment = await prisma.payment.findFirst({
      where: {
        merchantId,
        status: 'SUCCESS'
      },
      select: {
        processedAt: true
      },
      orderBy: { processedAt: 'desc' }
    })

    return {
      hasActiveSubscription: !!activeSubscription,
      subscriptionStatus: activeSubscription?.status || null,
      needsPayment: !activeSubscription || !!pendingPayment,
      lastPaymentDate: lastPayment?.processedAt || null,
      nextBillingDate: activeSubscription?.nextBillingDate || pendingPayment?.dueDate || null,
      amountDue: pendingPayment?.amount ? Number(pendingPayment.amount) : (activeSubscription ? Number(activeSubscription.totalAmount) : 0)
    }
  } catch (error) {
    console.error('Error checking payment status:', error)
    return {
      hasActiveSubscription: false,
      subscriptionStatus: null,
      needsPayment: true,
      lastPaymentDate: null,
      nextBillingDate: null,
      amountDue: 0
    }
  }
}

export function shouldBlockMerchantAccess(paymentStatus: PaymentStatus): boolean {
  // Block access if:
  // 1. No active subscription
  // 2. Has pending payments
  // 3. Subscription is not ACTIVE
  return !paymentStatus.hasActiveSubscription || 
         paymentStatus.needsPayment || 
         paymentStatus.subscriptionStatus !== 'ACTIVE'
}
