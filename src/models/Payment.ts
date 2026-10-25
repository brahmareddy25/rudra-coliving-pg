import mongoose, { Schema, Document, Model } from "mongoose";

export interface IPayment extends Document {
  rentDueId: mongoose.Types.ObjectId;
  residentId: mongoose.Types.ObjectId;
  amount: number;
  paymentMethod: "upi" | "bank_transfer" | "cash" | "online";
  transactionRef: string;
  proofDocumentKey?: string;
  status: "pending_verification" | "verified" | "rejected";
  verifiedBy?: mongoose.Types.ObjectId;
  verifiedAt?: Date;
  rejectionReason?: string;
  notes?: string;
  createdAt: Date;
  updatedAt: Date;
}

const PaymentSchema = new Schema<IPayment>(
  {
    rentDueId: { type: Schema.Types.ObjectId, ref: "RentDue", required: true },
    residentId: { type: Schema.Types.ObjectId, ref: "User", required: true },
    amount: { type: Number, required: true, min: 1 },
    paymentMethod: {
      type: String,
      enum: ["upi", "bank_transfer", "cash", "online"],
      default: "upi",
    },
    transactionRef: { type: String, required: true, trim: true },
    proofDocumentKey: { type: String },
    status: {
      type: String,
      enum: ["pending_verification", "verified", "rejected"],
      default: "pending_verification",
    },
    verifiedBy: { type: Schema.Types.ObjectId, ref: "User" },
    verifiedAt: { type: Date },
    rejectionReason: { type: String, trim: true },
    notes: { type: String, trim: true },
  },
  { timestamps: true }
);

PaymentSchema.index({ rentDueId: 1 });
PaymentSchema.index({ residentId: 1 });
PaymentSchema.index({ status: 1 });

export const Payment: Model<IPayment> =
  mongoose.models.Payment || mongoose.model<IPayment>("Payment", PaymentSchema);
