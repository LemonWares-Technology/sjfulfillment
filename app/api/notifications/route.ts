import { NextRequest } from "next/server";

import { JWTPayload } from "@/app/lib/auth";
import { prisma } from "@/app/lib/prisma";
import {
  createErrorResponse,
  createResponse,
  withAuth,
} from "@/app/lib/api-utils";

// GET /api/notifications
export const GET = withAuth(async (request: NextRequest, user: JWTPayload) => {
  try {
    const { searchParams } = new URL(request.url);
    const page = parseInt(searchParams.get("page") || "1");
    const limit = parseInt(searchParams.get("limit") || "10");
    const isRead = searchParams.get("isRead");
    const type = searchParams.get("type");

    const where: any = {
      userId: user.userId,
    };

    if (isRead !== null) where.isRead = isRead === "true";
    if (type) where.type = type;

    const skip = (page - 1) * limit;

    const [notifications, total] = await Promise.all([
      prisma.notification.findMany({
        where,
        skip,
        take: limit,
        orderBy: { createdAt: "desc" },
      }),
      prisma.notification.count({ where }),
    ]);

    return createResponse(
      {
        notifications,
        pagination: {
          page,
          limit,
          total,
          pages: Math.ceil(total / limit),
        },
      },
      200,
      "Notifications retrieved successfully"
    );
  } catch (error) {
    console.error("Get notifications error:", error);
    return createErrorResponse("Failed to retrieve notifications", 500);
  }
});

// PUT /api/notifications/read-all
export const PUT = withAuth(async (request: NextRequest, user) => {
  try {
    // Mark all notifications as read
    await prisma.notification.updateMany({
      where: {
        userId: user.userId,
        isRead: false,
      },
      data: { isRead: true },
    });

    return createResponse(null, 200, "All notifications marked as read");
  } catch (error) {
    console.error("Mark all notifications as read error:", error);
    return createErrorResponse("Failed to mark all notifications as read", 500);
  }
});

// POST /api/notifications
export const POST = withAuth(async (request: NextRequest, user) => {
  try {
    const body = await request.json();
    const { userId, type, title, message, data } = body;

    if (!userId || !type || !title || !message) {
      return createErrorResponse(
        "User ID, type, title, and message are required",
        400
      );
    }

    // Check if target user exists
    const targetUser = await prisma.user.findUnique({
      where: { id: userId },
      select: { id: true, firstName: true, lastName: true },
    });

    if (!targetUser) {
      return createErrorResponse("Target user not found", 404);
    }

    // Create notification
    const notification = await prisma.notification.create({
      data: {
        userId,
        type,
        title,
        message,
        data,
      },
    });

    return createResponse(
      notification,
      201,
      "Notification created successfully"
    );
  } catch (error) {
    console.error("Create notification error:", error);
    return createErrorResponse("Failed to create notification", 500);
  }
});
