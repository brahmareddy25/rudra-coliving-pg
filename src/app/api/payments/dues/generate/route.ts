import { NextResponse } from "next/server";
import { connectDB } from "@/lib/db/connect";
import { requireAdmin } from "@/lib/auth/session";
import { BedAllocation } from "@/models/BedAllocation";
import { RentDue } from "@/models/RentDue";
import { Notification } from "@/models/Notification";
import { AuditLog } from "@/models/AuditLog";

export async function POST(req: Request) {
  try {
    const adminSession = await requireAdmin();
    await connectDB();

    const { billingMonth, dueDay = 5 } = await req.json();

    if (!billingMonth || !/^\d{4}-\d{2}$/.test(billingMonth)) {
      return NextResponse.json(
        { error: "Valid billing month in format YYYY-MM is required" },
        { status: 400 }
      );
    }

    // Find all active bed allocations
    const activeAllocations = await BedAllocation.find({ status: "active" })
      .populate("residentId", "name mobile")
      .populate("bedId", "bedNumber")
      .lean();

    if (activeAllocations.length === 0) {
      return NextResponse.json({
        success: true,
        message: "No active resident allocations found to generate dues for.",
        createdCount: 0,
        skippedCount: 0,
      });
    }

    const [year, month] = billingMonth.split("-").map(Number);
    const dueDate = new Date(year, month - 1, dueDay);

    let createdCount = 0;
    let skippedCount = 0;

    for (const alloc of activeAllocations) {
      // Check existing due for this resident & month (Idempotency)
      const existing = await RentDue.findOne({
        residentId: alloc.residentId._id,
        billingMonth,
      });

      if (existing) {
        skippedCount++;
        continue;
      }

      const rentAmount = alloc.monthlyRentAgreed;

      await RentDue.create({
        residentId: alloc.residentId._id,
        bedAllocationId: alloc._id,
        billingMonth,
        rentAmount,
        totalPaidAmount: 0,
        balanceAmount: rentAmount,
        dueStatus: "pending",
        dueDate,
      });

      createdCount++;

      // Send notification to resident
      await Notification.create({
        userId: alloc.residentId._id,
        title: `Rent Due for ${billingMonth}`,
        message: `Monthly rent of ₹${rentAmount.toLocaleString("en-IN")} is due by ${dueDate.toLocaleDateString("en-IN")}.`,
        type: "payment",
        link: "/resident/payments",
      });
    }

    await AuditLog.create({
      actorId: adminSession.userId,
      actorRole: "admin",
      action: "GENERATE_RENT_DUES",
      entityType: "RentDue",
      details: { billingMonth, createdCount, skippedCount },
    });

    return NextResponse.json({
      success: true,
      message: `Rent dues for ${billingMonth} generated successfully. ${createdCount} created, ${skippedCount} already existed.`,
      createdCount,
      skippedCount,
    });
  } catch (error: any) {
    console.error("[Generate Dues API] Error:", error);
    return NextResponse.json(
      { error: error.message || "Failed to generate monthly rent dues" },
      { status: 500 }
    );
  }
}
