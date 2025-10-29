import { NextRequest } from 'next/server';
import { createErrorResponse, createResponse, withRole } from '@/app/lib/api-utils';
import { prisma } from '@/app/lib/prisma';

// PATCH /api/admin/services/update-price
export const PATCH = withRole(['SJFS_ADMIN'], async (request: NextRequest) => {
  try {
    const body = await request.json();
    const { serviceId, newPrice } = body;
    if (!serviceId || typeof newPrice !== 'number' || newPrice <= 0) {
      return createErrorResponse('Invalid serviceId or price. Price must be greater than zero.', 400);
    }

    // Update the service price
    const updated = await prisma.service.update({
      where: { id: serviceId },
      data: { price: newPrice }
    });

    // Optionally log the change
    // await prisma.auditLog.create({ ... })

    return createResponse({ message: 'Service price updated', updated }, 200);
  } catch (error) {
    console.error('Admin update service price error:', error);
    return createErrorResponse('Failed to update service price', 500);
  }
});
