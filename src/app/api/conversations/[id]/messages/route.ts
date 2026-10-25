import { NextResponse } from "next/server";
import { connectDB } from "@/lib/db/connect";
import { requireAuth } from "@/lib/auth/session";
import { Conversation } from "@/models/Conversation";
import { Message } from "@/models/Message";
import { Notification } from "@/models/Notification";
import { getPresignedViewUrl } from "@/lib/storage/s3";

export async function GET(
  req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await requireAuth();
    await connectDB();
    const { id } = await params;

    const convo = await Conversation.findById(id);
    if (!convo) {
      return NextResponse.json({ error: "Conversation not found" }, { status: 404 });
    }

    // Security check: resident can only read their own conversation
    if (session.role === "resident" && convo.residentId.toString() !== session.userId) {
      return NextResponse.json({ error: "Access denied" }, { status: 403 });
    }

    const messages = await Message.find({ conversationId: id })
      .sort({ createdAt: 1 })
      .lean();

    // Reset unread counts and mark messages as read
    if (session.role === "admin") {
      convo.unreadCountAdmin = 0;
      await convo.save();
      await Message.updateMany(
        { conversationId: id, senderRole: "resident", isRead: false },
        { isRead: true }
      );
    } else {
      convo.unreadCountResident = 0;
      await convo.save();
      await Message.updateMany(
        { conversationId: id, senderRole: "admin", isRead: false },
        { isRead: true }
      );
    }

    const enrichedMessages = await Promise.all(
      messages.map(async (m) => {
        let attachmentUrl = "";
        if (m.attachmentKey) {
          attachmentUrl = await getPresignedViewUrl(m.attachmentKey, 900);
        }
        return {
          ...m,
          attachmentUrl,
        };
      })
    );

    return NextResponse.json({ messages: enrichedMessages, conversation: convo });
  } catch (error: any) {
    console.error("[Messages GET API] Error:", error);
    return NextResponse.json(
      { error: error.message || "Failed to load messages" },
      { status: 500 }
    );
  }
}

export async function POST(
  req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await requireAuth();
    await connectDB();
    const { id } = await params;
    const { text, attachmentKey } = await req.json();

    if (!text && !attachmentKey) {
      return NextResponse.json({ error: "Message text or attachment is required" }, { status: 400 });
    }

    const convo = await Conversation.findById(id);
    if (!convo) {
      return NextResponse.json({ error: "Conversation not found" }, { status: 404 });
    }

    if (session.role === "resident" && convo.residentId.toString() !== session.userId) {
      return NextResponse.json({ error: "Access denied" }, { status: 403 });
    }

    const message = await Message.create({
      conversationId: convo._id,
      senderId: session.userId,
      senderRole: session.role,
      text: text?.trim() || "Sent an attachment",
      attachmentKey,
      isRead: false,
    });

    convo.lastMessageText = text?.trim() || "Sent an attachment";
    convo.lastMessageAt = new Date();
    if (session.role === "admin") {
      convo.unreadCountResident += 1;
      await Notification.create({
        userId: convo.residentId,
        title: "New Message from Management",
        message: text?.slice(0, 100) || "You have a new message.",
        type: "notice",
        link: "/resident/messages",
      });
    } else {
      convo.unreadCountAdmin += 1;
      await Notification.create({
        targetRole: "admin",
        title: `New Message from ${session.name}`,
        message: text?.slice(0, 100) || "Resident sent a message.",
        type: "notice",
        link: `/admin/messages?conversationId=${convo._id}`,
      });
    }
    await convo.save();

    return NextResponse.json({
      success: true,
      message,
    });
  } catch (error: any) {
    console.error("[Send Message API] Error:", error);
    return NextResponse.json(
      { error: error.message || "Failed to send message" },
      { status: 500 }
    );
  }
}
