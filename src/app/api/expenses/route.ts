import { NextResponse } from "next/server";
import { connectDB } from "@/lib/db/connect";
import { requireAdmin } from "@/lib/auth/session";
import { Expense } from "@/models/Expense";
import { AuditLog } from "@/models/AuditLog";
import { getPresignedViewUrl } from "@/lib/storage/s3";

export async function GET(req: Request) {
  try {
    await requireAdmin();
    await connectDB();

    const { searchParams } = new URL(req.url);
    const category = searchParams.get("category");
    const paymentMethod = searchParams.get("paymentMethod");
    const paidBy = searchParams.get("paidBy");
    const period = searchParams.get("period"); // "today" | "this_month" | "last_month" | "last_3_months" | "this_year" | "custom"
    const startDate = searchParams.get("startDate"); // "YYYY-MM-DD"
    const endDate = searchParams.get("endDate"); // "YYYY-MM-DD"
    const month = searchParams.get("month"); // "YYYY-MM"
    const search = searchParams.get("search")?.toLowerCase().trim() || "";

    const query: any = {};

    if (category && category !== "all") {
      query.category = category;
    }

    if (paymentMethod && paymentMethod !== "all") {
      query.paymentMethod = paymentMethod;
    }

    if (paidBy && paidBy !== "all") {
      query.paidBy = paidBy;
    }

    // Time period filtering
    const now = new Date();
    if (startDate || endDate) {
      const dateFilter: any = {};
      if (startDate) {
        const s = new Date(startDate);
        s.setHours(0, 0, 0, 0);
        dateFilter.$gte = s;
      }
      if (endDate) {
        const e = new Date(endDate);
        e.setHours(23, 59, 59, 999);
        dateFilter.$lte = e;
      }
      query.expenseDate = dateFilter;
    } else if (period && period !== "all") {
      if (period === "today") {
        const start = new Date(now.getFullYear(), now.getMonth(), now.getDate(), 0, 0, 0);
        const end = new Date(now.getFullYear(), now.getMonth(), now.getDate(), 23, 59, 59, 999);
        query.expenseDate = { $gte: start, $lte: end };
      } else if (period === "this_month") {
        const start = new Date(now.getFullYear(), now.getMonth(), 1, 0, 0, 0);
        const end = new Date(now.getFullYear(), now.getMonth() + 1, 0, 23, 59, 59, 999);
        query.expenseDate = { $gte: start, $lte: end };
      } else if (period === "last_month") {
        const start = new Date(now.getFullYear(), now.getMonth() - 1, 1, 0, 0, 0);
        const end = new Date(now.getFullYear(), now.getMonth(), 0, 23, 59, 59, 999);
        query.expenseDate = { $gte: start, $lte: end };
      } else if (period === "last_3_months") {
        const start = new Date(now.getFullYear(), now.getMonth() - 2, 1, 0, 0, 0);
        const end = new Date(now.getFullYear(), now.getMonth() + 1, 0, 23, 59, 59, 999);
        query.expenseDate = { $gte: start, $lte: end };
      } else if (period === "this_year") {
        const start = new Date(now.getFullYear(), 0, 1, 0, 0, 0);
        const end = new Date(now.getFullYear(), 11, 31, 23, 59, 59, 999);
        query.expenseDate = { $gte: start, $lte: end };
      }
    } else if (month && month !== "all") {
      const [year, m] = month.split("-").map(Number);
      const start = new Date(year, m - 1, 1);
      const end = new Date(year, m, 0, 23, 59, 59);
      query.expenseDate = { $gte: start, $lte: end };
    }

    if (search) {
      query.$or = [
        { title: { $regex: search, $options: "i" } },
        { vendor: { $regex: search, $options: "i" } },
        { paidBy: { $regex: search, $options: "i" } },
        { description: { $regex: search, $options: "i" } },
      ];
    }

    const expenses = await Expense.find(query)
      .populate("createdBy", "name")
      .sort({ expenseDate: -1 })
      .lean();

    const enrichedExpenses = await Promise.all(
      expenses.map(async (exp) => {
        let receiptViewUrl = "";
        if (exp.receiptKey) {
          receiptViewUrl = await getPresignedViewUrl(exp.receiptKey, 900);
        }
        return {
          ...exp,
          receiptViewUrl,
        };
      })
    );

    const totalAmount = expenses.reduce((acc, e) => acc + e.amount, 0);

    // Group by category, payment method, and payer
    const categoryBreakdown: Record<string, number> = {};
    const paymentMethodBreakdown: Record<string, number> = {};
    const paidByBreakdown: Record<string, number> = {};

    expenses.forEach((e) => {
      categoryBreakdown[e.category] = (categoryBreakdown[e.category] || 0) + e.amount;
      if (e.paymentMethod) {
        paymentMethodBreakdown[e.paymentMethod] =
          (paymentMethodBreakdown[e.paymentMethod] || 0) + e.amount;
      }
      if (e.paidBy) {
        paidByBreakdown[e.paidBy] = (paidByBreakdown[e.paidBy] || 0) + e.amount;
      }
    });

    return NextResponse.json({
      expenses: enrichedExpenses,
      summary: {
        totalAmount,
        count: expenses.length,
        averageAmount: expenses.length > 0 ? Math.round(totalAmount / expenses.length) : 0,
        categoryBreakdown,
        paymentMethodBreakdown,
        paidByBreakdown,
      },
    });
  } catch (error: any) {
    console.error("[Expenses API] Error:", error);
    return NextResponse.json(
      { error: error.message || "Failed to fetch expenses" },
      { status: 500 }
    );
  }
}

export async function POST(req: Request) {
  try {
    const adminSession = await requireAdmin();
    await connectDB();

    const {
      title,
      category,
      amount,
      expenseDate,
      paymentMethod = "upi",
      paidBy,
      vendor,
      description,
      receiptKey,
    } = await req.json();

    if (!title || !category || !amount || !expenseDate) {
      return NextResponse.json(
        { error: "Title, category, amount, and expense date are required" },
        { status: 400 }
      );
    }

    const expense = await Expense.create({
      title: title.trim(),
      category,
      amount: Number(amount),
      expenseDate: new Date(expenseDate),
      paymentMethod,
      paidBy: paidBy?.trim(),
      vendor: vendor?.trim(),
      description: description?.trim(),
      receiptKey,
      createdBy: adminSession.userId,
    });

    await AuditLog.create({
      actorId: adminSession.userId,
      actorRole: "admin",
      action: "CREATE_EXPENSE",
      entityType: "Expense",
      entityId: expense._id.toString(),
      details: { title: expense.title, amount: expense.amount, category: expense.category },
    });

    return NextResponse.json({
      success: true,
      message: "Expense recorded successfully",
      expense,
    });
  } catch (error: any) {
    console.error("[Create Expense API] Error:", error);
    return NextResponse.json(
      { error: error.message || "Failed to record expense" },
      { status: 500 }
    );
  }
}
