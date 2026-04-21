import mongoose, { Schema, Document } from 'mongoose';
import { CollegeType } from '@/types/college';

export interface ICollegeCutoff extends Document {
  collegeName: string;
  collegeLocation: string;
  collegeType: CollegeType;
  quota?: string;
  city?: string;
  state?: string;
  courseName: string;
  courseFees?: number;
  year: number;
  category: string;
  rank: number;
  createdAt: Date;
}

const CollegeCutoffSchema = new Schema<ICollegeCutoff>(
  {
    collegeName: { type: String, required: true },
    collegeLocation: { type: String, required: true },
    collegeType: { type: String, default: '' },
    quota: { type: String, default: '' },
    city: { type: String, default: '' },
    state: { type: String, default: '' },
    courseName: { type: String, required: true },
    courseFees: { type: Number, default: 0 },
    year: { type: Number, required: true },
    category: { type: String, required: true },
    rank: { type: Number, required: true },
  },
  { timestamps: true, collection: 'colleges_cutoffs' }
);

CollegeCutoffSchema.index({ rank: 1, category: 1 });
CollegeCutoffSchema.index({ collegeName: 'text', courseName: 'text' });
CollegeCutoffSchema.index(
  { collegeName: 1, courseName: 1, category: 1, year: 1, quota: 1 }, 
  { unique: true }
);

export const CollegeCutoffModel = mongoose.models.CollegeCutoff || mongoose.model<ICollegeCutoff>('CollegeCutoff', CollegeCutoffSchema);
