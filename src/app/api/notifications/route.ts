import { NextResponse } from "next/server";
import { connectDB } from "@/lib/db/connect";
import { requireAuth } from "@/lib/auth/session";
import { Notification } from "@/models/Notification";

export async function GET() {
  try {
    const session = await requireAuth();
    await connectDB();

    const query: any = {
      $or: [
        { userId: session.userId },
        { targetRole: session.role },
      ],
    };

    const notifications = await Notification.find(query)
      .sort({ createdAt: -1 })
      .limit(30)
      .lean();

    const unreadCount = notifications.filter((n) => !n.isRead).length;

    return NextResponse.json({ notifications, unreadCount });
  } catch (error: any) {
    console.error("[Notifications API] Error:", error);
    return NextResponse.json(
      { error: error.message || "Failed to fetch notifications" },
      { status: 500 }
    );
  }
}

export async function POST(req: Request) {
  try {
    const session = await requireAuth();
    await connectDB();

    // Mark all read for this user/role
    await Notification.updateMany(
      {
        $or: [
          { userId: session.userId },
          { targetRole: session.role },
        ],
        isRead: false,
      },
      { isRead: true }
    );

    return NextResponse.json({ success: true, message: "All notifications marked as read" });
  } catch (error: any) {
    return NextResponse.json({ error: "Failed to update notifications" }, { status: 500 });
  }
}
