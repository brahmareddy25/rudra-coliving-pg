import mongoose, { Schema, Document, Model } from "mongoose";

export interface INotification extends Document {
  userId?: mongoose.Types.ObjectId;
  targetRole?: "admin" | "resident";
  title: string;
  message: string;
  type: "payment" | "approval" | "issue" | "notice" | "allocation" | "system";
  link?: string;
  isRead: boolean;
  createdAt: Date;
}

const NotificationSchema = new Schema<INotification>(
  {
    userId: { type: Schema.Types.ObjectId, ref: "User" },
    targetRole: { type: String, enum: ["admin", "resident"] },
    title: { type: String, required: true },
    message: { type: String, required: true },
    type: {
      type: String,
      enum: ["payment", "approval", "issue", "notice", "allocation", "system"],
      default: "system",
    },
    link: { type: String },
    isRead: { type: Boolean, default: false },
    createdAt: { type: Date, default: Date.now },
  },
  { timestamps: false }
);

NotificationSchema.index({ userId: 1, isRead: 1 });
NotificationSchema.index({ targetRole: 1, isRead: 1 });

export const Notification: Model<INotification> =
  mongoose.models.Notification ||
  mongoose.model<INotification>("Notification", NotificationSchema);
