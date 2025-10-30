import { NextRequest } from 'next/server'
import { createErrorResponse, createResponse } from '@/app/lib/api-utils'
import { prisma } from '@/app/lib/prisma'
import { hashPassword } from '@/app/lib/password'
import { sendMerchantVerificationEmail } from '@/app/lib/email'

// POST /api/merchants/register
// Merchant self-registration and onboarding
export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { email, password } = body

    if (!email || !password) {
      return createErrorResponse('Email and password are required', 400)
    }

    // Check if merchant or user already exists
    const existingMerchant = await prisma.merchant.findFirst({
      where: { businessEmail: email },
      select: { id: true, businessEmail: true, isActive: true }
    })
    if (existingMerchant) {
      return createErrorResponse('Merchant with this email already exists.', 400)
    }

    const existingUser = await prisma.user.findFirst({
      where: { email },
      select: { id: true, email: true, isActive: true }
    })
    if (existingUser) {
      return createErrorResponse('User with this email already exists.', 400)
    }

    // Hash password
    const hashedPassword = await hashPassword(password)

    // Generate verification token
    const verificationToken = Math.random().toString(36).substring(2) + Date.now().toString(36)

    // Create merchant and user in a transaction
    const result = await prisma.$transaction(async (tx) => {
      // Create merchant (inactive, with token, placeholder details)
      const newMerchant = await tx.merchant.create({
        data: {
          businessName: '',
          businessEmail: email,
          businessPhone: '',
          contactPerson: '',
          address: '',
          city: '',
          state: '',
          country: 'Nigeria',
          cacNumber: '',
          taxId: '',
          isActive: false,
          verificationToken,
          onboardingStatus: 'PENDING',
        }
      })

      // Create user (minimal info)
      const newUser = await tx.user.create({
        data: {
          email,
          password: hashedPassword,
          firstName: '',
          lastName: '',
          phone: '',
          role: 'MERCHANT_ADMIN',
          merchantId: newMerchant.id,
          isActive: false
        },
        select: {
          id: true,
          email: true,
          role: true,
          merchantId: true,
          createdAt: true
        }
      })

      return { merchant: newMerchant, user: newUser }
    }, { timeout: 10000 })

    // Send verification email
    const verificationUrl = `${process.env.NEXT_PUBLIC_BASE_URL || 'https://portal.sjfulfillment.com'}/verify?token=${verificationToken}`
    await sendMerchantVerificationEmail({
      to: email,
      verificationUrl
    })

    return createResponse({
      message: 'Registration successful. Please check your email to verify your account.'
    }, 201, 'Merchant registered successfully')
  } catch (error) {
    console.error('Merchant registration error:', error)
    return createErrorResponse('Registration failed', 500)
  }
}
