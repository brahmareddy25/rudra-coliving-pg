import { NextResponse } from "next/server";
import { connectDB } from "@/lib/db/connect";
import { requireAuth } from "@/lib/auth/session";
import { Issue } from "@/models/Issue";
import { Notification } from "@/models/Notification";
import { AuditLog } from "@/models/AuditLog";

export async function PATCH(
  req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await requireAuth();
    await connectDB();
    const { id } = await params;
    const body = await req.json();

    const issue = await Issue.findById(id);
    if (!issue) {
      return NextResponse.json({ error: "Issue not found" }, { status: 404 });
    }

    // Residents can only add replies or reopen/close their own issues
    if (session.role === "resident" && issue.residentId.toString() !== session.userId) {
      return NextResponse.json({ error: "Unauthorized access to this issue" }, { status: 403 });
    }

    const previousStatus = issue.status;

    if (session.role === "admin") {
      if (body.status) issue.status = body.status;
      if (body.priority) issue.priority = body.priority;
      if (body.adminNotes !== undefined) issue.adminNotes = body.adminNotes.trim();
      if (body.status === "resolved" && previousStatus !== "resolved") {
        issue.resolvedAt = new Date();
      }

      await issue.save();

      // If status changed, notify resident
      if (body.status && body.status !== previousStatus) {
        await Notification.create({
          userId: issue.residentId,
          title: `Issue Status Updated: ${body.status.replace(/_/g, " ").toUpperCase()}`,
          message: `Your maintenance request "${issue.title}" is now marked as "${body.status.replace(/_/g, " ")}".`,
          type: "issue",
          link: "/resident/issues",
        });

        await AuditLog.create({
          actorId: session.userId,
          actorRole: "admin",
          action: "UPDATE_ISSUE_STATUS",
          entityType: "Issue",
          entityId: issue._id.toString(),
          details: { previousStatus, newStatus: body.status, title: issue.title },
        });
      }
    } else {
      // Resident updating their own issue
      if (body.residentReply) {
        issue.residentReply = body.residentReply.trim();
        await issue.save();

        await Notification.create({
          targetRole: "admin",
          title: "Resident Replied to Issue",
          message: `${session.name} added a note on issue "${issue.title}".`,
          type: "issue",
          link: "/admin/issues",
        });
      }
      if (body.status === "closed") {
        issue.status = "closed";
        await issue.save();
      }
    }

    return NextResponse.json({
      success: true,
      message: "Issue updated successfully",
      issue,
    });
  } catch (error: any) {
    console.error("[Update Issue API] Error:", error);
    return NextResponse.json(
      { error: error.message || "Failed to update issue" },
      { status: 500 }
    );
  }
}
