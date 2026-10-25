import mongoose, { Schema, Document, Model } from "mongoose";

export interface IUser extends Document {
  name: string;
  mobile: string;
  email?: string;
  passwordHash: string;
  role: "admin" | "resident";
  status: "active" | "inactive" | "pending_approval";
  mustChangePassword?: boolean;
  avatarUrl?: string;
  lastLoginAt?: Date;
  otpBlocked?: boolean;
  failedOtpAttempts?: number;
  otpBlockedReason?: string;
  otpBlockedAt?: Date;
  createdAt: Date;
  updatedAt: Date;
}

const UserSchema = new Schema<IUser>(
  {
    name: { type: String, required: true, trim: true },
    mobile: { type: String, required: true, unique: true, trim: true },
    email: { type: String, trim: true, lowercase: true },
    passwordHash: { type: String, required: true },
    role: { type: String, enum: ["admin", "resident"], default: "resident" },
    status: {
      type: String,
      enum: ["active", "inactive", "pending_approval"],
      default: "pending_approval",
    },
    mustChangePassword: { type: Boolean, default: false },
    avatarUrl: { type: String },
    lastLoginAt: { type: Date },
    otpBlocked: { type: Boolean, default: false },
    failedOtpAttempts: { type: Number, default: 0 },
    otpBlockedReason: { type: String },
    otpBlockedAt: { type: Date },
  },
  { timestamps: true }
);

// Do not return passwordHash in json serialization
UserSchema.set("toJSON", {
  transform: (_, ret) => {
    delete (ret as any).passwordHash;
    return ret;
  },
});

export const User: Model<IUser> =
  mongoose.models.User || mongoose.model<IUser>("User", UserSchema);
