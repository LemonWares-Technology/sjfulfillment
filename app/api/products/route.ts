import { NextRequest } from 'next/server'

import { JWTPayload } from '@/app/lib/auth'
import { createErrorResponse, createResponse, withRole } from '@/app/lib/api-utils'
import { prisma } from '@/app/lib/prisma'
import { createProductSchema } from '@/app/lib/validations'

// GET /api/products
export const GET = withRole(['SJFS_ADMIN', 'MERCHANT_ADMIN', 'MERCHANT_STAFF', 'WAREHOUSE_STAFF'], async (request: NextRequest, user: JWTPayload) => {
  try {
    const { searchParams } = new URL(request.url)
    const page = parseInt(searchParams.get('page') || '1')
    const limit = parseInt(searchParams.get('limit') || '10')
    const category = searchParams.get('category')
    const brand = searchParams.get('brand')
    const isActive = searchParams.get('isActive')
    const search = searchParams.get('search')

    const where: any = {}

    // Filter by merchant if not admin
    if (user.role !== 'SJFS_ADMIN') {
      where.merchantId = user.merchantId
    }

    if (category) where.category = category
    if (brand) where.brand = brand
    if (isActive !== null) where.isActive = isActive === 'true'
    if (search) {
      where.OR = [
        { name: { contains: search, mode: 'insensitive' } },
        { sku: { contains: search, mode: 'insensitive' } },
        { description: { contains: search, mode: 'insensitive' } }
      ]
    }

    const skip = (page - 1) * limit

    const [products, total] = await Promise.all([
      prisma.product.findMany({
        where,
        skip,
        take: limit,
        include: {
          merchant: {
            select: {
              id: true,
              businessName: true
            }
          },
          stockItems: {
            include: {
              warehouse: {
                select: {
                  id: true,
                  name: true,
                  code: true
                }
              }
            }
          },
          serialNumbers: {
            where: { status: 'AVAILABLE' },
            select: {
              id: true,
              serialNo: true
            }
          },
          _count: {
            select: {
              orderItems: true
            }
          }
        },
        orderBy: { createdAt: 'desc' }
      }),
      prisma.product.count({ where })
    ])

    return createResponse({
      products,
      pagination: {
        page,
        limit,
        total,
        pages: Math.ceil(total / limit)
      }
    }, 200, 'Products retrieved successfully')
  } catch (error) {
    console.error('Get products error:', error)
    return createErrorResponse('Failed to retrieve products', 500)
  }
})

// POST /api/products
export const POST = withRole(['SJFS_ADMIN', 'MERCHANT_ADMIN', 'MERCHANT_STAFF'], async (request: NextRequest, user) => {
  try {
    const body = await request.json()
    const productData = createProductSchema.parse(body)

    // Check if SKU already exists
    const existingProduct = await prisma.product.findUnique({
      where: { sku: productData.sku }
    })

    if (existingProduct) {
      return createErrorResponse('Product with this SKU already exists', 400)
    }

    // Set merchant ID
    const merchantId = user.role === 'SJFS_ADMIN' ? body.merchantId : user.merchantId
    if (!merchantId) {
      return createErrorResponse('Merchant ID is required', 400)
    }

    // Create product
    const newProduct = await prisma.product.create({
      data: {
        ...productData,
        merchantId
      },
      include: {
        merchant: {
          select: {
            id: true,
            businessName: true
          }
        }
      }
    })

    // Log the creation
    await prisma.auditLog.create({
      data: {
        userId: user.userId,
        action: 'CREATE_PRODUCT',
        entityType: 'products',
        entityId: newProduct.id,
        newValues: productData
      }
    })

    return createResponse(newProduct, 201, 'Product created successfully')
  } catch (error) {
    console.error('Create product error:', error)
    if (error instanceof Error && error.message.includes('validation')) {
      return createErrorResponse('Invalid input data', 400)
    }
    return createErrorResponse('Failed to create product', 500)
  }
})
