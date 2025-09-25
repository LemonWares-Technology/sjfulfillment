'use client'

import { useAuth } from '@/app/lib/auth-context'
import { useApi } from '@/app/lib/use-api'
import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'

interface PaymentStatus {
  hasActiveSubscription: boolean
  subscriptionStatus: string | null
  needsPayment: boolean
  lastPaymentDate: Date | null
  nextBillingDate: Date | null
  amountDue: number
}

interface PaymentGateProps {
  children: React.ReactNode
  userRole: string
}

export default function PaymentGate({ children, userRole }: PaymentGateProps) {
  const { user } = useAuth()
  const { get, loading } = useApi()
  const router = useRouter()
  const [paymentStatus, setPaymentStatus] = useState<PaymentStatus | null>(null)
  const [isChecking, setIsChecking] = useState(true)

  useEffect(() => {
    // Only check payment status for merchant roles
    if (userRole === 'MERCHANT_ADMIN' || userRole === 'MERCHANT_STAFF') {
      checkPaymentStatus()
    } else {
      setIsChecking(false)
    }
  }, [userRole])

  const checkPaymentStatus = async () => {
    try {
      const status = await get<PaymentStatus>('/api/merchants/payment-status', { silent: true })
      setPaymentStatus(status)
      
      // If merchant needs payment, redirect to payment page
      if (status && (!status.hasActiveSubscription || status.needsPayment || status.subscriptionStatus !== 'ACTIVE')) {
        router.push('/payment-required')
        return
      }
    } catch (error) {
      console.error('Failed to check payment status:', error)
      // On error, redirect to payment page to be safe
      router.push('/payment-required')
      return
    } finally {
      setIsChecking(false)
    }
  }

  // Show loading while checking payment status
  if (isChecking) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-gray-600">Verifying payment status...</p>
        </div>
      </div>
    )
  }

  // For non-merchant roles, show children directly
  if (userRole !== 'MERCHANT_ADMIN' && userRole !== 'MERCHANT_STAFF') {
    return <>{children}</>
  }

  // For merchant roles, only show children if payment is verified
  if (paymentStatus && paymentStatus.hasActiveSubscription && !paymentStatus.needsPayment && paymentStatus.subscriptionStatus === 'ACTIVE') {
    return <>{children}</>
  }

  // If we reach here, payment is required - redirect will happen in useEffect
  return (
    <div className="min-h-screen bg-gray-50 flex items-center justify-center">
      <div className="text-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
        <p className="text-gray-600">Redirecting to payment...</p>
      </div>
    </div>
  )
}
