import { NextRequest } from 'next/server'
import { JWTPayload } from '@/app/lib/auth'
import { createErrorResponse, createResponse, withRole } from '@/app/lib/api-utils'
import { prisma } from '@/app/lib/prisma'
import { createLogisticsPartnerSchema } from '@/app/lib/validations'

// GET /api/logistics-partners
export const GET = withRole(['SJFS_ADMIN', 'WAREHOUSE_STAFF'], async (request: NextRequest, user: JWTPayload) => {
  try {
    const { searchParams } = new URL(request.url)
    const page = parseInt(searchParams.get('page') || '1')
    const limit = parseInt(searchParams.get('limit') || '10')
    const city = searchParams.get('city')
    const state = searchParams.get('state')
    const serviceType = searchParams.get('serviceType')
    const status = searchParams.get('status')
    const search = searchParams.get('search')

    const where: any = {}
    if (city) where.city = city
    if (state) where.state = state
    if (serviceType) where.serviceType = serviceType
    if (status) where.status = status
    if (search) {
      where.OR = [
        { companyName: { contains: search, mode: 'insensitive' } },
        { contactPerson: { contains: search, mode: 'insensitive' } },
        { email: { contains: search, mode: 'insensitive' } }
      ]
    }

    const skip = (page - 1) * limit

    const [partners, total] = await Promise.all([
      prisma.logisticsPartner.findMany({
        where,
        skip,
        take: limit,
        include: {
          deliveryMetrics: {
            select: {
              id: true,
              deliveryStatus: true,
              deliveryTime: true,
              deliveryAttempts: true
            },
            orderBy: { createdAt: 'desc' },
            take: 10
          },
          _count: {
            select: {
              deliveryMetrics: true
            }
          }
        },
        orderBy: { createdAt: 'desc' }
      }),
      prisma.logisticsPartner.count({ where })
    ])

    return createResponse(
      {
        partners,
        pagination: {
          page,
          limit,
          total,
          pages: Math.ceil(total / limit)
        }
      },
      200,
      'Logistics partners retrieved successfully'
    )
  } catch (error) {
    console.error('Get logistics partners error:', error)
    return createErrorResponse('Failed to retrieve logistics partners', 500)
  }
})

// POST /api/logistics-partners
export const POST = withRole(['SJFS_ADMIN'], async (request: NextRequest, user: JWTPayload) => {
  try {
    const body = await request.json()
    const partnerData = createLogisticsPartnerSchema.parse(body)

    // Check if partner with same email already exists
    const existingPartner = await prisma.logisticsPartner.findUnique({
      where: { email: partnerData.email }
    })

    if (existingPartner) {
      return createErrorResponse('Logistics partner with this email already exists', 400)
    }

    // Create logistics partner
    const newPartner = await prisma.logisticsPartner.create({
      data: partnerData,
      include: {
        deliveryMetrics: {
          select: {
            id: true,
            deliveryStatus: true,
            deliveryTime: true
          },
          take: 5
        }
      }
    })

    // Log the creation
    await prisma.auditLog.create({
      data: {
        userId: user.userId,
        action: 'CREATE_LOGISTICS_PARTNER',
        entityType: 'logistics_partners',
        entityId: newPartner.id,
        newValues: partnerData
      }
    })

    return createResponse(
      newPartner,
      201,
      'Logistics partner created successfully'
    )
  } catch (error) {
    console.error('Create logistics partner error:', error)
    if (error instanceof Error && error.message.includes('validation')) {
      return createErrorResponse('Invalid input data', 400)
    }
    return createErrorResponse('Failed to create logistics partner', 500)
  }
})
