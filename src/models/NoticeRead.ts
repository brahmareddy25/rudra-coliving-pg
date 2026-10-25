import mongoose, { Schema, Document, Model } from "mongoose";

export interface INoticeRead extends Document {
  noticeId: mongoose.Types.ObjectId;
  userId: mongoose.Types.ObjectId;
  readAt: Date;
}

const NoticeReadSchema = new Schema<INoticeRead>(
  {
    noticeId: { type: Schema.Types.ObjectId, ref: "Notice", required: true },
    userId: { type: Schema.Types.ObjectId, ref: "User", required: true },
    readAt: { type: Date, default: Date.now },
  },
  { timestamps: false }
);

NoticeReadSchema.index({ noticeId: 1, userId: 1 }, { unique: true });

export const NoticeRead: Model<INoticeRead> =
  mongoose.models.NoticeRead ||
  mongoose.model<INoticeRead>("NoticeRead", NoticeReadSchema);
