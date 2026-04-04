import mongoose, { Schema, Document } from 'mongoose';
import { Gender, JobType } from '@/types/user';
import { IUser } from './User';

export interface IAdminProfile extends Document {
  userId: string | IUser;
  employeeNumber: string;
  dateOfJoining: Date;
  jobTitle: string;
  jobType: JobType;
  noticePeriod: string;
  dateOfBirth: Date;
  gender: Gender;
  maritalStatus: string;
  bloodGroup: string;
  nationality: string;
  maxActiveLeads: number;
  currentActiveLeads: number;
  isAvailable: boolean;
  createdAt: Date;
  updatedAt: Date;
}

const AdminProfileSchema = new Schema<IAdminProfile>(
  {
    userId: { type: String, ref: 'User', required: true, unique: true }, // Firebase UID string
    employeeNumber: { type: String, required: true, unique: true },
    dateOfJoining: { type: Date, required: true },
    jobTitle: { type: String, required: true },
    jobType: { type: String, enum: ['full_time', 'part_time', 'contract'], required: true },
    noticePeriod: { type: String, default: '' },
    dateOfBirth: { type: Date, required: true },
    gender: { type: String, enum: ['male', 'female', 'other'], required: true },
    maritalStatus: { type: String, default: '' },
    bloodGroup: { type: String, default: '' },
    nationality: { type: String, required: true },
    maxActiveLeads: { type: Number, default: 50 },
    currentActiveLeads: { type: Number, default: 0 },
    isAvailable: { type: Boolean, default: true },
  },
  { timestamps: true }
);

export const AdminProfileModel = mongoose.models.AdminProfile || mongoose.model<IAdminProfile>('AdminProfile', AdminProfileSchema);
