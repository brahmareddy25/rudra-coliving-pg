import { NextResponse } from "next/server";
import { connectDB } from "@/lib/db/connect";
import { requireAdmin } from "@/lib/auth/session";
import { User } from "@/models/User";
import { ResidentProfile } from "@/models/ResidentProfile";
import { Bed } from "@/models/Bed";
import { RentDue } from "@/models/RentDue";

export async function GET(req: Request) {
  try {
    await requireAdmin();
    await connectDB();

    const { searchParams } = new URL(req.url);
    const search = searchParams.get("search")?.toLowerCase().trim() || "";
    const floor = searchParams.get("floor");
    const room = searchParams.get("room");
    const approval = searchParams.get("approval"); // "all", "pending", "approved", "rejected"
    const occupancy = searchParams.get("occupancy"); // "all", "allocated", "unallocated"

    // 1. Fetch all residents
    const users = await User.find({ role: "resident" })
      .sort({ createdAt: -1 })
      .lean();

    // 2. Fetch associated profiles
    const profiles = await ResidentProfile.find().lean();
    const profileMap = new Map();
    profiles.forEach((p) => profileMap.set(p.userId.toString(), p));

    // 3. Fetch active beds
    const beds = await Bed.find({ status: "occupied" }).lean();
    const bedMap = new Map();
    beds.forEach((b) => {
      if (b.currentResidentId) {
        bedMap.set(b.currentResidentId.toString(), b);
      }
    });

    // 4. Fetch latest rent dues
    const currentMonth = new Date().toISOString().slice(0, 7);
    const rentDues = await RentDue.find({ billingMonth: currentMonth }).lean();
    const dueMap = new Map();
    rentDues.forEach((d) => dueMap.set(d.residentId.toString(), d));

    // 5. Combine and filter
    let residents = users.map((u) => {
      const prof = profileMap.get(u._id.toString());
      const bed = bedMap.get(u._id.toString());
      const due = dueMap.get(u._id.toString());

      return {
        id: u._id,
        name: u.name,
        mobile: u.mobile,
        email: u.email,
        status: u.status,
        otpBlocked: !!u.otpBlocked,
        failedOtpAttempts: u.failedOtpAttempts || 0,
        otpBlockedReason: u.otpBlockedReason,
        otpBlockedAt: u.otpBlockedAt,
        createdAt: u.createdAt,
        avatarUrl: u.avatarUrl,
        occupation: prof?.occupation || "",
        companyName: prof?.companyName || "",
        gender: prof?.gender || "",
        age: prof?.age || 0,
        permanentAddress: prof?.permanentAddress || "",
        idVerificationStatus: prof?.idVerificationStatus || "not_uploaded",
        idRejectionReason: prof?.idRejectionReason,
        idDocumentKey: prof?.idDocumentKey,
        photoDocumentKey: prof?.photoDocumentKey,
        moveInDate: prof?.moveInDate,
        assignedBed: bed
          ? {
              id: bed._id,
              bedNumber: bed.bedNumber,
              roomNumber: bed.roomNumber,
              floorNumber: bed.floorNumber,
              monthlyRent: bed.monthlyRent,
            }
          : null,
        currentRentDue: due
          ? {
              billingMonth: due.billingMonth,
              rentAmount: due.rentAmount,
              balanceAmount: due.balanceAmount,
              dueStatus: due.dueStatus,
            }
          : null,
      };
    });

    // Filter by search
    if (search) {
      residents = residents.filter(
        (r) =>
          r.name.toLowerCase().includes(search) ||
          r.mobile.includes(search) ||
          r.occupation.toLowerCase().includes(search) ||
          (r.assignedBed && r.assignedBed.bedNumber.toLowerCase().includes(search))
      );
    }

    // Filter by floor
    if (floor && floor !== "all") {
      const floorNum = parseInt(floor, 10);
      residents = residents.filter((r) => r.assignedBed?.floorNumber === floorNum);
    }

    // Filter by room
    if (room && room !== "all") {
      const roomNum = parseInt(room, 10);
      residents = residents.filter((r) => r.assignedBed?.roomNumber === roomNum);
    }

    // Filter by approval status
    if (approval && approval !== "all") {
      if (approval === "pending") {
        residents = residents.filter((r) => r.idVerificationStatus === "pending_review");
      } else if (approval === "approved") {
        residents = residents.filter((r) => r.idVerificationStatus === "approved");
      } else if (approval === "rejected") {
        residents = residents.filter((r) => r.idVerificationStatus === "rejected");
      } else if (approval === "not_uploaded") {
        residents = residents.filter((r) => r.idVerificationStatus === "not_uploaded");
      }
    }

    // Filter by occupancy
    if (occupancy && occupancy !== "all") {
      if (occupancy === "allocated") {
        residents = residents.filter((r) => r.assignedBed !== null);
      } else if (occupancy === "unallocated") {
        residents = residents.filter((r) => r.assignedBed === null);
      }
    }

    return NextResponse.json({ residents, totalCount: residents.length });
  } catch (error: any) {
    console.error("[Residents API] Error:", error);
    return NextResponse.json(
      { error: error.message || "Failed to fetch residents" },
      { status: 500 }
    );
  }
}
