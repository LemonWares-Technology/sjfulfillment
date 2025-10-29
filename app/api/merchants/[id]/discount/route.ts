import { NextRequest } from "next/server";
import { prisma } from "../../../../lib/prisma";
import {
  createResponse,
  createErrorResponse,
  withRole,
} from "../../../../lib/api-utils";
import { JWTPayload } from "../../../../lib/auth";

// PUT /api/merchants/[id]/discount
export const PUT = withRole([
  "SJFS_ADMIN"
], async (
  request: NextRequest,
  user: JWTPayload,
  { params }: { params: Promise<{ id: string }> }
) => {
  try {
    const { id: merchantId } = await params;
    const body = await request.json();
    const { discount } = body;
    if (typeof discount !== "number" || isNaN(discount) || discount < 0 || discount > 100) {
      return createErrorResponse("Invalid discount value", 400);
    }
    // Update all ACTIVE subscriptions for this merchant
    await prisma.subscription.updateMany({
      where: { merchantId, status: "ACTIVE" },
      data: { discountPercent: discount },
    });
      // Also update top-level merchant discount field
      await prisma.merchant.update({
        where: { id: merchantId },
        data: { discount },
      });
    return createResponse({ success: true, discount }, 200, "Discount updated successfully");
  } catch (error) {
    console.error("Update discount error:", error);
    return createErrorResponse("Failed to update discount", 500);
  }
});
