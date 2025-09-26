import { NextRequest } from "next/server";
import { prisma } from "../../../lib/prisma";
import {
  createResponse,
  createErrorResponse,
  withRole,
} from "../../../lib/api-utils";
import { JWTPayload } from "../../../lib/auth";
import { updateMerchantSchema } from "../../../lib/validations";

// GET /api/merchants/[id]
export const GET = withRole(
  ["SJFS_ADMIN", "MERCHANT_ADMIN"],
  async (
    request: NextRequest,
    user: JWTPayload,
    { params }: { params: Promise<{ id: string }> }
  ) => {
    try {
      const { id: merchantId } = await params;

      // Check permissions
      if (user.role === "MERCHANT_ADMIN" && user.merchantId !== merchantId) {
        return createErrorResponse("Forbidden", 403);
      }

      const merchant = await prisma.merchant.findUnique({
        where: { id: merchantId },
        include: {
          users: {
            select: {
              id: true,
              firstName: true,
              lastName: true,
              email: true,
              phone: true,
              role: true,
              isActive: true,
              lastLogin: true,
              createdAt: true,
            },
          },
          subscriptions: {
            include: {
              servicePlan: {
                select: {
                  id: true,
                  name: true,
                  description: true,
                  basePrice: true,
                  features: true,
                },
              },
              addons: {
                include: {
                  addonService: {
                    select: {
                      id: true,
                      name: true,
                      description: true,
                      price: true,
                      pricingType: true,
                    },
                  },
                },
              },
            },
          },
          products: {
            select: {
              id: true,
              sku: true,
              name: true,
              category: true,
              isActive: true,
              createdAt: true,
            },
            orderBy: { createdAt: "desc" },
            take: 10,
          },
          orders: {
            select: {
              id: true,
              orderNumber: true,
              status: true,
              totalAmount: true,
              createdAt: true,
            },
            orderBy: { createdAt: "desc" },
            take: 10,
          },
          warehouses: {
            select: {
              id: true,
              name: true,
              code: true,
              city: true,
              state: true,
              isActive: true,
            },
          },
          billingRecords: {
            where: { status: "PENDING" },
            select: {
              id: true,
              billingType: true,
              description: true,
              amount: true,
              dueDate: true,
            },
            orderBy: { dueDate: "asc" },
          },
          _count: {
            select: {
              products: true,
              orders: true,
              users: true,
            },
          },
        },
      });

      if (!merchant) {
        return createErrorResponse("Merchant not found", 404);
      }

      return createResponse(merchant, 200, "Merchant retrieved successfully");
    } catch (error) {
      console.error("Get merchant error:", error);
      return createErrorResponse("Failed to retrieve merchant", 500);
    }
  }
);

// PUT /api/merchants/[id]
export const PUT = withRole(
  ["SJFS_ADMIN", "MERCHANT_ADMIN"],
  async (
    request: NextRequest,
    user,
    { params }: { params: Promise<{ id: string }> }
  ) => {
    try {
      const { id: merchantId } = await params;
      const body = await request.json();
      const updateData = updateMerchantSchema.parse(body);

      // Check if merchant exists
      const existingMerchant = await prisma.merchant.findUnique({
        where: { id: merchantId },
        select: { id: true, onboardingStatus: true },
      });

      if (!existingMerchant) {
        return createErrorResponse("Merchant not found", 404);
      }

      // Check permissions
      if (user.role === "MERCHANT_ADMIN" && user.merchantId !== merchantId) {
        return createErrorResponse("Forbidden", 403);
      }

      // Merchant admins cannot change onboarding status
      if (user.role === "MERCHANT_ADMIN") {
        delete updateData.onboardingStatus;
      }

      // Update merchant
      const updatedMerchant = await prisma.merchant.update({
        where: { id: merchantId },
        data: updateData,
        include: {
          users: {
            select: {
              id: true,
              firstName: true,
              lastName: true,
              email: true,
              role: true,
            },
          },
        },
      });

      // Log the change
      await prisma.auditLog.create({
        data: {
          userId: user.userId,
          action: "UPDATE_MERCHANT",
          entityType: "merchants",
          entityId: merchantId,
          newValues: updateData,
        },
      });

      return createResponse(
        updatedMerchant,
        200,
        "Merchant updated successfully"
      );
    } catch (error) {
      console.error("Update merchant error:", error);
      if (error instanceof Error && error.message.includes("validation")) {
        return createErrorResponse("Invalid input data", 400);
      }
      return createErrorResponse("Failed to update merchant", 500);
    }
  }
);

// DELETE /api/merchants/[id]
export const DELETE = withRole(
  ["SJFS_ADMIN"],
  async (
    request: NextRequest,
    user,
    { params }: { params: Promise<{ id: string }> }
  ) => {
    try {
      const { id: merchantId } = await params;

      // Check if merchant exists
      const existingMerchant = await prisma.merchant.findUnique({
        where: { id: merchantId },
        select: { id: true, businessName: true },
      });

      if (!existingMerchant) {
        return createErrorResponse("Merchant not found", 404);
      }

      // Soft delete by deactivating
      await prisma.merchant.update({
        where: { id: merchantId },
        data: { isActive: false },
      });

      // Log the change
      await prisma.auditLog.create({
        data: {
          userId: user.userId,
          action: "DELETE_MERCHANT",
          entityType: "merchants",
          entityId: merchantId,
        },
      });

      return createResponse(null, 200, "Merchant deactivated successfully");
    } catch (error) {
      console.error("Delete merchant error:", error);
      return createErrorResponse("Failed to delete merchant", 500);
    }
  }
);
