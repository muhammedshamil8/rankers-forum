import mongoose, { Schema, Document } from 'mongoose';
import { UserRole } from '@/types/user';

export interface IUser extends Document<string> {
  _id: string; 
  role: UserRole;
  firstName: string;
  lastName: string;
  email: string;
  phone: string;
  city: string;
  state: string;
  isActive: boolean;
  avatarUrl: string | null;
  createdAt: Date;
  updatedAt: Date;
}

const UserSchema = new Schema<IUser>(
  {
    _id: { type: String, required: true }, 
    role: { type: String, enum: ['student', 'admin', 'super_admin'], required: true },
    firstName: { type: String, required: true },
    lastName: { type: String, required: true },
    email: { type: String, required: true, unique: true },
    phone: { type: String, default: '', required: false },
    city: { type: String, default: '', required: false },
    state: { type: String, default: '', required: false },
    isActive: { type: Boolean, default: true },
    avatarUrl: { type: String, default: null },
  },
  { 
    timestamps: true,
    _id: false
  }
);

if (mongoose.models && mongoose.models.User) {
  mongoose.deleteModel('User');
}

export const UserModel = mongoose.models.User || mongoose.model<IUser>('User', UserSchema);
