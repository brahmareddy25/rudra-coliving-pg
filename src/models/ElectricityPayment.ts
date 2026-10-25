import mongoose, { Schema, Document, Model } from "mongoose";

export interface IElectricityPayment extends Document {
  billingMonth: string; // "YYYY-MM"
  expectedAmount: number;
  actualAmountReceived: number;
  paymentDate?: Date;
  referenceNumber?: string;
  receiptKey?: string;
  status: "pending" | "partially_received" | "received" | "overdue" | "reconciled";
  notes?: string;
  createdAt: Date;
  updatedAt: Date;
}

const ElectricityPaymentSchema = new Schema<IElectricityPayment>(
  {
    billingMonth: { type: String, required: true, unique: true }, // Format "YYYY-MM"
    expectedAmount: { type: Number, required: true },
    actualAmountReceived: { type: Number, default: 0 },
    paymentDate: { type: Date },
    referenceNumber: { type: String, trim: true },
    receiptKey: { type: String },
    status: {
      type: String,
      enum: ["pending", "partially_received", "received", "overdue", "reconciled"],
      default: "pending",
    },
    notes: { type: String, trim: true },
  },
  { timestamps: true }
);

export const ElectricityPayment: Model<IElectricityPayment> =
  mongoose.models.ElectricityPayment ||
  mongoose.model<IElectricityPayment>("ElectricityPayment", ElectricityPaymentSchema);
