import mongoose, { Schema, Document } from 'mongoose';

export interface IDashboardStats extends Document {
  totalRegistrations: number;
  totalInfoFilled: number;
  totalRequests: number;
  pendingCallbacks: number;
  updatedAt: Date;
}

const DashboardStatsSchema = new Schema<IDashboardStats>(
  {
    totalRegistrations: { type: Number, default: 0 },
    totalInfoFilled: { type: Number, default: 0 },
    totalRequests: { type: Number, default: 0 },
    pendingCallbacks: { type: Number, default: 0 },
  },
  { timestamps: true }
);

export const DashboardStatsModel = mongoose.models.DashboardStats || mongoose.model<IDashboardStats>('DashboardStats', DashboardStatsSchema);
