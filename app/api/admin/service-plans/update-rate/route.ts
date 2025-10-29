import { NextRequest } from 'next/server'
import { createErrorResponse, createResponse, withRole } from '@/app/lib/api-utils'
import { prisma } from '@/app/lib/prisma'

// PATCH /api/admin/service-plans/update-rate
export const PATCH = withRole(['SJFS_ADMIN'], async (request: NextRequest) => {
  try {
    const body = await request.json()
    const { planId, newRate } = body
    if (!planId || typeof newRate !== 'number' || newRate <= 0) {
      return createErrorResponse('Invalid planId or rate. Rate must be greater than zero.', 400)
    }

    // Update the plan rate
    const updated = await prisma.servicePlan.update({
      where: { id: planId },
      data: { basePrice: newRate }
    })

    // Audit log (optional, if you have an audit log model)
    // await prisma.auditLog.create({ ... })

    return createResponse({ message: 'Plan rate updated', updated }, 200)
  } catch (error) {
    console.error('Admin update plan rate error:', error)
    return createErrorResponse('Failed to update plan rate', 500)
  }
})
