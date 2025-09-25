import { NextRequest } from 'next/server'
import { prisma } from '../../../lib/prisma'
import { createResponse, createErrorResponse, withRole } from '../../../lib/api-utils'
import { updateProductSchema } from '../../../lib/validations'

// GET /api/products/[id]
export const GET = withRole(['SJFS_ADMIN', 'MERCHANT_ADMIN', 'MERCHANT_STAFF', 'WAREHOUSE_STAFF'], async (request: NextRequest, user, { params }: { params: { id: string } }) => {
  try {
    const productId = params.id

    const product = await prisma.product.findUnique({
      where: { id: productId },
      include: {
        merchant: {
          select: {
            id: true,
            businessName: true,
            businessEmail: true
          }
        },
        stockItems: {
          include: {
            warehouse: {
              select: {
                id: true,
                name: true,
                code: true,
                city: true,
                state: true
              }
            },
            stockMovements: {
              orderBy: { createdAt: 'desc' },
              take: 10
            }
          }
        },
        serialNumbers: {
          select: {
            id: true,
            serialNo: true,
            status: true,
            createdAt: true
          }
        },
        orderItems: {
          include: {
            order: {
              select: {
                id: true,
                orderNumber: true,
                status: true,
                createdAt: true
              }
            }
          },
          orderBy: { order: { createdAt: 'desc' } },
          take: 10
        }
      }
    })

    if (!product) {
      return createErrorResponse('Product not found', 404)
    }

    // Check permissions
    if (user.role !== 'SJFS_ADMIN' && product.merchantId !== user.merchantId) {
      return createErrorResponse('Forbidden', 403)
    }

    return createResponse(product, 200, 'Product retrieved successfully')
  } catch (error) {
    console.error('Get product error:', error)
    return createErrorResponse('Failed to retrieve product', 500)
  }
})

// PUT /api/products/[id]
export const PUT = withRole(['SJFS_ADMIN', 'MERCHANT_ADMIN', 'MERCHANT_STAFF'], async (request: NextRequest, user, { params }: { params: { id: string } }) => {
  try {
    const productId = params.id
    const body = await request.json()
    const updateData = updateProductSchema.parse(body)

    // Check if product exists
    const existingProduct = await prisma.product.findUnique({
      where: { id: productId },
      select: { id: true, merchantId: true, sku: true }
    })

    if (!existingProduct) {
      return createErrorResponse('Product not found', 404)
    }

    // Check permissions
    if (user.role !== 'SJFS_ADMIN' && existingProduct.merchantId !== user.merchantId) {
      return createErrorResponse('Forbidden', 403)
    }

    // Check if new SKU conflicts
    if (updateData.sku && updateData.sku !== existingProduct.sku) {
      const skuExists = await prisma.product.findUnique({
        where: { sku: updateData.sku }
      })
      if (skuExists) {
        return createErrorResponse('Product with this SKU already exists', 400)
      }
    }

    // Update product
    const updatedProduct = await prisma.product.update({
      where: { id: productId },
      data: updateData,
      include: {
        merchant: {
          select: {
            id: true,
            businessName: true
          }
        }
      }
    })

    // Log the change
    await prisma.auditLog.create({
      data: {
        userId: user.userId,
        action: 'UPDATE_PRODUCT',
        entityType: 'products',
        entityId: productId,
        newValues: updateData
      }
    })

    return createResponse(updatedProduct, 200, 'Product updated successfully')
  } catch (error) {
    console.error('Update product error:', error)
    if (error instanceof Error && error.message.includes('validation')) {
      return createErrorResponse('Invalid input data', 400)
    }
    return createErrorResponse('Failed to update product', 500)
  }
})

// DELETE /api/products/[id]
export const DELETE = withRole(['SJFS_ADMIN', 'MERCHANT_ADMIN'], async (request: NextRequest, user, { params }: { params: { id: string } }) => {
  try {
    const productId = params.id

    // Check if product exists
    const existingProduct = await prisma.product.findUnique({
      where: { id: productId },
      select: { id: true, merchantId: true, name: true }
    })

    if (!existingProduct) {
      return createErrorResponse('Product not found', 404)
    }

    // Check permissions
    if (user.role !== 'SJFS_ADMIN' && existingProduct.merchantId !== user.merchantId) {
      return createErrorResponse('Forbidden', 403)
    }

    // Check if product has active stock or orders
    const [stockCount, orderCount] = await Promise.all([
      prisma.stockItem.count({
        where: {
          productId,
          quantity: { gt: 0 }
        }
      }),
      prisma.orderItem.count({
        where: {
          productId,
          order: {
            status: { not: 'CANCELLED' }
          }
        }
      })
    ])

    if (stockCount > 0 || orderCount > 0) {
      return createErrorResponse('Cannot delete product with active stock or orders', 400)
    }

    // Soft delete by deactivating
    await prisma.product.update({
      where: { id: productId },
      data: { isActive: false }
    })

    // Log the change
    await prisma.auditLog.create({
      data: {
        userId: user.userId,
        action: 'DELETE_PRODUCT',
        entityType: 'products',
        entityId: productId
      }
    })

    return createResponse(null, 200, 'Product deactivated successfully')
  } catch (error) {
    console.error('Delete product error:', error)
    return createErrorResponse('Failed to delete product', 500)
  }
})