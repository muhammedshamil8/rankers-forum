import mongoose, { Schema, Document } from 'mongoose';
import { IStudent } from './Student';
import { IUser } from './User';

export type LeadStatus = 'new' | 'assigned' | 'in_progress' | 'completed' | 'closed';

export interface ILead extends Document {
  studentId: string; 
  studentName: string;
  studentPhone: string;
  studentEmail: string;
  studentLocation: string;
  rankUsed: number;
  preferredBranch: string;
  year: number;
  status: LeadStatus;
  callbackRequested: boolean;
  assignedAdminId: string | null; 
  assignedAt: Date | null;
  createdAt: Date;
  updatedAt: Date;
}

const LeadSchema = new Schema<ILead>(
  {
    studentId: { type: String, required: true }, 
    studentName: { type: String, default: '' },
    studentPhone: { type: String, default: '' },
    studentEmail: { type: String, default: '' },
    studentLocation: { type: String, default: '' },
    rankUsed: { type: Number, required: true },
    preferredBranch: { type: String, required: true },
    year: { type: Number, required: true },
    status: { type: String, enum: ['new', 'assigned', 'in_progress', 'completed', 'closed'], default: 'new' },
    callbackRequested: { type: Boolean, default: false },
    assignedAdminId: { type: String, default: null }, 
    assignedAt: { type: Date, default: null },
  },
  { timestamps: true }
);

export const LeadModel = mongoose.models.Lead || mongoose.model<ILead>('Lead', LeadSchema);



export type FollowupStatus = 'pending' | 'completed';

export interface ILeadFollowup extends Document {
  leadId: string | ILead;
  adminId: string | IUser;
  remark: string;
  nextCallbackDate: Date | null;
  status: FollowupStatus;
  createdAt: Date;
  updatedAt: Date;
}

const LeadFollowupSchema = new Schema<ILeadFollowup>(
  {
    leadId: { type: Schema.Types.ObjectId, ref: 'Lead', required: true },
    adminId: { type: String, ref: 'User', required: true },
    remark: { type: String, required: true },
    nextCallbackDate: { type: Date, default: null },
    status: { type: String, enum: ['pending', 'completed'], default: 'pending' },
  },
  { timestamps: true }
);

export const LeadFollowupModel = mongoose.models.LeadFollowup || mongoose.model<ILeadFollowup>('LeadFollowup', LeadFollowupSchema);
