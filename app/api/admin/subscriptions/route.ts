import { NextRequest } from 'next/server'
import { JWTPayload } from '@/app/lib/auth'
import { createErrorResponse, createResponse, withRole } from '@/app/lib/api-utils'
import { prisma } from '@/app/lib/prisma'

// GET /api/admin/subscriptions
export const GET = withRole(['SJFS_ADMIN'], async (request: NextRequest, user: JWTPayload) => {
  try {
    const { searchParams } = new URL(request.url)
    const page = parseInt(searchParams.get('page') || '1')
    const limit = parseInt(searchParams.get('limit') || '50')
    const status = searchParams.get('status')
    const merchantId = searchParams.get('merchantId')

    const where: any = {}
    if (status && status !== 'ALL') {
      where.status = status
    }
    if (merchantId) {
      where.merchantId = merchantId
    }

    const skip = (page - 1) * limit

    const [subscriptions, total] = await Promise.all([
      prisma.merchantServiceSubscription.findMany({
        where,
        skip,
        take: limit,
        include: {
          merchant: {
            select: {
              id: true,
              businessName: true,
              businessEmail: true,
              businessPhone: true
            }
          },
          service: {
            select: {
              id: true,
              name: true,
              description: true,
              category: true,
              price: true
            }
          }
        },
        orderBy: { createdAt: 'desc' }
      }),
      prisma.merchantServiceSubscription.count({ where })
    ])

    return createResponse(
      {
        subscriptions,
        pagination: {
          page,
          limit,
          total,
          pages: Math.ceil(total / limit)
        }
      },
      200,
      'Admin subscriptions retrieved successfully'
    )
  } catch (error) {
    console.error('Get admin subscriptions error:', error)
    return createErrorResponse('Failed to retrieve admin subscriptions', 500)
  }
})

