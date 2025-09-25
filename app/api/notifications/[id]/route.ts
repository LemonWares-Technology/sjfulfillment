import {
  createErrorResponse,
  createResponse,
  withAuth,
} from "@/app/lib/api-utils";
import { JWTPayload } from "@/app/lib/auth";
import { prisma } from "@/app/lib/prisma";
import { NextRequest } from "next/server";

// PUT /api/notifications/[id]/read
export const PUT = withAuth(
  async (
    request: NextRequest,
    user: JWTPayload,
    { params }: { params: { id: string } }
  ) => {
    try {
      const notificationId = params.id;

      // Check if notification exists and belongs to user
      const notification = await prisma.notification.findFirst({
        where: {
          id: notificationId,
          userId: user.userId,
        },
      });

      if (!notification) {
        return createErrorResponse("Notification not found", 404);
      }

      // Mark as read
      const updatedNotification = await prisma.notification.update({
        where: { id: notificationId },
        data: { isRead: true },
      });

      return createResponse(
        updatedNotification,
        200,
        "Notification marked as read"
      );
    } catch (error) {
      console.error("Mark notification as read error:", error);
      return createErrorResponse("Failed to mark notification as read", 500);
    }
  }
);
