import { NextResponse } from "next/server";
import { connectDB } from "@/lib/db/connect";
import { requireAdmin } from "@/lib/auth/session";
import { Bed } from "@/models/Bed";
import { AuditLog } from "@/models/AuditLog";

export async function PATCH(
  req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const adminSession = await requireAdmin();
    await connectDB();
    const { id } = await params;
    const { status, monthlyRent } = await req.json();

    const bed = await Bed.findById(id);
    if (!bed) {
      return NextResponse.json({ error: "Bed not found" }, { status: 404 });
    }

    if (bed.status === "occupied" && status && status !== "occupied") {
      return NextResponse.json(
        { error: "Cannot change status of an occupied bed. Please deallocate resident first." },
        { status: 400 }
      );
    }

    if (status) bed.status = status;
    if (monthlyRent) bed.monthlyRent = Number(monthlyRent);

    await bed.save();

    await AuditLog.create({
      actorId: adminSession.userId,
      actorRole: "admin",
      action: "UPDATE_BED",
      entityType: "Bed",
      entityId: bed._id.toString(),
      details: { bedNumber: bed.bedNumber, status, monthlyRent },
    });

    return NextResponse.json({
      success: true,
      message: `Bed ${bed.bedNumber} updated successfully`,
      bed,
    });
  } catch (error: any) {
    console.error("[Update Bed API] Error:", error);
    return NextResponse.json(
      { error: error.message || "Failed to update bed" },
      { status: 500 }
    );
  }
}
