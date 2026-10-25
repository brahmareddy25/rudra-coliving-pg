import { NextResponse } from "next/server";
import { connectDB } from "@/lib/db/connect";
import { requireAuth } from "@/lib/auth/session";
import { Issue } from "@/models/Issue";
import { Bed } from "@/models/Bed";
import { Notification } from "@/models/Notification";
import { AuditLog } from "@/models/AuditLog";
import { getPresignedViewUrl } from "@/lib/storage/s3";

export async function GET(req: Request) {
  try {
    const session = await requireAuth();
    await connectDB();

    const { searchParams } = new URL(req.url);
    const status = searchParams.get("status");
    const category = searchParams.get("category");
    const priority = searchParams.get("priority");

    const query: any = {};

    // Resident only sees their own issues
    if (session.role === "resident") {
      query.residentId = session.userId;
    }

    if (status && status !== "all") query.status = status;
    if (category && category !== "all") query.category = category;
    if (priority && priority !== "all") query.priority = priority;

    const issues = await Issue.find(query)
      .populate("residentId", "name mobile avatarUrl")
      .sort({ createdAt: -1 })
      .lean();

    // Enrich attachments with presigned view URLs
    const enrichedIssues = await Promise.all(
      issues.map(async (issue) => {
        const enrichedAttachments = await Promise.all(
          (issue.attachments || []).map(async (key) => {
            const url = await getPresignedViewUrl(key, 900);
            return { key, url };
          })
        );
        return {
          ...issue,
          attachmentDetails: enrichedAttachments,
        };
      })
    );

    const summary = {
      total: issues.length,
      open: issues.filter((i) => i.status === "open").length,
      workingOnIt: issues.filter((i) => i.status === "working_on_it").length,
      resolved: issues.filter((i) => i.status === "resolved").length,
      closed: issues.filter((i) => i.status === "closed").length,
    };

    return NextResponse.json({ issues: enrichedIssues, summary });
  } catch (error: any) {
    console.error("[Issues API] Error:", error);
    return NextResponse.json(
      { error: error.message || "Failed to fetch issues" },
      { status: 500 }
    );
  }
}

export async function POST(req: Request) {
  try {
    const session = await requireAuth();
    await connectDB();

    const { title, category, description, priority = "medium", attachments = [] } = await req.json();

    if (!title || !category || !description) {
      return NextResponse.json(
        { error: "Title, category, and description are required" },
        { status: 400 }
      );
    }

    // Derive room & bed number from resident's active allocation if resident
    let roomNumber = 101;
    let bedNumber = "";

    const activeBed = await Bed.findOne({ currentResidentId: session.userId });
    if (activeBed) {
      roomNumber = activeBed.roomNumber;
      bedNumber = activeBed.bedNumber;
    }

    const issue = await Issue.create({
      title: title.trim(),
      category,
      description: description.trim(),
      attachments,
      residentId: session.userId,
      roomNumber,
      bedNumber,
      priority,
      status: "open",
    });

    // Notify Admin of new issue
    await Notification.create({
      targetRole: "admin",
      title: "New Maintenance Issue Raised",
      message: `${session.name} (Room ${roomNumber}) reported: ${title}`,
      type: "issue",
      link: "/admin/issues",
    });

    return NextResponse.json({
      success: true,
      message: "Maintenance request submitted successfully",
      issue,
    });
  } catch (error: any) {
    console.error("[Create Issue API] Error:", error);
    return NextResponse.json(
      { error: error.message || "Failed to create issue" },
      { status: 500 }
    );
  }
}
