import { NextResponse } from "next/server";
import { connectDB } from "@/lib/db/connect";
import { Floor } from "@/models/Floor";
import { Room } from "@/models/Room";
import { Bed } from "@/models/Bed";
import { getSessionUser } from "@/lib/auth/session";

export async function GET() {
  try {
    const session = await getSessionUser();
    if (!session) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    await connectDB();

    const floors = await Floor.find().sort({ floorNumber: 1 }).lean();
    const rooms = await Room.find().sort({ roomNumber: 1 }).lean();
    const beds = await Bed.find().populate("currentResidentId", "name mobile avatarUrl").lean();

    // Calculate building-wide totals
    const buildingStats = {
      totalBeds: beds.length,
      occupiedBeds: beds.filter((b) => b.status === "occupied").length,
      availableBeds: beds.filter((b) => b.status === "available").length,
      reservedBeds: beds.filter((b) => b.status === "reserved").length,
      maintenanceBeds: beds.filter((b) => b.status === "maintenance").length,
      occupancyPercentage: beds.length > 0
        ? Math.round((beds.filter((b) => b.status === "occupied").length / beds.length) * 100)
        : 0,
    };

    // Calculate floor-by-floor stats
    const floorsWithStats = floors.map((floor) => {
      const floorBeds = beds.filter((b) => b.floorNumber === floor.floorNumber);
      const floorRooms = rooms.filter((r) => r.floorNumber === floor.floorNumber);

      const occupied = floorBeds.filter((b) => b.status === "occupied").length;
      const available = floorBeds.filter((b) => b.status === "available").length;
      const reserved = floorBeds.filter((b) => b.status === "reserved").length;
      const maintenance = floorBeds.filter((b) => b.status === "maintenance").length;

      return {
        ...floor,
        roomsCount: floorRooms.length,
        totalBeds: floorBeds.length,
        occupiedBeds: occupied,
        availableBeds: available,
        reservedBeds: reserved,
        maintenanceBeds: maintenance,
        occupancyPercentage: floorBeds.length > 0 ? Math.round((occupied / floorBeds.length) * 100) : 0,
      };
    });

    return NextResponse.json({
      buildingStats,
      floors: floorsWithStats,
    });
  } catch (error: any) {
    console.error("[Floors API] Error:", error);
    return NextResponse.json({ error: "Failed to fetch floors" }, { status: 500 });
  }
}
