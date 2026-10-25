import { NextResponse } from "next/server";
import { connectDB } from "@/lib/db/connect";
import { requireAuth } from "@/lib/auth/session";
import { ResidentProfile } from "@/models/ResidentProfile";
import { Notification } from "@/models/Notification";

export async function POST(req: Request) {
  try {
    const session = await requireAuth();
    await connectDB();

    const { aadhaarKey, photoKey } = await req.json();

    if (!aadhaarKey && !photoKey) {
      return NextResponse.json(
        { error: "At least one document key (Aadhaar or photo) must be provided" },
        { status: 400 }
      );
    }

    const profile = await ResidentProfile.findOne({ userId: session.userId });
    if (!profile) {
      return NextResponse.json({ error: "Resident profile not found" }, { status: 404 });
    }

    if (aadhaarKey) profile.idDocumentKey = aadhaarKey;
    if (photoKey) profile.photoDocumentKey = photoKey;

    profile.idVerificationStatus = "pending_review";
    profile.idRejectionReason = undefined;
    await profile.save();

    // Notify Admin of document submission
    await Notification.create({
      targetRole: "admin",
      title: "New Verification Documents Submitted",
      message: `${session.name} (+91 ${session.mobile}) submitted identity documents for verification.`,
      type: "approval",
      link: `/admin/approvals`,
    });

    return NextResponse.json({
      success: true,
      message: "Documents submitted successfully for review.",
      status: profile.idVerificationStatus,
    });
  } catch (error: any) {
    console.error("[Upload Documents API] Error:", error);
    return NextResponse.json(
      { error: error.message || "Failed to submit documents" },
      { status: 500 }
    );
  }
}
