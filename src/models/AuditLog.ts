import mongoose, { Schema, Document, Model } from "mongoose";

export interface IAuditLog extends Document {
  actorId?: mongoose.Types.ObjectId;
  actorRole: string;
  action: string;
  entityType: string;
  entityId?: string;
  details?: Record<string, any>;
  ipAddress?: string;
  createdAt: Date;
}

const AuditLogSchema = new Schema<IAuditLog>(
  {
    actorId: { type: Schema.Types.ObjectId, ref: "User" },
    actorRole: { type: String, required: true, default: "system" },
    action: { type: String, required: true },
    entityType: { type: String, required: true, default: "General" },
    entityId: { type: String },
    details: { type: Schema.Types.Mixed },
    ipAddress: { type: String },
    createdAt: { type: Date, default: Date.now },
  },
  { timestamps: false, strict: false }
);

// Map alternate/legacy property names automatically to prevent validation errors
AuditLogSchema.pre("validate", function (next) {
  const self = this as any;
  if (!self.actorId && self.performedBy) self.actorId = self.performedBy;
  if (!self.entityType && self.targetModel) self.entityType = self.targetModel;
  if (!self.entityId && self.targetId) self.entityId = String(self.targetId);
  if (!self.details && self.metadata) self.details = self.metadata;
  if (!self.actorRole) self.actorRole = "resident";
  if (!self.entityType) self.entityType = "User";
  next();
});

AuditLogSchema.index({ createdAt: -1 });
AuditLogSchema.index({ entityType: 1, entityId: 1 });

export const AuditLog: Model<IAuditLog> =
  mongoose.models.AuditLog || mongoose.model<IAuditLog>("AuditLog", AuditLogSchema);
