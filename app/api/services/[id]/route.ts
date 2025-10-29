import { prisma } from '@/app/lib/prisma';
import { NextRequest } from 'next/server';
import { createResponse, createErrorResponse } from '@/app/lib/api-utils';

export async function PUT(req: NextRequest, context: { params: { id: string } }) {
  const { id } = await context.params;
  const body = await req.json();
  let { price } = body;

  // Convert to string for Prisma Decimal type
  if (typeof price !== 'undefined') price = price.toString();

  try {
    const updated = await prisma.service.update({
      where: { id },
      data: {
        ...(typeof price !== 'undefined' ? { price } : {}),
      },
    });

    // Automatically update all active merchant subscriptions for this service
    if (typeof price !== 'undefined') {
      await prisma.merchantServiceSubscription.updateMany({
        where: {
          serviceId: id,
          status: 'ACTIVE',
        },
        data: {
          priceAtSubscription: price,
        },
      });
    }

    return createResponse(updated, 200, 'Service updated successfully');
  } catch (error) {
    return createErrorResponse('Service not found or update failed.', 404);
  }
}
