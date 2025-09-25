import { NextRequest } from "next/server";

import { JWTPayload } from "@/app/lib/auth";
import {
  createErrorResponse,
  createResponse,
  withRole,
} from "@/app/lib/api-utils";
import { prisma } from "@/app/lib/prisma";
import { createWarehouseSchema } from "@/app/lib/validations";

// GET /api/warehouses
export const GET = withRole(
  ["SJFS_ADMIN", "WAREHOUSE_STAFF"],
  async (request: NextRequest, user: JWTPayload) => {
    try {
      const { searchParams } = new URL(request.url);
      const page = parseInt(searchParams.get("page") || "1");
      const limit = parseInt(searchParams.get("limit") || "10");
      const city = searchParams.get("city");
      const state = searchParams.get("state");
      const isActive = searchParams.get("isActive");

      const where: any = {};
      if (city) where.city = city;
      if (state) where.state = state;
      if (isActive !== null) where.isActive = isActive === "true";

      const skip = (page - 1) * limit;

      const [warehouses, total] = await Promise.all([
        prisma.warehouseLocation.findMany({
          where,
          skip,
          take: limit,
          include: {
            merchants: {
              select: {
                id: true,
                businessName: true,
                businessEmail: true,
              },
            },
            zones: {
              select: {
                id: true,
                name: true,
                code: true,
                capacity: true,
                isActive: true,
              },
            },
            stockItems: {
              select: {
                id: true,
                quantity: true,
                availableQuantity: true,
                reservedQuantity: true,
              },
            },
            orders: {
              where: {
                status: {
                  in: ["PENDING", "PROCESSING", "PICKED", "PACKED", "SHIPPED"],
                },
              },
              select: {
                id: true,
                orderNumber: true,
                status: true,
                totalAmount: true,
              },
            },
            _count: {
              select: {
                stockItems: true,
                orders: true,
              },
            },
          },
          orderBy: { createdAt: "desc" },
        }),
        prisma.warehouseLocation.count({ where }),
      ]);

      return createResponse(
        {
          warehouses,
          pagination: {
            page,
            limit,
            total,
            pages: Math.ceil(total / limit),
          },
        },
        200,
        "Warehouses retrieved successfully"
      );
    } catch (error) {
      console.error("Get warehouses error:", error);
      return createErrorResponse("Failed to retrieve warehouses", 500);
    }
  }
);

// POST /api/warehouses
export const POST = withRole(
  ["SJFS_ADMIN"],
  async (request: NextRequest, user) => {
    try {
      const body = await request.json();
      const warehouseData = createWarehouseSchema.parse(body);

      // Check if warehouse code already exists
      const existingWarehouse = await prisma.warehouseLocation.findUnique({
        where: { code: warehouseData.code },
      });

      if (existingWarehouse) {
        return createErrorResponse(
          "Warehouse with this code already exists",
          400
        );
      }

      // Create warehouse
      const newWarehouse = await prisma.warehouseLocation.create({
        data: warehouseData,
        include: {
          merchants: {
            select: {
              id: true,
              businessName: true,
            },
          },
        },
      });

      // Log the creation
      await prisma.auditLog.create({
        data: {
          userId: user.userId,
          action: "CREATE_WAREHOUSE",
          entityType: "warehouse_locations",
          entityId: newWarehouse.id,
          newValues: warehouseData,
        },
      });

      return createResponse(
        newWarehouse,
        201,
        "Warehouse created successfully"
      );
    } catch (error) {
      console.error("Create warehouse error:", error);
      if (error instanceof Error && error.message.includes("validation")) {
        return createErrorResponse("Invalid input data", 400);
      }
      return createErrorResponse("Failed to create warehouse", 500);
    }
  }
);
