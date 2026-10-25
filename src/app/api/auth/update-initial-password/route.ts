import { NextResponse } from "next/server";
import { connectDB } from "@/lib/db/connect";
import { getSessionUser } from "@/lib/auth/session";
import { User } from "@/models/User";
import { hashPassword } from "@/lib/auth/password";
import { AuditLog } from "@/models/AuditLog";

export async function POST(req: Request) {
  try {
    const session = await getSessionUser();
    if (!session) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    await connectDB();
    const { password, confirmPassword } = await req.json();

    if (!password || !confirmPassword) {
      return NextResponse.json(
        { error: "New password and confirmation are required" },
        { status: 400 }
      );
    }

    if (password !== confirmPassword) {
      return NextResponse.json(
        { error: "New passwords do not match" },
        { status: 400 }
      );
    }

    if (password.length < 6) {
      return NextResponse.json(
        { error: "Password must be at least 6 characters in length" },
        { status: 400 }
      );
    }

    const user = await User.findById(session.userId);
    if (!user) {
      return NextResponse.json({ error: "User account not found" }, { status: 404 });
    }

    const newHash = await hashPassword(password);
    user.passwordHash = newHash;
    user.mustChangePassword = false;
    await user.save();

    try {
      await AuditLog.create({
        actorId: user._id,
        actorRole: user.role || "resident",
        action: "UPDATE_INITIAL_PASSWORD",
        entityType: "User",
        entityId: user._id.toString(),
        details: {
          mobile: user.mobile,
          name: user.name,
          timestamp: new Date(),
        },
      });
    } catch (auditErr) {
      console.warn("[AuditLog Warning] Non-critical audit log failure:", auditErr);
    }

    return NextResponse.json({
      success: true,
      message: "Permanent password configured successfully.",
    });
  } catch (error: any) {
    console.error("[Update Initial Password Error]:", error);
    return NextResponse.json(
      { error: error.message || "Failed to update password" },
      { status: 500 }
    );
  }
}
