import mongoose, { Schema, Document, Model } from "mongoose";

export interface IRoom extends Document {
  floorNumber: number;
  roomNumber: number;
  roomPosition: number; // 1 to 6
  maxBeds: number;
  hasAc: boolean;
  hasTv: boolean;
  amenities: string[];
  createdAt: Date;
  updatedAt: Date;
}

const RoomSchema = new Schema<IRoom>(
  {
    floorNumber: { type: Number, required: true },
    roomNumber: { type: Number, required: true, unique: true },
    roomPosition: { type: Number, required: true, min: 1, max: 6 },
    maxBeds: { type: Number, required: true },
    hasAc: { type: Boolean, default: false },
    hasTv: { type: Boolean, default: false },
    amenities: {
      type: [String],
      default: ["Attached Washroom", "High-Speed Wi-Fi", "Geyser", "Wardrobe"],
    },
  },
  { timestamps: true }
);

RoomSchema.index({ floorNumber: 1, roomPosition: 1 });

export const Room: Model<IRoom> =
  mongoose.models.Room || mongoose.model<IRoom>("Room", RoomSchema);
