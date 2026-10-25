import mongoose, { Schema, Document, Model } from "mongoose";

export interface IRentDue extends Document {
  residentId: mongoose.Types.ObjectId;
  bedAllocationId: mongoose.Types.ObjectId;
  billingMonth: string; // "YYYY-MM"
  rentAmount: number;
  totalPaidAmount: number;
  balanceAmount: number;
  dueStatus: "pending" | "partially_paid" | "paid" | "overdue";
  dueDate: Date;
  createdAt: Date;
  updatedAt: Date;
}

const RentDueSchema = new Schema<IRentDue>(
  {
    residentId: { type: Schema.Types.ObjectId, ref: "User", required: true },
    bedAllocationId: { type: Schema.Types.ObjectId, ref: "BedAllocation", required: true },
    billingMonth: { type: String, required: true }, // Format "YYYY-MM"
    rentAmount: { type: Number, required: true },
    totalPaidAmount: { type: Number, default: 0 },
    balanceAmount: { type: Number, required: true },
    dueStatus: {
      type: String,
      enum: ["pending", "partially_paid", "paid", "overdue"],
      default: "pending",
    },
    dueDate: { type: Date, required: true },
  },
  { timestamps: true }
);

// Enforce single rent due per resident per billing period
RentDueSchema.index({ residentId: 1, billingMonth: 1 }, { unique: true });
RentDueSchema.index({ dueStatus: 1 });

export const RentDue: Model<IRentDue> =
  mongoose.models.RentDue || mongoose.model<IRentDue>("RentDue", RentDueSchema);
