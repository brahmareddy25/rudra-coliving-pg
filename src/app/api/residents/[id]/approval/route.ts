import { NextResponse } from "next/server";
import { connectDB } from "@/lib/db/connect";
import { requireAdmin } from "@/lib/auth/session";
import { User } from "@/models/User";
import { ResidentProfile } from "@/models/ResidentProfile";
import { Notification } from "@/models/Notification";
import { AuditLog } from "@/models/AuditLog";

export async function PATCH(
  req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const adminSession = await requireAdmin();
    await connectDB();
    const { id } = await params;
    const { action, reason } = await req.json();

    if (!["approve", "reject", "request_resubmission"].includes(action)) {
      return NextResponse.json({ error: "Invalid approval action" }, { status: 400 });
    }

    const user = await User.findById(id);
    if (!user) {
      return NextResponse.json({ error: "Resident not found" }, { status: 404 });
    }

    const profile = await ResidentProfile.findOne({ userId: user._id });
    if (!profile) {
      return NextResponse.json({ error: "Resident profile not found" }, { status: 404 });
    }

    if (action === "approve") {
      user.status = "active";
      profile.idVerificationStatus = "approved";
      profile.idRejectionReason = undefined;
      await user.save();
      await profile.save();

      await Notification.create({
        userId: user._id,
        title: "Account & Documents Approved! 🎉",
        message: "Your resident profile and identity documents have been approved by property management. You now have full access to resident services.",
        type: "approval",
        link: "/resident",
      });

      await AuditLog.create({
        actorId: adminSession.userId,
        actorRole: "admin",
        action: "APPROVE_RESIDENT",
        entityType: "User",
        entityId: user._id.toString(),
        details: { residentName: user.name, mobile: user.mobile },
      });

      return NextResponse.json({
        success: true,
        message: `${user.name} has been approved successfully.`,
      });
    }

    if (action === "reject") {
      if (!reason) {
        return NextResponse.json({ error: "Please provide a reason for rejection" }, { status: 400 });
      }

      profile.idVerificationStatus = "rejected";
      profile.idRejectionReason = reason.trim();
      await profile.save();

      await Notification.create({
        userId: user._id,
        title: "Document Verification Rejected",
        message: `Your identity document verification was not accepted. Reason: ${reason}. Please update your documents.`,
        type: "approval",
        link: "/resident/profile",
      });

      await AuditLog.create({
        actorId: adminSession.userId,
        actorRole: "admin",
        action: "REJECT_RESIDENT_DOCUMENTS",
        entityType: "User",
        entityId: user._id.toString(),
        details: { residentName: user.name, reason },
      });

      return NextResponse.json({
        success: true,
        message: `Document rejection recorded for ${user.name}.`,
      });
    }

    if (action === "request_resubmission") {
      profile.idVerificationStatus = "resubmission_required";
      profile.idRejectionReason = reason ? reason.trim() : "Please upload a clearer copy of your Aadhaar card and photo.";
      await profile.save();

      await Notification.create({
        userId: user._id,
        title: "Document Resubmission Required",
        message: profile.idRejectionReason,
        type: "approval",
        link: "/resident/profile",
      });

      await AuditLog.create({
        actorId: adminSession.userId,
        actorRole: "admin",
        action: "REQUEST_DOC_RESUBMISSION",
        entityType: "User",
        entityId: user._id.toString(),
        details: { residentName: user.name, reason: profile.idRejectionReason },
      });

      return NextResponse.json({
        success: true,
        message: `Resubmission requested from ${user.name}.`,
      });
    }
  } catch (error: any) {
    console.error("[Approval API] Error:", error);
    return NextResponse.json(
      { error: error.message || "Failed to update approval status" },
      { status: 500 }
    );
  }
}
