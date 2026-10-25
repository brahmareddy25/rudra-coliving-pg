import mongoose, { Schema, Document, Model } from "mongoose";

export interface IResidentProfile extends Document {
  userId: mongoose.Types.ObjectId;
  gender: "male" | "female" | "other";
  dob: Date;
  age: number;
  permanentAddress: string;
  occupation: string;
  companyName?: string;
  emergencyContact: {
    name: string;
    phone: string;
    relationship: string;
  };
  moveInDate?: Date;
  moveOutDate?: Date;
  idVerificationStatus:
    | "not_uploaded"
    | "pending_review"
    | "approved"
    | "rejected"
    | "resubmission_required";
  idRejectionReason?: string;
  idDocumentKey?: string;
  photoDocumentKey?: string;
  createdAt: Date;
  updatedAt: Date;
}

const ResidentProfileSchema = new Schema<IResidentProfile>(
  {
    userId: { type: Schema.Types.ObjectId, ref: "User", required: true, unique: true },
    gender: { type: String, enum: ["male", "female", "other"], default: "male" },
    dob: { type: Date, default: () => new Date("2000-01-01") },
    age: { type: Number, default: 24 },
    permanentAddress: { type: String, default: "Pending Verification", trim: true },
    occupation: { type: String, default: "Resident", trim: true },
    companyName: { type: String, trim: true },
    emergencyContact: {
      name: { type: String, default: "" },
      phone: { type: String, default: "" },
      relationship: { type: String, default: "" },
    },
    moveInDate: { type: Date },
    moveOutDate: { type: Date },
    idVerificationStatus: {
      type: String,
      enum: ["not_uploaded", "pending_review", "approved", "rejected", "resubmission_required"],
      default: "not_uploaded",
    },
    idRejectionReason: { type: String },
    idDocumentKey: { type: String },
    photoDocumentKey: { type: String },
  },
  { timestamps: true }
);

export const ResidentProfile: Model<IResidentProfile> =
  mongoose.models.ResidentProfile ||
  mongoose.model<IResidentProfile>("ResidentProfile", ResidentProfileSchema);
