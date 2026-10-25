import mongoose, { Schema, Document, Model } from "mongoose";

export interface INotice extends Document {
  title: string;
  content: string;
  audience: "all" | "floor_1" | "floor_2" | "floor_3" | "floor_4";
  isPinned: boolean;
  expiresAt?: Date;
  createdBy: mongoose.Types.ObjectId;
  createdAt: Date;
  updatedAt: Date;
}

const NoticeSchema = new Schema<INotice>(
  {
    title: { type: String, required: true, trim: true },
    content: { type: String, required: true, trim: true },
    audience: {
      type: String,
      enum: ["all", "floor_1", "floor_2", "floor_3", "floor_4"],
      default: "all",
    },
    isPinned: { type: Boolean, default: false },
    expiresAt: { type: Date },
    createdBy: { type: Schema.Types.ObjectId, ref: "User", required: true },
  },
  { timestamps: true }
);

NoticeSchema.index({ isPinned: -1, createdAt: -1 });

export const Notice: Model<INotice> =
  mongoose.models.Notice || mongoose.model<INotice>("Notice", NoticeSchema);
