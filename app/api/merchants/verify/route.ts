import { NextRequest } from 'next/server'
import { prisma } from '@/app/lib/prisma'
import { createErrorResponse, createResponse } from '@/app/lib/api-utils'
import { createMerchantSchema } from '@/app/lib/validations'

// POST /api/merchants/verify
// Accepts: { token, businessName, businessPhone, contactPerson, address, city, state, country, cacNumber, taxId, firstName, lastName, phone }
export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { token, businessName, businessPhone, contactPerson, address, city, state, country, cacNumber, taxId, firstName, lastName, phone } = body
    if (!token) return createErrorResponse('Verification token required', 400)

    // Find merchant by token
    const merchant = await prisma.merchant.findFirst({ where: { verificationToken: token } })
    if (!merchant) return createErrorResponse('Invalid or expired verification token', 400)
    if (merchant.isActive) return createErrorResponse('Account already verified', 400)

    // Update merchant details and activate
    await prisma.merchant.update({
      where: { id: merchant.id },
      data: {
        businessName,
        businessPhone,
        contactPerson,
        address,
        city,
        state,
        country,
        cacNumber,
        taxId,
        isActive: true,
        verificationToken: null,
        onboardingStatus: 'APPROVED'
      }
    })

    // Update user details and activate
    await prisma.user.updateMany({
      where: { merchantId: merchant.id },
      data: {
        firstName,
        lastName,
        phone,
        isActive: true
      }
    })

    return createResponse({ message: 'Account verified and activated. You may now log in.' }, 200, 'Merchant verified')
  } catch (error) {
    console.error('Merchant verification error:', error)
    return createErrorResponse('Verification failed', 500)
  }
}
