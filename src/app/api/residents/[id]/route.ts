import { NextResponse } from "next/server";
import { connectDB } from "@/lib/db/connect";
import { requireAuth } from "@/lib/auth/session";
import { User } from "@/models/User";
import { ResidentProfile } from "@/models/ResidentProfile";
import { Bed } from "@/models/Bed";
import { Room } from "@/models/Room";
import { BedAllocation } from "@/models/BedAllocation";
import { RentDue } from "@/models/RentDue";
import { Payment } from "@/models/Payment";
import { Issue } from "@/models/Issue";
import { getPresignedViewUrl } from "@/lib/storage/s3";

export async function GET(
  req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await requireAuth();
    await connectDB();
    const { id } = await params;

    // Security check: only admin can view another resident's profile
    if (session.role !== "admin" && session.userId !== id) {
      return NextResponse.json({ error: "Access denied" }, { status: 403 });
    }

    const user = await User.findById(id).lean();
    if (!user) {
      return NextResponse.json({ error: "Resident not found" }, { status: 404 });
    }

    const profile = await ResidentProfile.findOne({ userId: user._id }).lean();
    const currentBed = await Bed.findOne({ currentResidentId: user._id }).lean();
    let currentRoom = null;
    if (currentBed) {
      currentRoom = await Room.findById(currentBed.roomId).lean();
    }

    // Historical bed allocations
    const allocationHistory = await BedAllocation.find({ residentId: user._id })
      .populate("bedId", "bedNumber roomNumber floorNumber")
      .populate("allocatedBy", "name")
      .sort({ createdAt: -1 })
      .lean();

    // Rent dues and payments
    const rentDues = await RentDue.find({ residentId: user._id })
      .sort({ billingMonth: -1 })
      .lean();

    const payments = await Payment.find({ residentId: user._id })
      .populate("rentDueId", "billingMonth rentAmount")
      .sort({ createdAt: -1 })
      .lean();

    // Maintenance issues
    const issues = await Issue.find({ residentId: user._id })
      .sort({ createdAt: -1 })
      .lean();

    // Generate secure presigned URLs for documents
    let aadhaarViewUrl = "";
    let photoViewUrl = "";
    if (profile?.idDocumentKey) {
      aadhaarViewUrl = await getPresignedViewUrl(profile.idDocumentKey, 900);
    }
    if (profile?.photoDocumentKey) {
      photoViewUrl = await getPresignedViewUrl(profile.photoDocumentKey, 900);
    }

    return NextResponse.json({
      resident: {
        id: user._id,
        name: user.name,
        mobile: user.mobile,
        email: user.email,
        role: user.role,
        status: user.status,
        otpBlocked: !!user.otpBlocked,
        failedOtpAttempts: user.failedOtpAttempts || 0,
        otpBlockedReason: user.otpBlockedReason,
        otpBlockedAt: user.otpBlockedAt,
        createdAt: user.createdAt,
        avatarUrl: user.avatarUrl,
        profile,
        assignedBed: currentBed
          ? {
              id: currentBed._id,
              bedNumber: currentBed.bedNumber,
              monthlyRent: currentBed.monthlyRent,
              roomNumber: currentRoom?.roomNumber,
              floorNumber: currentRoom?.floorNumber,
              amenities: currentRoom?.amenities || [],
            }
          : null,
        documents: {
          aadhaarKey: profile?.idDocumentKey,
          aadhaarViewUrl,
          photoKey: profile?.photoDocumentKey,
          photoViewUrl,
          verificationStatus: profile?.idVerificationStatus || "not_uploaded",
          rejectionReason: profile?.idRejectionReason,
        },
        allocationHistory,
        rentDues,
        payments,
        issues,
      },
    });
  } catch (error: any) {
    console.error("[Resident Detail API] Error:", error);
    return NextResponse.json(
      { error: error.message || "Failed to load resident profile" },
      { status: 500 }
    );
  }
}
