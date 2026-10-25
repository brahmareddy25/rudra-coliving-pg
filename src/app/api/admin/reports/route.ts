import { NextResponse } from "next/server";
import { connectDB } from "@/lib/db/connect";
import { requireAdmin } from "@/lib/auth/session";
import { User } from "@/models/User";
import { Bed } from "@/models/Bed";
import { RentDue } from "@/models/RentDue";
import { Payment } from "@/models/Payment";
import { Expense } from "@/models/Expense";
import { ElectricityPayment } from "@/models/ElectricityPayment";
import { Issue } from "@/models/Issue";

export async function GET(req: Request) {
  try {
    await requireAdmin();
    await connectDB();

    const { searchParams } = new URL(req.url);
    const type = searchParams.get("type") || "financial"; // "financial", "occupancy", "expenses", "residents"

    if (type === "occupancy") {
      const beds = await Bed.find()
        .populate("currentResidentId", "name mobile")
        .sort({ floorNumber: 1, roomNumber: 1, bedNumber: 1 })
        .lean();

      return NextResponse.json({
        report: beds.map((b: any) => ({
          floor: `Floor ${b.floorNumber}`,
          room: b.roomNumber,
          bed: b.bedNumber,
          status: b.status,
          monthlyRent: b.monthlyRent,
          occupantName: b.currentResidentId?.name || "N/A",
          occupantMobile: b.currentResidentId?.mobile || "N/A",
        })),
      });
    }

    if (type === "expenses") {
      const expenses = await Expense.find().sort({ expenseDate: -1 }).lean();
      return NextResponse.json({
        report: expenses.map((e) => ({
          title: e.title,
          category: e.category,
          amount: e.amount,
          date: e.expenseDate.toISOString().slice(0, 10),
          paymentMethod: e.paymentMethod,
          vendor: e.vendor || "N/A",
          description: e.description || "",
        })),
      });
    }

    if (type === "residents") {
      const residents = await User.find({ role: "resident" })
        .sort({ name: 1 })
        .lean();
      const beds = await Bed.find({ status: "occupied" }).lean();
      const bedMap = new Map();
      beds.forEach((b) => {
        if (b.currentResidentId) {
          bedMap.set(b.currentResidentId.toString(), b);
        }
      });

      return NextResponse.json({
        report: residents.map((r) => {
          const b = bedMap.get(r._id.toString());
          return {
            name: r.name,
            mobile: r.mobile,
            email: r.email || "N/A",
            status: r.status,
            roomNumber: b?.roomNumber || "Unassigned",
            bedNumber: b?.bedNumber || "Unassigned",
            registrationDate: r.createdAt.toISOString().slice(0, 10),
          };
        }),
      });
    }

    // Default: Financial Report (Rent collections, expenses, electricity, Net operating result)
    const dues = await RentDue.find().sort({ billingMonth: -1 }).lean();
    const payments = await Payment.find({ status: "verified" }).lean();
    const expenses = await Expense.find().lean();
    const electricity = await ElectricityPayment.find().lean();

    // Group by month
    const months = Array.from(new Set(dues.map((d) => d.billingMonth))).sort().reverse();

    const monthlyFinancials = months.map((month) => {
      const monthDues = dues.filter((d) => d.billingMonth === month);
      const totalBilled = monthDues.reduce((acc, d) => acc + d.rentAmount, 0);
      const totalCollected = monthDues.reduce((acc, d) => acc + d.totalPaidAmount, 0);
      const outstanding = monthDues.reduce((acc, d) => acc + d.balanceAmount, 0);

      const [y, m] = month.split("-").map(Number);
      const start = new Date(y, m - 1, 1);
      const end = new Date(y, m, 0, 23, 59, 59);

      const monthExpenses = expenses.filter((e) => e.expenseDate >= start && e.expenseDate <= end);
      const totalExpenses = monthExpenses.reduce((acc, e) => acc + e.amount, 0);

      const monthElectricity = electricity.find((el) => el.billingMonth === month);
      const electricityReceived = monthElectricity ? monthElectricity.actualAmountReceived : 0;

      const recognizedIncome = totalCollected + electricityReceived;
      const netOperatingResult = recognizedIncome - totalExpenses;

      return {
        month,
        totalBilled,
        totalCollected,
        outstanding,
        electricityReceived,
        totalExpenses,
        netOperatingResult,
      };
    });

    return NextResponse.json({ report: monthlyFinancials });
  } catch (error: any) {
    console.error("[Reports API] Error:", error);
    return NextResponse.json(
      { error: error.message || "Failed to generate report" },
      { status: 500 }
    );
  }
}
