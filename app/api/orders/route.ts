import { NextRequest } from "next/server";

import { JWTPayload } from "@/app/lib/auth";
import { prisma } from "@/app/lib/prisma";
import {
  createErrorResponse,
  createResponse,
  withRole,
} from "@/app/lib/api-utils";
import { createOrderSchema } from "@/app/lib/validations";

// GET /api/orders
export const GET = withRole(
  ["SJFS_ADMIN", "MERCHANT_ADMIN", "MERCHANT_STAFF", "WAREHOUSE_STAFF"],
  async (request: NextRequest, user: JWTPayload) => {
    try {
      const { searchParams } = new URL(request.url);
      const page = parseInt(searchParams.get("page") || "1");
      const limit = parseInt(searchParams.get("limit") || "10");
      const status = searchParams.get("status");
      const warehouseId = searchParams.get("warehouseId");
      const paymentMethod = searchParams.get("paymentMethod");
      const dateFrom = searchParams.get("dateFrom");
      const dateTo = searchParams.get("dateTo");
      const search = searchParams.get("search");

      const where: any = {};

      // Filter by merchant if not admin
      if (user.role !== "SJFS_ADMIN") {
        where.merchantId = user.merchantId;
      }

      if (status) where.status = status;
      if (warehouseId) where.warehouseId = warehouseId;
      if (paymentMethod) where.paymentMethod = paymentMethod;
      if (search) {
        where.OR = [
          { orderNumber: { contains: search, mode: "insensitive" } },
          { customerName: { contains: search, mode: "insensitive" } },
          { customerEmail: { contains: search, mode: "insensitive" } },
          { customerPhone: { contains: search, mode: "insensitive" } },
        ];
      }

      if (dateFrom || dateTo) {
        where.createdAt = {};
        if (dateFrom) where.createdAt.gte = new Date(dateFrom);
        if (dateTo) where.createdAt.lte = new Date(dateTo);
      }

      const skip = (page - 1) * limit;

      const [orders, total] = await Promise.all([
        prisma.order.findMany({
          where,
          skip,
          take: limit,
          include: {
            merchant: {
              select: {
                id: true,
                businessName: true,
              },
            },
            warehouse: {
              select: {
                id: true,
                name: true,
                code: true,
              },
            },
            orderItems: {
              include: {
                product: {
                  select: {
                    id: true,
                    sku: true,
                    name: true,
                    category: true,
                  },
                },
              },
            },
            statusHistory: {
              orderBy: { createdAt: "desc" },
              take: 5,
            },
            orderSplits: {
              select: {
                id: true,
                warehouseId: true,
                status: true,
                trackingNumber: true,
              },
            },
            _count: {
              select: {
                returns: true,
              },
            },
          },
          orderBy: { createdAt: "desc" },
        }),
        prisma.order.count({ where }),
      ]);

      return createResponse(
        {
          orders,
          pagination: {
            page,
            limit,
            total,
            pages: Math.ceil(total / limit),
          },
        },
        200,
        "Orders retrieved successfully"
      );
    } catch (error) {
      console.error("Get orders error:", error);
      return createErrorResponse("Failed to retrieve orders", 500);
    }
  }
);

