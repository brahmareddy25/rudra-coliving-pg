import { NextResponse } from "next/server";
import { connectDB } from "@/lib/db/connect";
import { requireAdmin } from "@/lib/auth/session";
import { Expense } from "@/models/Expense";
import { AuditLog } from "@/models/AuditLog";

export async function PATCH(
  req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const adminSession = await requireAdmin();
    await connectDB();
    const { id } = await params;
    const body = await req.json();

    const expense = await Expense.findById(id);
    if (!expense) {
      return NextResponse.json({ error: "Expense not found" }, { status: 404 });
    }

    if (body.title) expense.title = body.title.trim();
    if (body.category) expense.category = body.category;
    if (body.amount) expense.amount = Number(body.amount);
    if (body.expenseDate) expense.expenseDate = new Date(body.expenseDate);
    if (body.paymentMethod) expense.paymentMethod = body.paymentMethod;
    if (body.paidBy !== undefined) expense.paidBy = body.paidBy.trim();
    if (body.vendor !== undefined) expense.vendor = body.vendor.trim();
    if (body.description !== undefined) expense.description = body.description.trim();
    if (body.receiptKey !== undefined) expense.receiptKey = body.receiptKey;

    await expense.save();

    await AuditLog.create({
      actorId: adminSession.userId,
      actorRole: "admin",
      action: "UPDATE_EXPENSE",
      entityType: "Expense",
      entityId: expense._id.toString(),
      details: { title: expense.title, amount: expense.amount },
    });

    return NextResponse.json({
      success: true,
      message: "Expense updated successfully",
      expense,
    });
  } catch (error: any) {
    console.error("[Update Expense API] Error:", error);
    return NextResponse.json(
      { error: error.message || "Failed to update expense" },
      { status: 500 }
    );
  }
}

export async function DELETE(
  req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const adminSession = await requireAdmin();
    await connectDB();
    const { id } = await params;

    const expense = await Expense.findById(id);
    if (!expense) {
      return NextResponse.json({ error: "Expense not found" }, { status: 404 });
    }

    await Expense.deleteOne({ _id: id });

    await AuditLog.create({
      actorId: adminSession.userId,
      actorRole: "admin",
      action: "DELETE_EXPENSE",
      entityType: "Expense",
      entityId: id,
      details: { title: expense.title, amount: expense.amount },
    });

    return NextResponse.json({ success: true, message: "Expense deleted successfully" });
  } catch (error: any) {
    console.error("[Delete Expense API] Error:", error);
    return NextResponse.json(
      { error: error.message || "Failed to delete expense" },
      { status: 500 }
    );
  }
}
