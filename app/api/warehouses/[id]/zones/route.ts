import { NextRequest } from 'next/server'
import { JWTPayload } from '@/app/lib/auth'
import { createErrorResponse, createResponse, withRole } from '@/app/lib/api-utils'
import { prisma } from '@/app/lib/prisma'
import { createWarehouseZoneSchema } from '@/app/lib/validations'

// GET /api/warehouses/[id]/zones
export const GET = withRole(['SJFS_ADMIN', 'WAREHOUSE_STAFF'], async (request: NextRequest, user: JWTPayload, { params }: { params: { id: string } }) => {
  try {
    const warehouseId = params.id

    // Check if warehouse exists
    const warehouse = await prisma.warehouseLocation.findUnique({
      where: { id: warehouseId },
      select: { id: true, name: true }
    })

    if (!warehouse) {
      return createErrorResponse('Warehouse not found', 404)
    }

    const zones = await prisma.warehouseZone.findMany({
      where: { warehouseId },
      include: {
        warehouse: {
          select: {
            id: true,
            name: true,
            code: true
          }
        }
      },
      orderBy: { createdAt: 'desc' }
    })

    return createResponse(zones, 200, 'Warehouse zones retrieved successfully')
  } catch (error) {
    console.error('Get warehouse zones error:', error)
    return createErrorResponse('Failed to retrieve warehouse zones', 500)
  }
})

// POST /api/warehouses/[id]/zones
export const POST = withRole(['SJFS_ADMIN'], async (request: NextRequest, user: JWTPayload, { params }: { params: { id: string } }) => {
  try {
    const warehouseId = params.id
    const body = await request.json()
    const zoneData = createWarehouseZoneSchema.parse(body)

    // Check if warehouse exists
    const warehouse = await prisma.warehouseLocation.findUnique({
      where: { id: warehouseId },
      select: { id: true, name: true, capacity: true }
    })

    if (!warehouse) {
      return createErrorResponse('Warehouse not found', 404)
    }

    // Check if zone code already exists in this warehouse
    const existingZone = await prisma.warehouseZone.findFirst({
      where: { 
        warehouseId,
        code: zoneData.code 
      }
    })

    if (existingZone) {
      return createErrorResponse('Zone with this code already exists in this warehouse', 400)
    }

    // Check if total zone capacity exceeds warehouse capacity
    if (warehouse.capacity) {
      const existingZonesCapacity = await prisma.warehouseZone.aggregate({
        where: { warehouseId },
        _sum: { capacity: true }
      })

      const totalCapacity = (existingZonesCapacity._sum.capacity || 0) + zoneData.capacity
      if (totalCapacity > warehouse.capacity) {
        return createErrorResponse(`Total zone capacity (${totalCapacity}) exceeds warehouse capacity (${warehouse.capacity})`, 400)
      }
    }

    // Create zone
    const newZone = await prisma.warehouseZone.create({
      data: {
        ...zoneData,
        warehouseId
      },
      include: {
        warehouse: {
          select: {
            id: true,
            name: true,
            code: true
          }
        }
      }
    })

    // Log the creation
    await prisma.auditLog.create({
      data: {
        userId: user.userId,
        action: 'CREATE_WAREHOUSE_ZONE',
        entityType: 'warehouse_zones',
        entityId: newZone.id,
        newValues: zoneData
      }
    })

    return createResponse(newZone, 201, 'Warehouse zone created successfully')
  } catch (error) {
    console.error('Create warehouse zone error:', error)
    if (error instanceof Error && error.message.includes('validation')) {
      return createErrorResponse('Invalid input data', 400)
    }
    return createErrorResponse('Failed to create warehouse zone', 500)
  }
})
