import { NextResponse } from "next/server";
import { connectDB } from "@/lib/db/connect";
import { getSessionUser } from "@/lib/auth/session";
import { User } from "@/models/User";
import { ResidentProfile } from "@/models/ResidentProfile";
import { Bed } from "@/models/Bed";

export async function GET() {
  try {
    const session = await getSessionUser();
    if (!session) {
      return NextResponse.json({ authenticated: false, user: null }, { status: 401 });
    }

    await connectDB();
    const user = await User.findById(session.userId).lean();
    if (!user) {
      return NextResponse.json({ authenticated: false, user: null }, { status: 401 });
    }

    let profile = null;
    let bed = null;

    if (user.role === "resident") {
      profile = await ResidentProfile.findOne({ userId: user._id }).lean();
      bed = await Bed.findOne({ currentResidentId: user._id }).lean();
    }

    return NextResponse.json({
      authenticated: true,
      user: {
        id: user._id,
        name: user.name,
        mobile: user.mobile,
        email: user.email,
        role: user.role,
        status: user.status,
        mustChangePassword: !!user.mustChangePassword,
        avatarUrl: user.avatarUrl,
        profile,
        assignedBed: bed
          ? {
              id: bed._id,
              bedNumber: bed.bedNumber,
              roomNumber: bed.roomNumber,
              floorNumber: bed.floorNumber,
              monthlyRent: bed.monthlyRent,
            }
          : null,
      },
    });
  } catch (error: any) {
    console.error("[Auth Me API] Error:", error);
    return NextResponse.json({ authenticated: false, error: error.message }, { status: 500 });
  }
}
