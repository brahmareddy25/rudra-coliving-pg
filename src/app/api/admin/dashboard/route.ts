import { NextResponse } from "next/server";
import { connectDB } from "@/lib/db/connect";
import { requireAdmin } from "@/lib/auth/session";
import { User } from "@/models/User";
import { ResidentProfile } from "@/models/ResidentProfile";
import { Bed } from "@/models/Bed";
import { RentDue } from "@/models/RentDue";
import { Payment } from "@/models/Payment";
import { ElectricityPayment } from "@/models/ElectricityPayment";
import { Expense } from "@/models/Expense";
import { Issue } from "@/models/Issue";
import { Conversation } from "@/models/Conversation";
import { AuditLog } from "@/models/AuditLog";

export async function GET() {
  try {
    await requireAdmin();
    await connectDB();

    const currentMonth = new Date().toISOString().slice(0, 7); // "YYYY-MM"

    // 1. Bed & Resident counts
    const totalResidents = await User.countDocuments({ role: "resident" });
    const beds = await Bed.find().lean();
    const totalBeds = beds.length;
    const occupiedBeds = beds.filter((b) => b.status === "occupied").length;
    const availableBeds = beds.filter((b) => b.status === "available").length;
    const reservedBeds = beds.filter((b) => b.status === "reserved").length;
    const maintenanceBeds = beds.filter((b) => b.status === "maintenance").length;
    const occupancyPercentage = totalBeds > 0 ? Math.round((occupiedBeds / totalBeds) * 100) : 0;

    // 2. Financial Metrics for Current Month
    const currentRentDues = await RentDue.find({ billingMonth: currentMonth }).lean();
    const rentCollectedThisMonth = currentRentDues.reduce((acc, d) => acc + d.totalPaidAmount, 0);
    const outstandingResidentRent = currentRentDues.reduce((acc, d) => acc + d.balanceAmount, 0);

    // Current month expenses
    const [currYear, currM] = currentMonth.split("-").map(Number);
    const startOfMonth = new Date(currYear, currM - 1, 1);
    const endOfMonth = new Date(currYear, currM, 0, 23, 59, 59);

    const monthlyExpensesRecords = await Expense.find({
      expenseDate: { $gte: startOfMonth, $lte: endOfMonth },
    }).lean();
    const monthlyOperatingExpenses = monthlyExpensesRecords.reduce((acc, e) => acc + e.amount, 0);

    // Current month electricity
    const electricityThisMonth = await ElectricityPayment.findOne({ billingMonth: currentMonth }).lean();
    const electricityAmountReceived = electricityThisMonth ? electricityThisMonth.actualAmountReceived : 0;

    // Pending approvals & open issues
    const pendingDocumentApprovals = await ResidentProfile.countDocuments({
      idVerificationStatus: "pending_review",
    });
    const pendingPaymentApprovals = await Payment.countDocuments({
      status: "pending_verification",
    });
    const openMaintenanceIssues = await Issue.countDocuments({
      status: { $in: ["open", "working_on_it", "waiting_for_resident"] },
    });
    const allConvos = await Conversation.find({}, "unreadCountAdmin").lean();
    const unreadMessages = allConvos.reduce(
      (sum: number, c: any) => sum + (c.unreadCountAdmin || 0),
      0
    );

    // 3. Recharts Data Aggregations
    // A. Occupancy by floor
    const occupancyByFloor = [1, 2, 3, 4].map((floorNum) => {
      const floorBeds = beds.filter((b) => b.floorNumber === floorNum);
      const occupied = floorBeds.filter((b) => b.status === "occupied").length;
      return {
        floor: `Floor ${floorNum}`,
        total: floorBeds.length,
        occupied,
        available: floorBeds.length - occupied,
        rate: floorBeds.length > 0 ? Math.round((occupied / floorBeds.length) * 100) : 0,
      };
    });

    // B. Monthly Rent Collection vs Expenses Trend (Last 5 months)
    const trendMonths: string[] = [];
    for (let i = 4; i >= 0; i--) {
      const d = new Date(currYear, currM - 1 - i, 1);
      trendMonths.push(d.toISOString().slice(0, 7));
    }

    const allDues = await RentDue.find({ billingMonth: { $in: trendMonths } }).lean();
    const allExpenses = await Expense.find({
      expenseDate: {
        $gte: new Date(currYear, currM - 6, 1),
        $lte: endOfMonth,
      },
    }).lean();

    const monthlyTrends = trendMonths.map((m) => {
      const monthDues = allDues.filter((d) => d.billingMonth === m);
      const collected = monthDues.reduce((acc, d) => acc + d.totalPaidAmount, 0);
      const duesTotal = monthDues.reduce((acc, d) => acc + d.rentAmount, 0);

      const [y, mon] = m.split("-").map(Number);
      const mStart = new Date(y, mon - 1, 1);
      const mEnd = new Date(y, mon, 0, 23, 59, 59);
      const mExpenses = allExpenses.filter((e) => e.expenseDate >= mStart && e.expenseDate <= mEnd);
      const expensesTotal = mExpenses.reduce((acc, e) => acc + e.amount, 0);

      return {
        month: m,
        collected,
        totalDue: duesTotal,
        expenses: expensesTotal,
        netOperatingResult: collected - expensesTotal,
      };
    });

    // C. Expenses by Category
    const categoryMap: Record<string, number> = {};
    monthlyExpensesRecords.forEach((e) => {
      const catName = e.category.replace(/_/g, " ").replace(/\b\w/g, (l) => l.toUpperCase());
      categoryMap[catName] = (categoryMap[catName] || 0) + e.amount;
    });
    const expensesByCategory = Object.entries(categoryMap).map(([category, amount]) => ({
      category,
      amount,
    }));

    // D. Issue status breakdown
    const allIssues = await Issue.find().lean();
    const issuesByStatus = [
      { name: "Open", count: allIssues.filter((i) => i.status === "open").length },
      { name: "In Progress", count: allIssues.filter((i) => i.status === "working_on_it").length },
      { name: "Waiting", count: allIssues.filter((i) => i.status === "waiting_for_resident").length },
      { name: "Resolved", count: allIssues.filter((i) => i.status === "resolved").length },
      { name: "Closed", count: allIssues.filter((i) => i.status === "closed").length },
    ];

    // 4. Activity Feed (Recent audit logs, registrations, payments, issues)
    const recentAudit = await AuditLog.find()
      .populate("actorId", "name")
      .sort({ createdAt: -1 })
      .limit(10)
      .lean();

    return NextResponse.json({
      summary: {
        totalResidents,
        totalBeds,
        occupiedBeds,
        availableBeds,
        reservedBeds,
        maintenanceBeds,
        occupancyPercentage,
        rentCollectedThisMonth,
        outstandingResidentRent,
        monthlyOperatingExpenses,
        electricityAmountReceived,
        pendingDocumentApprovals,
        pendingPaymentApprovals,
        openMaintenanceIssues,
        unreadMessages,
        netOperatingResult: rentCollectedThisMonth - monthlyOperatingExpenses,
      },
      charts: {
        occupancyByFloor,
        monthlyTrends,
        expensesByCategory,
        issuesByStatus,
      },
      recentActivity: recentAudit,
    });
  } catch (error: any) {
    console.error("[Dashboard API] Error:", error);
    return NextResponse.json(
      { error: error.message || "Failed to load dashboard metrics" },
      { status: 500 }
    );
  }
}
