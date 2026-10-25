import mongoose, { Schema, Document, Model } from "mongoose";

export interface IBedAllocation extends Document {
  bedId: mongoose.Types.ObjectId;
  residentId: mongoose.Types.ObjectId;
  startDate: Date;
  endDate?: Date;
  monthlyRentAgreed: number;
  status: "active" | "completed" | "cancelled";
  allocatedBy: mongoose.Types.ObjectId;
  notes?: string;
  createdAt: Date;
  updatedAt: Date;
}

const BedAllocationSchema = new Schema<IBedAllocation>(
  {
    bedId: { type: Schema.Types.ObjectId, ref: "Bed", required: true },
    residentId: { type: Schema.Types.ObjectId, ref: "User", required: true },
    startDate: { type: Date, required: true },
    endDate: { type: Date },
    monthlyRentAgreed: { type: Number, required: true },
    status: {
      type: String,
      enum: ["active", "completed", "cancelled"],
      default: "active",
    },
    allocatedBy: { type: Schema.Types.ObjectId, ref: "User", required: true },
    notes: { type: String, trim: true },
  },
  { timestamps: true }
);

BedAllocationSchema.index({ bedId: 1, status: 1 });
BedAllocationSchema.index({ residentId: 1, status: 1 });

export const BedAllocation: Model<IBedAllocation> =
  mongoose.models.BedAllocation ||
  mongoose.model<IBedAllocation>("BedAllocation", BedAllocationSchema);
