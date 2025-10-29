import { NextRequest } from 'next/server'
import { prisma } from '@/app/lib/prisma'
import { getCurrentUser } from '@/app/lib/auth'

// GET /api/merchant-services/discount
export async function GET(request: NextRequest) {
  // Get user from request (JWT/session)
  const user = await getCurrentUser(request)
  if (!user || !user.merchantId) {
    return new Response(JSON.stringify({ success: false, error: 'Unauthorized' }), { status: 401 })
  }

  // Fetch merchant from DB
  const merchant = await prisma.merchant.findUnique({
    where: { id: user.merchantId },
    select: { discount: true }
  })

  if (!merchant) {
    return new Response(JSON.stringify({ success: false, error: 'Merchant not found' }), { status: 404 })
  }

  // Discount is percent (0-100), convert to response format
  const discountPercent = merchant.discount ?? 0
  const discountNumber = typeof discountPercent === 'object' && 'toNumber' in discountPercent
    ? discountPercent.toNumber()
    : Number(discountPercent)
  const isActive = discountNumber > 0
  return Response.json({
    success: true,
    data: {
      amount: 0, // If you support fixed amount, fetch it here
      percentage: discountNumber,
      isActive
    }
  })
}
