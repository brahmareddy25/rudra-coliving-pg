import { NextResponse } from "next/server";
import { connectDB } from "@/lib/db/connect";
import { requireAdmin } from "@/lib/auth/session";
import { ElectricityPayment } from "@/models/ElectricityPayment";
import { AuditLog } from "@/models/AuditLog";
import { getPresignedViewUrl } from "@/lib/storage/s3";

export async function GET() {
  try {
    await requireAdmin();
    await connectDB();

    const records = await ElectricityPayment.find().sort({ billingMonth: -1 }).lean();

    const enrichedRecords = await Promise.all(
      records.map(async (r) => {
        let receiptViewUrl = "";
        if (r.receiptKey) {
          receiptViewUrl = await getPresignedViewUrl(r.receiptKey, 900);
        }
        return {
          ...r,
          receiptViewUrl,
        };
      })
    );

    const summary = {
      totalExpected: records.reduce((acc, r) => acc + r.expectedAmount, 0),
      totalReceived: records.reduce((acc, r) => acc + r.actualAmountReceived, 0),
      totalPending: records.reduce(
        (acc, r) => acc + Math.max(0, r.expectedAmount - r.actualAmountReceived),
        0
      ),
      count: records.length,
      reconciledCount: records.filter((r) => r.status === "reconciled").length,
    };

    return NextResponse.json({ records: enrichedRecords, summary });
  } catch (error: any) {
    console.error("[Electricity API] Error:", error);
    return NextResponse.json(
      { error: error.message || "Failed to fetch electricity records" },
      { status: 500 }
    );
  }
}

export async function POST(req: Request) {
  try {
    const adminSession = await requireAdmin();
    await connectDB();

    const {
      billingMonth,
      expectedAmount,
      actualAmountReceived = 0,
      paymentDate,
      referenceNumber,
      receiptKey,
      status,
      notes,
    } = await req.json();

    if (!billingMonth || !expectedAmount) {
      return NextResponse.json(
        { error: "Billing month (YYYY-MM) and expected amount are required" },
        { status: 400 }
      );
    }

    const expected = Number(expectedAmount);
    const received = Number(actualAmountReceived);

    // Auto determine status if not explicitly given
    let calculatedStatus = status;
    if (!calculatedStatus) {
      if (received >= expected && expected > 0) {
        calculatedStatus = "reconciled";
      } else if (received > 0) {
        calculatedStatus = "partially_received";
      } else {
        calculatedStatus = "pending";
      }
    }

    const record = await ElectricityPayment.findOneAndUpdate(
      { billingMonth },
      {
        billingMonth,
        expectedAmount: expected,
        actualAmountReceived: received,
        paymentDate: paymentDate ? new Date(paymentDate) : undefined,
        referenceNumber: referenceNumber?.trim(),
        receiptKey,
        status: calculatedStatus,
        notes: notes?.trim(),
      },
      { upsert: true, new: true }
    );

    await AuditLog.create({
      actorId: adminSession.userId,
      actorRole: "admin",
      action: "UPDATE_ELECTRICITY_LEDGER",
      entityType: "ElectricityPayment",
      entityId: record._id.toString(),
      details: { billingMonth, expectedAmount: expected, actualAmountReceived: received },
    });

    return NextResponse.json({
      success: true,
      message: `Electricity ledger for ${billingMonth} saved successfully.`,
      record,
    });
  } catch (error: any) {
    console.error("[Save Electricity API] Error:", error);
    return NextResponse.json(
      { error: error.message || "Failed to save electricity ledger entry" },
      { status: 500 }
    );
  }
}
