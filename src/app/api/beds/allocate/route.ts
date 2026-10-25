import { NextResponse } from "next/server";
import { connectDB } from "@/lib/db/connect";
import { requireAdmin } from "@/lib/auth/session";
import { hashPassword } from "@/lib/auth/password";
import { Bed } from "@/models/Bed";
import { Room } from "@/models/Room";
import { User } from "@/models/User";
import { ResidentProfile } from "@/models/ResidentProfile";
import { BedAllocation } from "@/models/BedAllocation";
import { RentDue } from "@/models/RentDue";
import { Notification } from "@/models/Notification";
import { AuditLog } from "@/models/AuditLog";

export async function POST(req: Request) {
  try {
    const adminSession = await requireAdmin();
    await connectDB();

    const {
      bedId,
      residentId,
      residentName,
      residentMobile,
      startDate,
      monthlyRent,
      notes,
    } = await req.json();

    if (!bedId || (!residentId && (!residentName || !residentMobile)) || !startDate) {
      return NextResponse.json(
        { error: "Bed, resident details (Name & Phone), and move-in start date are required" },
        { status: 400 }
      );
    }

    // 1. Fetch Bed & Room
    const bed = await Bed.findById(bedId);
    if (!bed) {
      return NextResponse.json({ error: "Bed not found" }, { status: 404 });
    }

    if (bed.status === "occupied") {
      return NextResponse.json(
        { error: "This bed is already occupied by another resident" },
        { status: 400 }
      );
    }

    const room = await Room.findById(bed.roomId);
    if (!room) {
      return NextResponse.json({ error: "Associated room not found" }, { status: 404 });
    }

    // Verify room capacity limit
    const currentOccupiedInRoom = await Bed.countDocuments({
      roomId: room._id,
      status: "occupied",
    });
    if (currentOccupiedInRoom >= room.maxBeds) {
      return NextResponse.json(
        { error: `Room ${room.roomNumber} has reached its maximum capacity of ${room.maxBeds} beds` },
        { status: 400 }
      );
    }

    let resident: any = null;
    let generatedTempPassword: string | null = null;
    const moveIn = new Date(startDate);

    // 2. Resolve or Create Resident
    if (residentName && residentMobile) {
      const cleanMobile = residentMobile.replace(/\D/g, "").slice(-10);
      if (cleanMobile.length !== 10) {
        return NextResponse.json(
          { error: "Please enter a valid 10-digit mobile number" },
          { status: 400 }
        );
      }
      if (residentName.trim().length < 2) {
        return NextResponse.json(
          { error: "Resident name must be at least 2 characters" },
          { status: 400 }
        );
      }

      const existingUser = await User.findOne({ mobile: cleanMobile });
      if (existingUser) {
        resident = existingUser;
      } else {
        // Generate random temporary password / OTP (6-digit numeric OTP)
        const randomCode = Math.floor(100000 + Math.random() * 900000).toString();
        generatedTempPassword = randomCode;
        const passwordHash = await hashPassword(generatedTempPassword);

        resident = await User.create({
          name: residentName.trim(),
          mobile: cleanMobile,
          email: `${cleanMobile}@rudracoliving.internal`,
          passwordHash,
          role: "resident",
          status: "pending_approval",
          mustChangePassword: true,
        });

        await ResidentProfile.create({
          userId: resident._id,
          idVerificationStatus: "not_uploaded",
          moveInDate: moveIn,
        });
      }
    } else if (residentId) {
      resident = await User.findById(residentId);
      if (!resident || resident.role !== "resident") {
        return NextResponse.json({ error: "Resident not found" }, { status: 404 });
      }
    }

    if (!resident) {
      return NextResponse.json({ error: "Could not identify resident" }, { status: 400 });
    }

    // 3. Ensure resident does not already have an active allocation
    const existingActiveAlloc = await BedAllocation.findOne({
      residentId: resident._id,
      status: "active",
    });
    if (existingActiveAlloc) {
      const activeBed = await Bed.findById(existingActiveAlloc.bedId);
      return NextResponse.json(
        {
          error: `Resident ${resident.name} (${resident.mobile}) already occupies bed ${activeBed?.bedNumber || "in another room"}. Please deallocate first.`,
        },
        { status: 400 }
      );
    }

    const rentToCharge = monthlyRent ? Number(monthlyRent) : bed.monthlyRent;

    // 4. Create Active Allocation Record
    const allocation = await BedAllocation.create({
      bedId: bed._id,
      residentId: resident._id,
      startDate: moveIn,
      monthlyRentAgreed: rentToCharge,
      status: "active",
      allocatedBy: adminSession.userId,
      notes: notes?.trim() || "",
    });

    // 5. Update Bed
    bed.status = "occupied";
    bed.currentResidentId = resident._id;
    bed.monthlyRent = rentToCharge;
    await bed.save();

    // 6. Update ResidentProfile
    await ResidentProfile.findOneAndUpdate(
      { userId: resident._id },
      { moveInDate: moveIn, moveOutDate: null }
    );

    // 7. Generate Current Month Rent Due (Idempotent)
    const currentMonth = new Date().toISOString().slice(0, 7); // "YYYY-MM"
    const existingDue = await RentDue.findOne({
      residentId: resident._id,
      billingMonth: currentMonth,
    });

    if (!existingDue) {
      const dueDate = new Date();
      dueDate.setDate(5); // 5th of current month
      if (new Date().getDate() > 5) {
        dueDate.setDate(dueDate.getDate() + 5);
      }

      await RentDue.create({
        residentId: resident._id,
        bedAllocationId: allocation._id,
        billingMonth: currentMonth,
        rentAmount: rentToCharge,
        totalPaidAmount: 0,
        balanceAmount: rentToCharge,
        dueStatus: "pending",
        dueDate,
      });
    }

    // 8. Notification to Resident
    await Notification.create({
      userId: resident._id,
      title: "Bed Allocation Confirmed",
      message: `You have been allocated Bed ${bed.bedNumber} (Room ${room.roomNumber}) with monthly rent of ₹${rentToCharge.toLocaleString("en-IN")}. Welcome!`,
      type: "allocation",
      link: "/resident/room",
    });

    // 9. Audit Log
    await AuditLog.create({
      actorId: adminSession.userId,
      actorRole: "admin",
      action: "ALLOCATE_BED",
      entityType: "Bed",
      entityId: bed._id.toString(),
      details: {
        bedNumber: bed.bedNumber,
        roomNumber: room.roomNumber,
        residentName: resident.name,
        monthlyRent: rentToCharge,
      },
    });

    return NextResponse.json({
      success: true,
      message: generatedTempPassword
        ? `Bed ${bed.bedNumber} allocated to ${resident.name}. Temporary login password: ${generatedTempPassword}`
        : `Bed ${bed.bedNumber} allocated to ${resident.name} successfully`,
      allocation,
      tempPassword: generatedTempPassword,
      resident: {
        _id: resident._id,
        name: resident.name,
        mobile: resident.mobile,
      },
    });
  } catch (error: any) {
    console.error("[Allocate Bed API] Error:", error);
    return NextResponse.json(
      { error: error.message || "Failed to allocate bed" },
      { status: 500 }
    );
  }
}
