import { NextRequest } from 'next/server'
import { prisma } from '../../../lib/prisma'
import { createResponse, createErrorResponse, withRole } from '../../../lib/api-utils'
import { updateReturnSchema } from '../../../lib/validations'

// GET /api/returns/[id]
export const GET = withRole(['SJFS_ADMIN', 'MERCHANT_ADMIN', 'MERCHANT_STAFF'], async (request: NextRequest, user, { params }: { params: { id: string } }) => {
  try {
    const returnId = params.id

    const returnRecord = await prisma.return.findUnique({
      where: { id: returnId },
      include: {
        order: {
          include: {
            merchant: {
              select: {
                id: true,
                businessName: true,
                businessEmail: true,
                businessPhone: true
              }
            },
            orderItems: {
              include: {
                product: {
                  select: {
                    id: true,
                    sku: true,
                    name: true,
                    description: true,
                    category: true,
                    brand: true,
                    unitPrice: true,
                    images: true
                  }
                }
              }
            }
          }
        }
      }
    })

    if (!returnRecord) {
      return createErrorResponse('Return not found', 404)
    }

    // Check permissions
    if (user.role !== 'SJFS_ADMIN' && returnRecord.order.merchantId !== user.merchantId) {
      return createErrorResponse('Forbidden', 403)
    }

    return createResponse(returnRecord, 200, 'Return retrieved successfully')
  } catch (error) {
    console.error('Get return error:', error)
    return createErrorResponse('Failed to retrieve return', 500)
  }
})

// PUT /api/returns/[id]
export const PUT = withRole(['SJFS_ADMIN', 'MERCHANT_ADMIN'], async (request: NextRequest, user, { params }: { params: { id: string } }) => {
  try {
    const returnId = params.id
    const body = await request.json()
    const updateData = updateReturnSchema.parse(body)

    // Check if return exists
    const existingReturn = await prisma.return.findUnique({
      where: { id: returnId },
      include: {
        order: {
          select: {
            id: true,
            merchantId: true,
            orderNumber: true
          }
        }
      }
    })

    if (!existingReturn) {
      return createErrorResponse('Return not found', 404)
    }

    // Check permissions
    if (user.role !== 'SJFS_ADMIN' && existingReturn.order.merchantId !== user.merchantId) {
      return createErrorResponse('Forbidden', 403)
    }

    // Update return
    const updatedReturn = await prisma.return.update({
      where: { id: returnId },
      data: {
        ...updateData,
        processedBy: user.userId
      },
      include: {
        order: {
          select: {
            id: true,
            orderNumber: true,
            customerName: true,
            customerEmail: true,
            totalAmount: true,
            merchant: {
              select: {
                id: true,
                businessName: true
              }
            }
          }
        }
      }
    })

    // Handle status-specific logic
    if (updateData.status === 'RESTOCKED' && updateData.restockable) {
      // Add items back to inventory
      const orderItems = await prisma.orderItem.findMany({
        where: { orderId: existingReturn.orderId },
        include: {
          product: {
            select: { id: true, sku: true, name: true }
          }
        }
      })

      for (const item of orderItems) {
        // Find stock items for this product
        const stockItems = await prisma.stockItem.findMany({
          where: { productId: item.productId }
        })

        for (const stockItem of stockItems) {
          // Add quantity back to available stock
          await prisma.stockItem.update({
            where: { id: stockItem.id },
            data: {
              quantity: { increment: item.quantity },
              availableQuantity: { increment: item.quantity }
            }
          })

          // Create stock movement
          await prisma.stockMovement.create({
            data: {
              stockItemId: stockItem.id,
              movementType: 'STOCK_IN',
              quantity: item.quantity,
              referenceType: 'RETURN',
              referenceId: returnId,
              performedBy: user.userId,
              notes: `Restocked from return ${returnId}`
            }
          })
        }
      }
    }

    // Log the change
    await prisma.auditLog.create({
      data: {
        userId: user.userId,
        action: 'UPDATE_RETURN',
        entityType: 'returns',
        entityId: returnId,
        newValues: updateData
      }
    })

    return createResponse(updatedReturn, 200, 'Return updated successfully')
  } catch (error) {
    console.error('Update return error:', error)
    if (error instanceof Error && error.message.includes('validation')) {
      return createErrorResponse('Invalid input data', 400)
    }
    return createErrorResponse('Failed to update return', 500)
  }
})

// DELETE /api/returns/[id]
export const DELETE = withRole(['SJFS_ADMIN'], async (request: NextRequest, user, { params }: { params: { id: string } }) => {
  try {
    const returnId = params.id

    // Check if return exists
    const existingReturn = await prisma.return.findUnique({
      where: { id: returnId },
      select: { id: true, status: true }
    })

    if (!existingReturn) {
      return createErrorResponse('Return not found', 404)
    }

    // Cannot delete processed returns
    if (['APPROVED', 'REFUNDED', 'RESTOCKED'].includes(existingReturn.status)) {
      return createErrorResponse('Cannot delete processed returns', 400)
    }

    // Delete return
    await prisma.return.delete({
      where: { id: returnId }
    })

    // Log the change
    await prisma.auditLog.create({
      data: {
        userId: user.userId,
        action: 'DELETE_RETURN',
        entityType: 'returns',
        entityId: returnId
      }
    })

    return createResponse(null, 200, 'Return deleted successfully')
  } catch (error) {
    console.error('Delete return error:', error)
    return createErrorResponse('Failed to delete return', 500)
  }
})
