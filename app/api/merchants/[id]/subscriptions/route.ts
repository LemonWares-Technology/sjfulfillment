import { prisma } from '@/app/lib/prisma';
import { NextRequest } from 'next/server';

export async function GET(req: NextRequest, { params }: { params: { id: string } }) {
  try {
    const merchantId = params.id;
    // Fetch active subscriptions for the merchant
  const subscriptions = await prisma.merchantServiceSubscription.findMany({
      where: {
        merchantId,
        status: 'ACTIVE',
      },
      select: {
        serviceId: true,
        priceAtSubscription: true,
        quantity: true,
        status: true,
      },
    });
    return Response.json({ success: true, data: subscriptions });
  } catch (error: any) {
    return Response.json({ success: false, error: error?.message || 'Failed to fetch subscriptions.' }, { status: 500 });
  }
}
