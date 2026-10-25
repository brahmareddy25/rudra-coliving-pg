import { NextResponse } from "next/server";
import { connectDB } from "@/lib/db/connect";
import { User } from "@/models/User";
import { OTPChallenge } from "@/models/OTPChallenge";
import { verifyOTPHash } from "@/lib/auth/otp";

export async function POST(req: Request) {
  try {
    await connectDB();
    const { mobile, email, identifier, otp } = await req.json();

    if ((!mobile && !email && !identifier) || !otp) {
      return NextResponse.json(
        { error: "Mobile number/Email and OTP code are required" },
        { status: 400 }
      );
    }

    let cleanMobile = mobile ? mobile.replace(/\D/g, "").slice(-10) : "";
    let cleanEmail = email ? email.trim().toLowerCase() : "";
    if (identifier) {
      if (identifier.includes("@")) {
        cleanEmail = identifier.trim().toLowerCase();
      } else {
        cleanMobile = identifier.replace(/\D/g, "").slice(-10);
      }
    }

    let user = null;
    if (cleanMobile) user = await User.findOne({ mobile: cleanMobile });
    if (!user && cleanEmail) user = await User.findOne({ email: cleanEmail });

    if (!user) {
      return NextResponse.json({ error: "User account not found." }, { status: 404 });
    }
    cleanMobile = user.mobile;

    if (user.otpBlocked) {
      return NextResponse.json(
        {
          error: "OTP service has been stopped for this resident account. Please contact admin.",
          otpBlocked: true,
          failedOtpAttempts: user.failedOtpAttempts || 0,
        },
        { status: 403 }
      );
    }

    const challenge = await OTPChallenge.findOne({
      mobile: cleanMobile,
      purpose: "reset_password",
    });

    if (!challenge) {
      return NextResponse.json(
        { error: "No active OTP request found or OTP has expired. Please request a new code." },
        { status: 400 }
      );
    }

    if (new Date() > challenge.expiresAt) {
      await OTPChallenge.deleteOne({ _id: challenge._id });
      return NextResponse.json(
        { error: "OTP has expired. Please request a new code." },
        { status: 400 }
      );
    }

    const isValid = await verifyOTPHash(otp, challenge.otpHash);
    if (!isValid) {
      user.failedOtpAttempts = (user.failedOtpAttempts || 0) + 1;

      if (user.failedOtpAttempts > 3) {
        user.otpBlocked = true;
        user.otpBlockedReason = "Failed OTP verification more than 3 times";
        user.otpBlockedAt = new Date();
        await user.save();
        await OTPChallenge.deleteMany({ mobile: cleanMobile });

        return NextResponse.json(
          {
            error: "OTP verification failed more than 3 times. OTP service has been stopped for this resident account. Please contact admin.",
            otpBlocked: true,
            failedOtpAttempts: user.failedOtpAttempts,
          },
          { status: 403 }
        );
      }

      await user.save();
      return NextResponse.json(
        {
          error: `Invalid OTP code. (${user.failedOtpAttempts}/3 failed attempts. Exceeding 3 failures will stop OTP service for your account).`,
          failedOtpAttempts: user.failedOtpAttempts,
          attemptsRemaining: Math.max(0, 3 - user.failedOtpAttempts),
        },
        { status: 400 }
      );
    }

    // Success - reset failed counter
    user.failedOtpAttempts = 0;
    await user.save();

    return NextResponse.json({
      success: true,
      message: "OTP verified successfully. You may now reset your password.",
    });
  } catch (error: any) {
    console.error("[Verify OTP API] Error:", error);
    return NextResponse.json({ error: "Verification failed. Please try again." }, { status: 500 });
  }
}
