import mongoose, { Schema, Document } from 'mongoose';
import { UploadStatus } from '@/types/college';

export interface IUploadLog extends Document {
  uploadedBy: string;
  year: number;
  fileName: string;
  totalRows: number;
  processedRows: number;
  insertedCount: number;
  updatedCount: number;
  skippedCount: number;
  failedRows: number;
  errorLog: string[];
  status: UploadStatus;
  createdAt: Date;
  completedAt: Date | null;
}

const UploadLogSchema = new Schema<IUploadLog>(
  {
    uploadedBy: { type: String, required: true },
    year: { type: Number, required: true },
    fileName: { type: String, required: true },
    totalRows: { type: Number, required: true },
    processedRows: { type: Number, default: 0 },
    insertedCount: { type: Number, default: 0 },
    updatedCount: { type: Number, default: 0 },
    skippedCount: { type: Number, default: 0 },
    failedRows: { type: Number, default: 0 },
    errorLog: { type: [String], default: [] },
    status: { type: String, enum: ['processing', 'completed', 'failed'], default: 'processing' },
    completedAt: { type: Date, default: null },
  },
  { timestamps: true }
);

export const UploadLogModel = mongoose.models.UploadLog || mongoose.model<IUploadLog>('UploadLog', UploadLogSchema);
