import { NextResponse } from "next/server";
import { connectDB } from "@/lib/db/connect";
import { requireAuth } from "@/lib/auth/session";
import { RentDue } from "@/models/RentDue";
import { BedAllocation } from "@/models/BedAllocation";

export async function GET(req: Request) {
  try {
    const session = await requireAuth();
    await connectDB();

    const { searchParams } = new URL(req.url);
    const month = searchParams.get("month");
    const status = searchParams.get("status");

    const query: any = {};

    // Residents can only view their own dues
    if (session.role === "resident") {
      query.residentId = session.userId;
    }

    if (month && month !== "all") {
      query.billingMonth = month;
    }

    if (status && status !== "all") {
      query.dueStatus = status;
    }

    const dues = await RentDue.find(query)
      .populate("residentId", "name mobile email")
      .populate({
        path: "bedAllocationId",
        populate: {
          path: "bedId",
          select: "bedNumber roomNumber floorNumber",
        },
      })
      .sort({ billingMonth: -1, dueDate: -1 })
      .lean();

    const summary = {
      totalDues: dues.reduce((acc, d) => acc + d.rentAmount, 0),
      totalCollected: dues.reduce((acc, d) => acc + d.totalPaidAmount, 0),
      totalOutstanding: dues.reduce((acc, d) => acc + d.balanceAmount, 0),
      count: dues.length,
      paidCount: dues.filter((d) => d.dueStatus === "paid").length,
      pendingCount: dues.filter((d) => d.dueStatus === "pending").length,
      partiallyPaidCount: dues.filter((d) => d.dueStatus === "partially_paid").length,
      overdueCount: dues.filter((d) => d.dueStatus === "overdue").length,
    };

    return NextResponse.json({ dues, summary });
  } catch (error: any) {
    console.error("[Rent Dues API] Error:", error);
    return NextResponse.json(
      { error: error.message || "Failed to fetch rent dues" },
      { status: 500 }
    );
  }
}
