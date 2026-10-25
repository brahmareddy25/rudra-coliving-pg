import mongoose, { Schema, Document, Model } from "mongoose";

export interface IFloor extends Document {
  floorNumber: number;
  name: string;
  totalRooms: number;
  createdAt: Date;
  updatedAt: Date;
}

const FloorSchema = new Schema<IFloor>(
  {
    floorNumber: { type: Number, required: true, unique: true },
    name: { type: String, required: true },
    totalRooms: { type: Number, default: 6 },
  },
  { timestamps: true }
);

export const Floor: Model<IFloor> =
  mongoose.models.Floor || mongoose.model<IFloor>("Floor", FloorSchema);
