import mongoose, { Schema, Document, Model } from "mongoose";

export interface IConversation extends Document {
  residentId: mongoose.Types.ObjectId;
  lastMessageText: string;
  lastMessageAt: Date;
  unreadCountAdmin: number;
  unreadCountResident: number;
  createdAt: Date;
  updatedAt: Date;
}

const ConversationSchema = new Schema<IConversation>(
  {
    residentId: { type: Schema.Types.ObjectId, ref: "User", required: true, unique: true },
    lastMessageText: { type: String, default: "" },
    lastMessageAt: { type: Date, default: Date.now },
    unreadCountAdmin: { type: Number, default: 0 },
    unreadCountResident: { type: Number, default: 0 },
  },
  { timestamps: true }
);

export const Conversation: Model<IConversation> =
  mongoose.models.Conversation ||
  mongoose.model<IConversation>("Conversation", ConversationSchema);
