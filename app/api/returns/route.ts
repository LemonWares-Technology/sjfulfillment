import { NextRequest } from "next/server";

import { JWTPayload } from "@/app/lib/auth";
import {
  createErrorResponse,
  createResponse,
  withRole,
} from "@/app/lib/api-utils";
import { prisma } from "@/app/lib/prisma";
import { createReturnSchema } from "@/app/lib/validations";

// GET /api/returns
export const GET = withRole(
  ["SJFS_ADMIN", "MERCHANT_ADMIN", "MERCHANT_STAFF"],
  async (request: NextRequest, user: JWTPayload) => {
    try {
      const { searchParams } = new URL(request.url);
      const page = parseInt(searchParams.get("page") || "1");
      const limit = parseInt(searchParams.get("limit") || "10");
      const status = searchParams.get("status");
      const reason = searchParams.get("reason");
      const orderId = searchParams.get("orderId");

      const where: any = {};

      // Filter by merchant if not admin
      if (user.role !== "SJFS_ADMIN") {
        where.order = {
          merchantId: user.merchantId,
        };
      }

      if (status) where.status = status;
      if (reason) where.reason = reason;
      if (orderId) where.orderId = orderId;

      const skip = (page - 1) * limit;

      const [returns, total] = await Promise.all([
        prisma.return.findMany({
          where,
          skip,
          take: limit,
          include: {
            order: {
              select: {
                id: true,
                orderNumber: true,
                customerName: true,
                customerEmail: true,
                totalAmount: true,
                status: true,
                merchant: {
                  select: {
                    id: true,
                    businessName: true,
                  },
                },
              },
            },
          },
          orderBy: { createdAt: "desc" },
        }),
        prisma.return.count({ where }),
      ]);

      return createResponse(
        {
          returns,
          pagination: {
            page,
            limit,
            total,
            pages: Math.ceil(total / limit),
          },
        },
        200,
        "Returns retrieved successfully"
      );
    } catch (error) {
      console.error("Get returns error:", error);
      return createErrorResponse("Failed to retrieve returns", 500);
    }
  }
);

// POST /api/returns
export const POST = withRole(
  ["SJFS_ADMIN", "MERCHANT_ADMIN", "MERCHANT_STAFF"],
  async (request: NextRequest, user) => {
    try {
      const body = await request.json();
      const returnData = createReturnSchema.parse(body);

      // Check if order exists
      const order = await prisma.order.findUnique({
        where: { id: returnData.orderId },
        include: {
          merchant: {
            select: {
              id: true,
              businessName: true,
            },
          },
        },
      });

      if (!order) {
        return createErrorResponse("Order not found", 404);
      }

      // Check permissions
      if (user.role !== "SJFS_ADMIN" && order.merchantId !== user.merchantId) {
        return createErrorResponse("Forbidden", 403);
      }

      // Check if return already exists for this order
      const existingReturn = await prisma.return.findFirst({
        where: { orderId: returnData.orderId },
      });

      if (existingReturn) {
        return createErrorResponse("Return already exists for this order", 400);
      }

      // Create return
      const newReturn = await prisma.return.create({
        data: {
          ...returnData,
          processedBy: user.userId,
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
                  businessName: true,
                },
              },
            },
          },
        },
      });

      // Log the creation
      await prisma.auditLog.create({
        data: {
          userId: user.userId,
          action: "CREATE_RETURN",
          entityType: "returns",
          entityId: newReturn.id,
          newValues: returnData,
        },
      });

      return createResponse(newReturn, 201, "Return created successfully");
    } catch (error) {
      console.error("Create return error:", error);
      if (error instanceof Error && error.message.includes("validation")) {
        return createErrorResponse("Invalid input data", 400);
      }
      return createErrorResponse("Failed to create return", 500);
    }
  }
);
