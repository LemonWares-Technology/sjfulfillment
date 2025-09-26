import { NextRequest } from 'next/server'
import { createErrorResponse, createResponse, withRole } from '@/app/lib/api-utils'
import { JWTPayload } from '@/app/lib/auth'
import { prisma } from '@/app/lib/prisma'

// GET /api/merchant-services/status
export const GET = withRole(['MERCHANT_ADMIN', 'MERCHANT_STAFF'], async (request: NextRequest, user: JWTPayload) => {
  try {
    if (!user.merchantId) {
      return createErrorResponse('Merchant ID not found', 400)
    }

    // Check if merchant has any active service subscriptions
    const serviceSubscriptions = await prisma.merchantServiceSubscription.findMany({
      where: {
        merchantId: user.merchantId,
        status: 'ACTIVE'
      },
      select: {
        id: true,
        serviceId: true,
        quantity: true,
        startDate: true
      }
    })

    const hasServices = serviceSubscriptions.length > 0

    return createResponse({
      hasServices,
      serviceCount: serviceSubscriptions.length,
      services: serviceSubscriptions
    }, 200, 'Service status retrieved successfully')

  } catch (error) {
    console.error('Get service status error:', error)
    return createErrorResponse('Failed to retrieve service status', 500)
  }
})

