import { NextResponse } from "next/server";
import { connectDB } from "@/lib/db/connect";
import { requireAdmin } from "@/lib/auth/session";
import { User } from "@/models/User";
import { OTPChallenge } from "@/models/OTPChallenge";

export async function PATCH(
  req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    await requireAdmin();
    await connectDB();
    const { id } = await params;
    const body = await req.json();

    const user = await User.findById(id);
    if (!user) {
      return NextResponse.json({ error: "Resident not found" }, { status: 404 });
    }

    const action = body.action || (body.otpBlocked ? "stop" : "start");

    if (action === "start") {
      user.otpBlocked = false;
      user.failedOtpAttempts = 0;
      user.otpBlockedReason = undefined;
      user.otpBlockedAt = undefined;
      await user.save();

      return NextResponse.json({
        success: true,
        message: `OTP services started for resident ${user.name}. Failed attempt counter reset.`,
        otpBlocked: false,
        failedOtpAttempts: 0,
      });
    } else if (action === "stop") {
      user.otpBlocked = true;
      user.otpBlockedReason = body.reason || "Stopped manually by Property Admin";
      user.otpBlockedAt = new Date();
      await user.save();

      // Clear any pending OTP requests
      await OTPChallenge.deleteMany({ mobile: user.mobile });

      return NextResponse.json({
        success: true,
        message: `OTP services stopped for resident ${user.name}.`,
        otpBlocked: true,
        failedOtpAttempts: user.failedOtpAttempts || 0,
        otpBlockedReason: user.otpBlockedReason,
      });
    } else {
      return NextResponse.json(
        { error: "Invalid action. Use 'start' or 'stop'." },
        { status: 400 }
      );
    }
  } catch (error: any) {
    console.error("[Resident OTP Status API] Error:", error);
    return NextResponse.json(
      { error: error.message || "Failed to update OTP status" },
      { status: 500 }
    );
  }
}
