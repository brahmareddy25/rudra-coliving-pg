import { NextResponse } from "next/server";
import { connectDB } from "@/lib/db/connect";
import { requireAdmin } from "@/lib/auth/session";
import { Payment } from "@/models/Payment";
import { RentDue } from "@/models/RentDue";
import { Notification } from "@/models/Notification";
import { AuditLog } from "@/models/AuditLog";

export async function PATCH(
  req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const adminSession = await requireAdmin();
    await connectDB();
    const { id } = await params;
    const { action, rejectionReason } = await req.json();

    if (!["approve", "reject"].includes(action)) {
      return NextResponse.json({ error: "Invalid action" }, { status: 400 });
    }

    const payment = await Payment.findById(id);
    if (!payment) {
      return NextResponse.json({ error: "Payment record not found" }, { status: 404 });
    }

    if (payment.status !== "pending_verification") {
      return NextResponse.json(
        { error: `Payment is already ${payment.status}` },
        { status: 400 }
      );
    }

    const rentDue = await RentDue.findById(payment.rentDueId);
    if (!rentDue) {
      return NextResponse.json({ error: "Associated rent due not found" }, { status: 404 });
    }

    if (action === "approve") {
      payment.status = "verified";
      payment.verifiedBy = adminSession.userId as any;
      payment.verifiedAt = new Date();
      await payment.save();

      // Recalculate Rent Due
      rentDue.totalPaidAmount += payment.amount;
      rentDue.balanceAmount = Math.max(0, rentDue.rentAmount - rentDue.totalPaidAmount);
      rentDue.dueStatus = rentDue.balanceAmount === 0 ? "paid" : "partially_paid";
      await rentDue.save();

      await Notification.create({
        userId: payment.residentId,
        title: "Payment Approved! ✅",
        message: `Your payment of ₹${payment.amount.toLocaleString("en-IN")} for ${rentDue.billingMonth} has been approved.`,
        type: "payment",
        link: "/resident/payments",
      });

      await AuditLog.create({
        actorId: adminSession.userId,
        actorRole: "admin",
        action: "APPROVE_PAYMENT",
        entityType: "Payment",
        entityId: payment._id.toString(),
        details: { amount: payment.amount, transactionRef: payment.transactionRef },
      });

      return NextResponse.json({
        success: true,
        message: "Payment approved and verified successfully.",
        payment,
      });
    }

    if (action === "reject") {
      payment.status = "rejected";
      payment.rejectionReason = rejectionReason?.trim() || "Payment proof could not be verified.";
      await payment.save();

      await Notification.create({
        userId: payment.residentId,
        title: "Payment Rejected ⚠️",
        message: `Your payment submission of ₹${payment.amount.toLocaleString("en-IN")} was rejected. Reason: ${payment.rejectionReason}`,
        type: "payment",
        link: "/resident/payments",
      });

      await AuditLog.create({
        actorId: adminSession.userId,
        actorRole: "admin",
        action: "REJECT_PAYMENT",
        entityType: "Payment",
        entityId: payment._id.toString(),
        details: { reason: payment.rejectionReason, amount: payment.amount },
      });

      return NextResponse.json({
        success: true,
        message: "Payment submission rejected.",
        payment,
      });
    }
  } catch (error: any) {
    console.error("[Verify Payment API] Error:", error);
    return NextResponse.json(
      { error: error.message || "Failed to update payment status" },
      { status: 500 }
    );
  }
}
