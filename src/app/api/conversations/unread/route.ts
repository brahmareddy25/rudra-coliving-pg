import { NextResponse } from "next/server";
import { connectDB } from "@/lib/db/connect";
import { requireAuth } from "@/lib/auth/session";
import { Conversation } from "@/models/Conversation";

export async function GET() {
  try {
    const session = await requireAuth();
    await connectDB();

    let unreadCount = 0;
    if (session.role === "admin") {
      const convos = await Conversation.find({}, "unreadCountAdmin").lean();
      unreadCount = convos.reduce((sum, c) => sum + (c.unreadCountAdmin || 0), 0);
    } else {
      const convo = await Conversation.findOne(
        { residentId: session.userId },
        "unreadCountResident"
      ).lean();
      unreadCount = convo?.unreadCountResident || 0;
    }

    return NextResponse.json({ unreadCount });
  } catch (error: any) {
    return NextResponse.json({ unreadCount: 0 });
  }
}
