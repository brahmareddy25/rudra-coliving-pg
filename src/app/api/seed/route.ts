import { NextResponse } from "next/server";
import { connectDB } from "@/lib/db/connect";
import { seedDatabase } from "@/lib/db/seed";

export async function GET() {
  try {
    await connectDB();
    await seedDatabase();
    return NextResponse.json({
      success: true,
      message: "Database seeded successfully with floors, rooms, beds, admin, and residents.",
      credentials: {
        admin: {
          email: "admin@rudracoliving.com",
          mobile: "9999999999",
          password: "admin123456",
        },
        resident: {
          mobile: "9876543210",
          password: "resident123",
          room: "101",
          bed: "101-A",
        },
      },
    });
  } catch (error: any) {
    console.error("[Seed API] Error:", error);
    return NextResponse.json({ error: error.message || "Seeding failed" }, { status: 500 });
  }
}

export async function POST() {
  return GET();
}
