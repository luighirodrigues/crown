import { NextRequest } from "next/server";
import { notificationRepository } from "@/repositories/notification.repository";
import { requireAuth, handleAuthError } from "@/lib/auth/rbac";

export async function GET() {
  try {
    const user = await requireAuth();
    const [notifications, unreadCount] = await Promise.all([
      notificationRepository.findByUser(user.id),
      notificationRepository.countUnread(user.id),
    ]);
    return Response.json({ notifications, unreadCount });
  } catch (error) {
    return handleAuthError(error);
  }
}

export async function PATCH(request: NextRequest) {
  try {
    const user = await requireAuth();
    const body = await request.json();

    if (body.markAllRead) {
      await notificationRepository.markAllAsRead(user.id);
    } else if (body.id) {
      await notificationRepository.markAsRead(body.id, user.id);
    }

    return Response.json({ success: true });
  } catch (error) {
    return handleAuthError(error);
  }
}
