import mongoose, { Schema, Document } from 'mongoose';

export interface IReferralCode extends Document {
  code: string;
  description: string;
  isActive: boolean;
  createdAt: Date;
  updatedAt: Date;
}

const ReferralCodeSchema = new Schema<IReferralCode>(
  {
    code: { type: String, required: true, unique: true, uppercase: true },
    description: { type: String, default: '' },
    isActive: { type: Boolean, default: true },
  },
  { timestamps: true }
);

export const ReferralCodeModel = mongoose.models.ReferralCode || mongoose.model<IReferralCode>('ReferralCode', ReferralCodeSchema);