// POST /api/orders
export const POST = withRole(
  ["SJFS_ADMIN", "MERCHANT_ADMIN", "MERCHANT_STAFF"],
  async (request: NextRequest, user) => {
    try {
      const body = await request.json();
      const orderData = createOrderSchema.parse(body);

      // Set merchant ID
      const merchantId =
        user.role === "SJFS_ADMIN" ? body.merchantId : user.merchantId;
      if (!merchantId) {
        return createErrorResponse("Merchant ID is required", 400);
      }

      // Generate order number
      const orderNumber = `ORD-${Date.now()}-${Math.random()
        .toString(36)
        .substr(2, 9)
        .toUpperCase()}`;

      // Calculate total amount
      const itemsTotal = orderData.items.reduce(
        (sum, item) => sum + item.quantity * item.unitPrice,
        0
      );
      const totalAmount = itemsTotal + orderData.deliveryFee;

      // Validate products exist and belong to merchant
      const productIds = orderData.items.map((item) => item.productId);
      const products = await prisma.product.findMany({
        where: {
          id: { in: productIds },
          merchantId,
          isActive: true,
        },
        select: { id: true, sku: true, name: true },
      });

      if (products.length !== productIds.length) {
        return createErrorResponse("Some products not found or inactive", 400);
      }

      // Check stock availability
      const stockChecks = await Promise.all(
        orderData.items.map(async (item) => {
          const stockItems = await prisma.stockItem.findMany({
            where: {
              productId: item.productId,
              availableQuantity: { gte: item.quantity },
            },
            include: {
              warehouse: {
                select: { id: true, name: true },
              },
            },
          });

          return {
            item,
            availableStock: stockItems.reduce(
              (sum, stock) => sum + stock.availableQuantity,
              0
            ),
            warehouses: stockItems,
          };
        })
      );

      const insufficientStock = stockChecks.filter(
        (check) => check.availableStock < check.item.quantity
      );
      if (insufficientStock.length > 0) {
        return createErrorResponse("Insufficient stock for some items", 400);
      }

      // Create order
      const newOrder = await prisma.order.create({
        data: {
          orderNumber,
          merchantId,
          customerName: orderData.customerName,
          customerEmail: orderData.customerEmail,
          customerPhone: orderData.customerPhone,
          shippingAddress: orderData.shippingAddress,
          orderValue: itemsTotal,
          deliveryFee: orderData.deliveryFee,
          totalAmount,
          paymentMethod: orderData.paymentMethod,
          notes: orderData.notes,
          orderItems: {
            create: orderData.items.map((item) => ({
              productId: item.productId,
              quantity: item.quantity,
              unitPrice: item.unitPrice,
              totalPrice: item.quantity * item.unitPrice,
            })),
          },
        },
        include: {
          merchant: {
            select: {
              id: true,
              businessName: true,
            },
          },
          orderItems: {
            include: {
              product: {
                select: {
                  id: true,
                  sku: true,
                  name: true,
                },
              },
            },
          },
        },
      });

      // Create initial status history
      await prisma.orderStatusHistory.create({
        data: {
          orderId: newOrder.id,
          status: "PENDING",
          updatedBy: user.userId,
          notes: "Order created",
        },
      });

      // Reserve stock
      for (const check of stockChecks) {
        let remainingQuantity = check.item.quantity;

        for (const stockItem of check.warehouses) {
          if (remainingQuantity <= 0) break;

          const reserveAmount = Math.min(
            remainingQuantity,
            stockItem.availableQuantity
          );

          await prisma.stockItem.update({
            where: { id: stockItem.id },
            data: {
              reservedQuantity: { increment: reserveAmount },
              availableQuantity: { decrement: reserveAmount },
            },
          });

          // Create stock movement
          await prisma.stockMovement.create({
            data: {
              stockItemId: stockItem.id,
              movementType: "STOCK_OUT",
              quantity: reserveAmount,
              referenceType: "ORDER",
              referenceId: newOrder.id,
              performedBy: user.userId,
              notes: `Reserved for order ${newOrder.orderNumber}`,
            },
          });

          remainingQuantity -= reserveAmount;
        }
      }

      // Log the creation
      await prisma.auditLog.create({
        data: {
          userId: user.userId,
          action: "CREATE_ORDER",
          entityType: "orders",
          entityId: newOrder.id,
          newValues: orderData,
        },
      });

      return createResponse(newOrder, 201, "Order created successfully");
    } catch (error) {
      console.error("Create order error:", error);
      if (error instanceof Error && error.message.includes("validation")) {
        return createErrorResponse("Invalid input data", 400);
      }
      return createErrorResponse("Failed to create order", 500);
    }
  }
);
