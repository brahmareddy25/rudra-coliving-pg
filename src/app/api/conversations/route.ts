import { NextResponse } from "next/server";
import { connectDB } from "@/lib/db/connect";
import { requireAuth } from "@/lib/auth/session";
import { Conversation } from "@/models/Conversation";
import { User } from "@/models/User";
import { Bed } from "@/models/Bed";

export async function GET() {
  try {
    const session = await requireAuth();
    await connectDB();

    if (session.role === "admin") {
      const conversations = await Conversation.find()
        .populate("residentId", "name mobile avatarUrl status")
        .sort({ lastMessageAt: -1 })
        .lean();

      // Attach bed numbers for quick identification
      const beds = await Bed.find({ status: "occupied" }).lean();
      const bedMap = new Map();
      beds.forEach((b) => {
        if (b.currentResidentId) {
          bedMap.set(b.currentResidentId.toString(), b.bedNumber);
        }
      });

      const enriched = conversations.map((c: any) => ({
        ...c,
        bedNumber: c.residentId ? bedMap.get(c.residentId._id?.toString()) : null,
      }));

      return NextResponse.json({ conversations: enriched });
    } else {
      // Resident: find or create conversation with admin
      let convo: any = await Conversation.findOne({ residentId: session.userId }).lean();
      if (!convo) {
        const created = await Conversation.create({
          residentId: session.userId,
          lastMessageText: "Welcome to Rudra Co-Living! Reach out to management here.",
          lastMessageAt: new Date(),
          unreadCountAdmin: 0,
          unreadCountResident: 0,
        });
        convo = created.toObject();
      }

      return NextResponse.json({ conversation: convo });
    }
  } catch (error: any) {
    console.error("[Conversations API] Error:", error);
    return NextResponse.json(
      { error: error.message || "Failed to fetch conversations" },
      { status: 500 }
    );
  }
}
