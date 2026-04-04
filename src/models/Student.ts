import mongoose, { Schema, Document } from 'mongoose';
import { Gender } from '@/types/user';
import { IUser } from './User';

export interface IStudent extends Document {
  userId: string | IUser; // References User._id
  rank: number;
  yearOfPassing: number;
  category: string;
  gender: Gender;
  institution: string;
  domicileState: string;
  counsellingType: string;
  preferredBranch: string;
  locationPreference1: string;
  locationPreference2: string;
  locationPreference3: string;
  checksUsed: number;
  isProfileComplete: boolean;
  createdAt: Date;
  updatedAt: Date;
}

const StudentSchema = new Schema<IStudent>(
  {
    userId: { type: String, ref: 'User', required: true, unique: true }, // Firebase UID string
    rank: { type: Number, default: 0 },
    yearOfPassing: { type: Number, default: new Date().getFullYear() },
    category: { type: String, default: '' },
    gender: { type: String, enum: ['male', 'female', 'other'], default: 'male' },
    institution: { type: String, default: '' },
    domicileState: { type: String, default: '' },
    counsellingType: { type: String, default: '' },
    preferredBranch: { type: String, default: '' },
    locationPreference1: { type: String, default: '' },
    locationPreference2: { type: String, default: '' },
    locationPreference3: { type: String, default: '' },
    checksUsed: { type: Number, default: 0 },
    isProfileComplete: { type: Boolean, default: true },
  },
  { timestamps: true }
);

export const StudentModel = mongoose.models.Student || mongoose.model<IStudent>('Student', StudentSchema);
