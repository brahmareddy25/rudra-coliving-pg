import mongoose, { Schema, Document, Model } from "mongoose";

export interface IOTPChallenge extends Document {
  mobile: string;
  otpHash: string;
  purpose: "reset_password" | "verify_phone";
  attempts: number;
  expiresAt: Date;
  createdAt: Date;
}

const OTPChallengeSchema = new Schema<IOTPChallenge>(
  {
    mobile: { type: String, required: true },
    otpHash: { type: String, required: true },
    purpose: {
      type: String,
      enum: ["reset_password", "verify_phone"],
      default: "reset_password",
    },
    attempts: { type: Number, default: 0 },
    expiresAt: { type: Date, required: true },
    createdAt: { type: Date, default: Date.now },
  },
  { timestamps: false }
);

// Auto expire document after expiration time
OTPChallengeSchema.index({ expiresAt: 1 }, { expireAfterSeconds: 0 });
OTPChallengeSchema.index({ mobile: 1, purpose: 1 });

export const OTPChallenge: Model<IOTPChallenge> =
  mongoose.models.OTPChallenge ||
  mongoose.model<IOTPChallenge>("OTPChallenge", OTPChallengeSchema);
