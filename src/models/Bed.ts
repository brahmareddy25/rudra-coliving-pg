import mongoose, { Schema, Document, Model } from "mongoose";

export interface IBed extends Document {
  roomId: mongoose.Types.ObjectId;
  floorNumber: number;
  roomNumber: number;
  bedNumber: string;
  monthlyRent: number;
  status: "available" | "occupied" | "reserved" | "maintenance";
  currentResidentId?: mongoose.Types.ObjectId;
  createdAt: Date;
  updatedAt: Date;
}

const BedSchema = new Schema<IBed>(
  {
    roomId: { type: Schema.Types.ObjectId, ref: "Room", required: true },
    floorNumber: { type: Number, required: true },
    roomNumber: { type: Number, required: true },
    bedNumber: { type: String, required: true, unique: true, trim: true },
    monthlyRent: { type: Number, required: true, default: 8500 },
    status: {
      type: String,
      enum: ["available", "occupied", "reserved", "maintenance"],
      default: "available",
    },
    currentResidentId: { type: Schema.Types.ObjectId, ref: "User" },
  },
  { timestamps: true }
);

BedSchema.index({ floorNumber: 1, roomNumber: 1 });
BedSchema.index({ status: 1 });

export const Bed: Model<IBed> =
  mongoose.models.Bed || mongoose.model<IBed>("Bed", BedSchema);
