import { NextResponse } from "next/server";
import { connectDB } from "@/lib/db/connect";
import { requireAuth } from "@/lib/auth/session";
import { Payment } from "@/models/Payment";
import { RentDue } from "@/models/RentDue";
import { Notification } from "@/models/Notification";
import { AuditLog } from "@/models/AuditLog";
import { getPresignedViewUrl } from "@/lib/storage/s3";

export async function GET(req: Request) {
  try {
    const session = await requireAuth();
    await connectDB();

    const { searchParams } = new URL(req.url);
    const status = searchParams.get("status");

    const query: any = {};
    if (session.role === "resident") {
      query.residentId = session.userId;
    }

    if (status && status !== "all") {
      query.status = status;
    }

    const payments = await Payment.find(query)
      .populate("residentId", "name mobile email")
      .populate("rentDueId", "billingMonth rentAmount balanceAmount")
      .populate("verifiedBy", "name")
      .sort({ createdAt: -1 })
      .lean();

    // Attach temporary presigned view URL for proof documents
    const enrichedPayments = await Promise.all(
      payments.map(async (p) => {
        let proofViewUrl = "";
        if (p.proofDocumentKey) {
          proofViewUrl = await getPresignedViewUrl(p.proofDocumentKey, 900);
        }
        return {
          ...p,
          proofViewUrl,
        };
      })
    );

    return NextResponse.json({ payments: enrichedPayments });
  } catch (error: any) {
    console.error("[Payments List API] Error:", error);
    return NextResponse.json(
      { error: error.message || "Failed to fetch payments" },
      { status: 500 }
    );
  }
}

export async function POST(req: Request) {
  try {
    const session = await requireAuth();
    await connectDB();

    const {
      rentDueId,
      residentId: targetResidentId,
      amount,
      paymentMethod,
      transactionRef,
      proofDocumentKey,
      notes,
      isDirectAdminVerification,
    } = await req.json();

    if (!rentDueId || !amount || !transactionRef) {
      return NextResponse.json(
        { error: "Rent due ID, amount, and transaction reference are required" },
        { status: 400 }
      );
    }

    const rentDue = await RentDue.findById(rentDueId);
    if (!rentDue) {
      return NextResponse.json({ error: "Rent due record not found" }, { status: 404 });
    }

    // Determine resident ID
    const effectiveResidentId =
      session.role === "admin" && targetResidentId
        ? targetResidentId
        : session.userId;

    // Check if resident is trying to pay for someone else's due
    if (
      session.role === "resident" &&
      rentDue.residentId.toString() !== session.userId
    ) {
      return NextResponse.json({ error: "Unauthorized access to this rent due" }, { status: 403 });
    }

    const payAmount = Number(amount);
    if (payAmount <= 0) {
      return NextResponse.json({ error: "Amount must be greater than zero" }, { status: 400 });
    }

    // Check for duplicate transaction reference
    const duplicateTx = await Payment.findOne({
      transactionRef: transactionRef.trim(),
    });
    if (duplicateTx) {
      return NextResponse.json(
        { error: "A payment with this transaction reference has already been submitted." },
        { status: 409 }
      );
    }

    // Admin recording verified payment vs Resident submitting proof
    const shouldDirectVerify = session.role === "admin" && isDirectAdminVerification;
    const initialStatus = shouldDirectVerify ? "verified" : "pending_verification";

    const payment = await Payment.create({
      rentDueId: rentDue._id,
      residentId: effectiveResidentId,
      amount: payAmount,
      paymentMethod: paymentMethod || "upi",
      transactionRef: transactionRef.trim(),
      proofDocumentKey,
      status: initialStatus,
      verifiedBy: shouldDirectVerify ? session.userId : undefined,
      verifiedAt: shouldDirectVerify ? new Date() : undefined,
      notes: notes?.trim() || "",
    });

    if (shouldDirectVerify) {
      // Recalculate RentDue totals immediately
      rentDue.totalPaidAmount += payAmount;
      rentDue.balanceAmount = Math.max(0, rentDue.rentAmount - rentDue.totalPaidAmount);
      rentDue.dueStatus = rentDue.balanceAmount === 0 ? "paid" : "partially_paid";
      await rentDue.save();

      await Notification.create({
        userId: effectiveResidentId,
        title: "Payment Received & Verified",
        message: `Your payment of ₹${payAmount.toLocaleString("en-IN")} for ${rentDue.billingMonth} has been recorded by management.`,
        type: "payment",
        link: "/resident/payments",
      });

      await AuditLog.create({
        actorId: session.userId,
        actorRole: "admin",
        action: "RECORD_VERIFIED_PAYMENT",
        entityType: "Payment",
        entityId: payment._id.toString(),
        details: { amount: payAmount, transactionRef, billingMonth: rentDue.billingMonth },
      });
    } else {
      // Resident submitted proof -> Notify Admin
      await Notification.create({
        targetRole: "admin",
        title: "New Rent Payment Submitted",
        message: `${session.name} submitted a payment proof of ₹${payAmount.toLocaleString("en-IN")} (Ref: ${transactionRef}).`,
        type: "payment",
        link: "/admin/payments",
      });
    }

    return NextResponse.json({
      success: true,
      message: shouldDirectVerify
        ? "Payment recorded and verified successfully."
        : "Payment submitted successfully. It will be verified by management shortly.",
      payment,
    });
  } catch (error: any) {
    console.error("[Submit Payment API] Error:", error);
    return NextResponse.json(
      { error: error.message || "Failed to process payment submission" },
      { status: 500 }
    );
  }
}
