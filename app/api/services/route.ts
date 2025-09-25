import { NextRequest } from 'next/server'
import { createErrorResponse, createResponse } from '@/app/lib/api-utils'
import { prisma } from '@/app/lib/prisma'

// GET /api/services
export async function GET(request: NextRequest) {
  try {
    const services = await prisma.service.findMany({
      where: { isActive: true },
      select: {
        id: true,
        name: true,
        description: true,
        price: true,
        category: true,
        features: true,
        isActive: true,
        createdAt: true
      },
      orderBy: [
        { category: 'asc' },
        { name: 'asc' }
      ]
    })

    return createResponse(services, 200, 'Services retrieved successfully')
  } catch (error) {
    console.error('Get services error:', error)
    return createErrorResponse('Failed to retrieve services', 500)
  }
}
