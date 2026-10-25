import { NextResponse } from "next/server";
import { connectDB } from "@/lib/db/connect";
import { requireAdmin } from "@/lib/auth/session";
import { Bed } from "@/models/Bed";
import { User } from "@/models/User";
import { ResidentProfile } from "@/models/ResidentProfile";
import { BedAllocation } from "@/models/BedAllocation";
import { Notification } from "@/models/Notification";
import { AuditLog } from "@/models/AuditLog";
import { Conversation } from "@/models/Conversation";
import { Message } from "@/models/Message";
import { RentDue } from "@/models/RentDue";
import { Payment } from "@/models/Payment";
import { Issue } from "@/models/Issue";

export async function POST(req: Request) {
  try {
    const adminSession = await requireAdmin();
    await connectDB();

    const { bedId, moveOutDate, notes } = await req.json();

    if (!bedId) {
      return NextResponse.json({ error: "Bed ID is required" }, { status: 400 });
    }

    const bed = await Bed.findById(bedId);
    if (!bed) {
      return NextResponse.json({ error: "Bed not found" }, { status: 404 });
    }

    if (bed.status !== "occupied" || !bed.currentResidentId) {
      return NextResponse.json(
        { error: "This bed is not currently occupied" },
        { status: 400 }
      );
    }

    const resident = await User.findById(bed.currentResidentId);
    const residentName = resident?.name || "Resident";
    const residentMobile = resident?.mobile || "";
    const previousResidentId = bed.currentResidentId;
    const departureDate = moveOutDate ? new Date(moveOutDate) : new Date();

    // 1. Clear Bed and mark Available
    bed.status = "available";
    bed.currentResidentId = undefined;
    await bed.save();

    // 2. Delete Resident Account and all associated records
    await User.findByIdAndDelete(previousResidentId);
    await ResidentProfile.findOneAndDelete({ userId: previousResidentId });
    await BedAllocation.deleteMany({ residentId: previousResidentId });
    await Conversation.deleteMany({ residentId: previousResidentId });
    await Message.deleteMany({ senderId: previousResidentId });
    await Notification.deleteMany({ userId: previousResidentId });
    await RentDue.deleteMany({ residentId: previousResidentId });
    await Payment.deleteMany({ residentId: previousResidentId });
    await Issue.deleteMany({ residentId: previousResidentId });

    // 3. Record Audit Log
    await AuditLog.create({
      actorId: adminSession.userId,
      actorRole: "admin",
      action: "DEALLOCATE_BED_AND_DELETE_RESIDENT",
      entityType: "Bed",
      entityId: bed._id.toString(),
      details: {
        bedNumber: bed.bedNumber,
        residentName,
        residentMobile,
        deletedResidentId: previousResidentId.toString(),
        moveOutDate: departureDate,
        notes: notes || "Bed deallocated and resident account deleted",
      },
    });

    return NextResponse.json({
      success: true,
      message: `Bed ${bed.bedNumber} has been deallocated to available, and resident account for ${residentName} (+91 ${residentMobile}) has been deleted.`,
    });
  } catch (error: any) {
    console.error("[Deallocate Bed API] Error:", error);
    return NextResponse.json(
      { error: error.message || "Failed to deallocate bed" },
      { status: 500 }
    );
  }
}
