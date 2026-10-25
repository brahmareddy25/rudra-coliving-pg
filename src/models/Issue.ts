import mongoose, { Schema, Document, Model } from "mongoose";

export type IssueCategory =
  | "plumbing"
  | "electricity"
  | "cleaning"
  | "wifi"
  | "furniture"
  | "room_maintenance"
  | "water_supply"
  | "security"
  | "other";

export type IssueStatus =
  | "open"
  | "working_on_it"
  | "waiting_for_resident"
  | "resolved"
  | "closed";

export type IssuePriority = "low" | "medium" | "high" | "urgent";

export interface IIssue extends Document {
  title: string;
  category: IssueCategory;
  description: string;
  attachments: string[];
  residentId: mongoose.Types.ObjectId;
  roomNumber: number;
  bedNumber?: string;
  priority: IssuePriority;
  status: IssueStatus;
  adminNotes?: string;
  residentReply?: string;
  resolvedAt?: Date;
  createdAt: Date;
  updatedAt: Date;
}

const IssueSchema = new Schema<IIssue>(
  {
    title: { type: String, required: true, trim: true },
    category: {
      type: String,
      enum: [
        "plumbing",
        "electricity",
        "cleaning",
        "wifi",
        "furniture",
        "room_maintenance",
        "water_supply",
        "security",
        "other",
      ],
      required: true,
    },
    description: { type: String, required: true, trim: true },
    attachments: { type: [String], default: [] },
    residentId: { type: Schema.Types.ObjectId, ref: "User", required: true },
    roomNumber: { type: Number, required: true },
    bedNumber: { type: String, trim: true },
    priority: {
      type: String,
      enum: ["low", "medium", "high", "urgent"],
      default: "medium",
    },
    status: {
      type: String,
      enum: ["open", "working_on_it", "waiting_for_resident", "resolved", "closed"],
      default: "open",
    },
    adminNotes: { type: String, trim: true },
    residentReply: { type: String, trim: true },
    resolvedAt: { type: Date },
  },
  { timestamps: true }
);

IssueSchema.index({ residentId: 1 });
IssueSchema.index({ status: 1 });
IssueSchema.index({ category: 1 });

export const Issue: Model<IIssue> =
  mongoose.models.Issue || mongoose.model<IIssue>("Issue", IssueSchema);
