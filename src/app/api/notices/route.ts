import { NextResponse } from "next/server";
import { connectDB } from "@/lib/db/connect";
import { requireAuth } from "@/lib/auth/session";
import { Notice } from "@/models/Notice";
import { NoticeRead } from "@/models/NoticeRead";
import { Notification } from "@/models/Notification";
import { AuditLog } from "@/models/AuditLog";

export async function GET(req: Request) {
  try {
    const session = await requireAuth();
    await connectDB();

    const notices = await Notice.find()
      .populate("createdBy", "name")
      .sort({ isPinned: -1, createdAt: -1 })
      .lean();

    // If resident, check which notices have been read
    let readNoticeIds = new Set<string>();
    if (session.role === "resident") {
      const reads = await NoticeRead.find({ userId: session.userId }).lean();
      readNoticeIds = new Set(reads.map((r) => r.noticeId.toString()));
    }

    const noticesWithReadState = notices.map((n) => ({
      ...n,
      isRead: session.role === "resident" ? readNoticeIds.has(n._id.toString()) : true,
    }));

    return NextResponse.json({ notices: noticesWithReadState });
  } catch (error: any) {
    console.error("[Notices API] Error:", error);
    return NextResponse.json(
      { error: error.message || "Failed to fetch notices" },
      { status: 500 }
    );
  }
}

export async function POST(req: Request) {
  try {
    const session = await requireAuth();
    if (session.role !== "admin") {
      return NextResponse.json({ error: "Only admins can post notices" }, { status: 403 });
    }

    await connectDB();
    const { title, content, audience = "all", isPinned = false, expiresAt } = await req.json();

    if (!title || !content) {
      return NextResponse.json({ error: "Title and content are required" }, { status: 400 });
    }

    const notice = await Notice.create({
      title: title.trim(),
      content: content.trim(),
      audience,
      isPinned: Boolean(isPinned),
      expiresAt: expiresAt ? new Date(expiresAt) : undefined,
      createdBy: session.userId,
    });

    // Broadcast in-app notification to all residents
    await Notification.create({
      targetRole: "resident",
      title: `Notice: ${title}`,
      message: content.length > 100 ? `${content.slice(0, 100)}...` : content,
      type: "notice",
      link: "/resident/notices",
    });

    await AuditLog.create({
      actorId: session.userId,
      actorRole: "admin",
      action: "CREATE_NOTICE",
      entityType: "Notice",
      entityId: notice._id.toString(),
      details: { title, audience, isPinned },
    });

    return NextResponse.json({
      success: true,
      message: "Notice published successfully",
      notice,
    });
  } catch (error: any) {
    console.error("[Create Notice API] Error:", error);
    return NextResponse.json(
      { error: error.message || "Failed to publish notice" },
      { status: 500 }
    );
  }
}
