import { NextResponse } from "next/server";
import { connectDB } from "@/lib/db/connect";
import { Room } from "@/models/Room";
import { Bed } from "@/models/Bed";
import { BedAllocation } from "@/models/BedAllocation";
import { getSessionUser } from "@/lib/auth/session";

export async function GET(req: Request) {
  try {
    const session = await getSessionUser();
    if (!session) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    await connectDB();
    const { searchParams } = new URL(req.url);
    const floorParam = searchParams.get("floor");

    const query: any = {};
    if (floorParam) {
      query.floorNumber = parseInt(floorParam, 10);
    }

    const rooms = await Room.find(query).sort({ roomNumber: 1 }).lean();
    const beds = await Bed.find()
      .populate("currentResidentId", "name mobile email avatarUrl")
      .lean();

    // Fetch active allocations to get moveInDate
    const activeAllocations = await BedAllocation.find({ status: "active" })
      .populate("residentId", "name mobile")
      .lean();

    const allocationMap = new Map();
    activeAllocations.forEach((alloc) => {
      allocationMap.set(alloc.bedId.toString(), alloc);
    });

    const roomsWithBeds = rooms.map((room) => {
      const roomBeds = beds
        .filter((b) => b.roomNumber === room.roomNumber)
        .sort((a, b) => a.bedNumber.localeCompare(b.bedNumber))
        .map((b) => {
          const alloc = allocationMap.get(b._id.toString());
          return {
            ...b,
            allocation: alloc
              ? {
                  id: alloc._id,
                  startDate: alloc.startDate,
                  monthlyRentAgreed: alloc.monthlyRentAgreed,
                  notes: alloc.notes,
                }
              : null,
          };
        });

      const occupiedCount = roomBeds.filter((b) => b.status === "occupied").length;

      return {
        ...room,
        beds: roomBeds,
        configuredBeds: roomBeds.length,
        occupiedBeds: occupiedCount,
        availableBeds: roomBeds.filter((b) => b.status === "available").length,
        isFull: occupiedCount >= room.maxBeds,
      };
    });

    return NextResponse.json({ rooms: roomsWithBeds });
  } catch (error: any) {
    console.error("[Rooms API] Error:", error);
    return NextResponse.json({ error: "Failed to fetch rooms" }, { status: 500 });
  }
}
