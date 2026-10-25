import { NextResponse } from "next/server";
import { connectDB } from "@/lib/db/connect";
import { requireAuth } from "@/lib/auth/session";
import { NoticeRead } from "@/models/NoticeRead";

export async function POST(
  req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await requireAuth();
    await connectDB();
    const { id } = await params;

    await NoticeRead.findOneAndUpdate(
      { noticeId: id, userId: session.userId },
      { noticeId: id, userId: session.userId, readAt: new Date() },
      { upsert: true }
    );

    return NextResponse.json({ success: true });
  } catch (error: any) {
    return NextResponse.json({ error: "Failed to mark notice read" }, { status: 500 });
  }
}
