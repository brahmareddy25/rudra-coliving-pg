import { NextResponse } from "next/server";
import { connectDB } from "@/lib/db/connect";
import { User } from "@/models/User";
import { OTPChallenge } from "@/models/OTPChallenge";
import { generateOTP, hashOTP } from "@/lib/auth/otp";
import { sendEmailOTP } from "@/lib/email/mailer";

function maskEmail(emailStr: string): string {
  const [local, domain] = emailStr.split("@");
  if (!domain) return emailStr;
  if (local.length <= 2) return `${local[0]}*@${domain}`;
  return `${local[0]}${"*".repeat(Math.max(1, local.length - 2))}${local.slice(-1)}@${domain}`;
}

export async function POST(req: Request) {
  try {
    await connectDB();
    const body = await req.json();
    const { mobile, email, identifier } = body;

    let cleanMobile = "";
    let inputEmail = "";

    if (mobile && typeof mobile === "string") {
      cleanMobile = mobile.replace(/\D/g, "").slice(-10);
    }
    if (email && typeof email === "string") {
      inputEmail = email.trim().toLowerCase();
    }
    if (identifier && typeof identifier === "string") {
      if (identifier.includes("@")) {
        inputEmail = identifier.trim().toLowerCase();
      } else {
        cleanMobile = identifier.replace(/\D/g, "").slice(-10);
      }
    }

    if (!cleanMobile && !inputEmail) {
      return NextResponse.json(
        { error: "Please enter your registered mobile number or email ID." },
        { status: 400 }
      );
    }

    // Lookup user
    let user = null;
    if (cleanMobile) {
      user = await User.findOne({ mobile: cleanMobile });
    }
    if (!user && inputEmail) {
      user = await User.findOne({ email: inputEmail });
    }

    if (!user) {
      return NextResponse.json(
        {
          error: "No registered account found with that mobile number or email ID. Please check your credentials or contact property management.",
        },
        { status: 404 }
      );
    }

    // Guard: Check if OTP services have been blocked/stopped
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

    // Guard: Resident must have a valid non-internal email
    if (!user.email || user.email.endsWith("@rudracoliving.internal")) {
      return NextResponse.json(
        {
          error: "No verified email ID is registered for this account. Please contact property administration to update your email.",
        },
        { status: 400 }
      );
    }

    // Rate limit: 10 seconds between requests
    const recentChallenge = await OTPChallenge.findOne({
      mobile: user.mobile,
      purpose: "reset_password",
      createdAt: { $gte: new Date(Date.now() - 10 * 1000) },
    });

    if (recentChallenge) {
      return NextResponse.json(
        { error: "Please wait 10 seconds before requesting another verification code." },
        { status: 429 }
      );
    }

    // Generate 6-digit OTP
    const otp = generateOTP();

    // Dispatch via Email
    const emailResult = await sendEmailOTP(user.email, otp, user.name);

    // Save hash in OTPChallenge
    const otpHash = await hashOTP(otp);
    const expiresAt = new Date(Date.now() + 5 * 60 * 1000); // 5 minutes

    await OTPChallenge.deleteMany({ mobile: user.mobile, purpose: "reset_password" });
    await OTPChallenge.create({
      mobile: user.mobile,
      otpHash,
      purpose: "reset_password",
      expiresAt,
    });

    const masked = maskEmail(user.email);

    return NextResponse.json({
      success: true,
      message: `Verification code sent to your registered email: ${masked}`,
      maskedEmail: masked,
      mobile: user.mobile,
    });
  } catch (error: any) {
    console.error("[Forgot Password API] Error:", error);
    return NextResponse.json(
      { error: "Failed to process password recovery request. Please try again." },
      { status: 500 }
    );
  }
}
