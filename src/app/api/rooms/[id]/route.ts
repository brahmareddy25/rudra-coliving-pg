import { NextResponse } from "next/server";
import { connectDB } from "@/lib/db/connect";
import { requireAdmin } from "@/lib/auth/session";
import { Room } from "@/models/Room";
import { AuditLog } from "@/models/AuditLog";

export async function PATCH(
  req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const admin = await requireAdmin();
    await connectDB();

    const { id } = await params;
    const body = await req.json();
    const { hasAc, hasTv, amenities } = body;

    const room = await Room.findById(id);
    if (!room) {
      return NextResponse.json({ error: "Room not found" }, { status: 404 });
    }

    const previousData = {
      hasAc: room.hasAc,
      hasTv: room.hasTv,
      amenities: [...room.amenities],
    };

    if (typeof hasAc === "boolean") room.hasAc = hasAc;
    if (typeof hasTv === "boolean") room.hasTv = hasTv;
    if (Array.isArray(amenities)) {
      room.amenities = amenities;
    }

    // Keep amenities array synchronized with hasAc and hasTv
    const cleanAmenities = new Set(room.amenities);
    if (room.hasAc) cleanAmenities.add("AC");
    else cleanAmenities.delete("AC");

    if (room.hasTv) cleanAmenities.add("Television");
    else cleanAmenities.delete("Television");

    room.amenities = Array.from(cleanAmenities);
    await room.save();

    try {
      await AuditLog.create({
        actorId: admin.userId,
        actorRole: "admin",
        action: "UPDATE_ROOM_AMENITIES",
        entityType: "Room",
        entityId: room._id.toString(),
        details: {
          roomNumber: room.roomNumber,
          previous: previousData,
          updated: {
            hasAc: room.hasAc,
            hasTv: room.hasTv,
            amenities: room.amenities,
          },
        },
      });
    } catch (auditErr) {
      console.warn("[AuditLog Warning] Non-critical audit log failure:", auditErr);
    }

    return NextResponse.json({
      success: true,
      message: `Room ${room.roomNumber} amenities updated successfully`,
      room,
    });
  } catch (error: any) {
    console.error("[Room PATCH Error]:", error);
    return NextResponse.json(
      { error: error.message || "Failed to update room" },
      { status: error.status || 500 }
    );
  }
}
