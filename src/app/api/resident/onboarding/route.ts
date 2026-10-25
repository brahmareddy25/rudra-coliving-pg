import { NextResponse } from "next/server";
import { connectDB } from "@/lib/db/connect";
import { getSessionUser } from "@/lib/auth/session";
import { User } from "@/models/User";
import { ResidentProfile } from "@/models/ResidentProfile";
import { hashPassword } from "@/lib/auth/password";
import { Notification } from "@/models/Notification";
import { AuditLog } from "@/models/AuditLog";

export async function POST(req: Request) {
  try {
    const session = await getSessionUser();
    if (!session) {
      return NextResponse.json({ error: "Unauthorized session. Please log in." }, { status: 401 });
    }

    await connectDB();
    const body = await req.json();

    const {
      password,
      confirmPassword,
      email,
      gender,
      age,
      occupation,
      companyName,
      permanentAddress,
      photoKey,
      aadhaarKey,
    } = body;

    // 1. Password validation
    if (!password || password.length < 6) {
      return NextResponse.json(
        { error: "New password must be at least 6 characters long." },
        { status: 400 }
      );
    }

    if (password !== confirmPassword) {
      return NextResponse.json(
        { error: "Passwords do not match. Please re-enter your new password." },
        { status: 400 }
      );
    }

    // 2. Email validation (Mandatory for forgot password OTP)
    if (!email || typeof email !== "string") {
      return NextResponse.json(
        { error: "Email ID is mandatory. It will be used to send password reset OTPs." },
        { status: 400 }
      );
    }

    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    const cleanEmail = email.trim().toLowerCase();
    if (!emailRegex.test(cleanEmail)) {
      return NextResponse.json(
        { error: "Please provide a valid email address (e.g., resident@gmail.com)." },
        { status: 400 }
      );
    }

    // 3. Demographic & Professional Details Validation
    if (!gender || !["male", "female", "other"].includes(gender)) {
      return NextResponse.json(
        { error: "Please select your gender (Male, Female, or Other)." },
        { status: 400 }
      );
    }

    const numericAge = Number(age);
    if (!age || isNaN(numericAge) || numericAge < 16 || numericAge > 120) {
      return NextResponse.json(
        { error: "Please enter a valid age (between 16 and 120)." },
        { status: 400 }
      );
    }

    if (!occupation || occupation.trim().length < 2) {
      return NextResponse.json(
        { error: "Occupation is required (e.g., Software Engineer, Student, Designer)." },
        { status: 400 }
      );
    }

    if (!companyName || companyName.trim().length < 2) {
      return NextResponse.json(
        { error: "Company or College/University name is required." },
        { status: 400 }
      );
    }

    if (!permanentAddress || permanentAddress.trim().length < 5) {
      return NextResponse.json(
        { error: "Please provide your full native / permanent residential address." },
        { status: 400 }
      );
    }

    // 4. Document Verification Keys
    if (!photoKey || !aadhaarKey) {
      return NextResponse.json(
        { error: "Both your passport photograph and Aadhaar card document are mandatory." },
        { status: 400 }
      );
    }

    // 5. Update User Record
    const user = await User.findById(session.userId);
    if (!user) {
      return NextResponse.json({ error: "User account not found." }, { status: 404 });
    }

    user.passwordHash = await hashPassword(password);
    user.email = cleanEmail;
    user.mustChangePassword = false;
    await user.save();

    // 6. Update Resident Profile Record
    let profile = await ResidentProfile.findOne({ userId: user._id });
    if (!profile) {
      profile = new ResidentProfile({ userId: user._id });
    }

    profile.gender = gender;
    profile.age = numericAge;
    profile.occupation = occupation.trim();
    profile.companyName = companyName.trim();
    profile.permanentAddress = permanentAddress.trim();
    profile.photoDocumentKey = photoKey;
    profile.idDocumentKey = aadhaarKey;
    profile.idVerificationStatus = "pending_review";
    profile.idRejectionReason = undefined;
    await profile.save();

    // 7. Non-blocking Audit Log
    try {
      await AuditLog.create({
        actorId: user._id,
        actorRole: "resident",
        action: "COMPLETE_ONBOARDING_SETUP",
        entityType: "User",
        entityId: user._id.toString(),
        details: {
          name: user.name,
          mobile: user.mobile,
          email: cleanEmail,
          occupation: profile.occupation,
          companyName: profile.companyName,
          gender: profile.gender,
          age: profile.age,
        },
      });
    } catch (auditErr) {
      console.warn("[Onboarding API] Audit log warning:", auditErr);
    }

    // 8. Notify Property Admin
    try {
      await Notification.create({
        targetRole: "admin",
        title: "New Resident KYC Submitted for Approval",
        message: `${user.name} (+91 ${user.mobile}) has completed initial onboarding and submitted documents for verification.`,
        type: "approval",
        link: "/admin/approvals",
      });
    } catch (notifErr) {
      console.warn("[Onboarding API] Notification warning:", notifErr);
    }

    return NextResponse.json({
      success: true,
      message: "Onboarding details and KYC documents submitted successfully! Property management will review and approve your account.",
      status: "pending_review",
      user: {
        id: user._id,
        name: user.name,
        mobile: user.mobile,
        email: user.email,
        mustChangePassword: user.mustChangePassword,
      },
      profile: {
        gender: profile.gender,
        age: profile.age,
        occupation: profile.occupation,
        companyName: profile.companyName,
        permanentAddress: profile.permanentAddress,
        idVerificationStatus: profile.idVerificationStatus,
      },
    });
  } catch (error: any) {
    console.error("[Resident Onboarding API] Error:", error);
    return NextResponse.json(
      { error: error.message || "Failed to submit onboarding details" },
      { status: 500 }
    );
  }
}
