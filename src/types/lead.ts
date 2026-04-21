import { FirestoreTimestamp } from './user';

export type LeadStatus = 'new' | 'assigned' | 'in_progress' | 'completed' | 'closed';

export interface Lead {
  id: string;
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
  assignedAt: FirestoreTimestamp | null;
  createdAt: FirestoreTimestamp;
  updatedAt: FirestoreTimestamp;
}

export interface CreateLeadInput {
  studentId: string;
  studentName: string;
  studentPhone: string;
  studentEmail: string;
  studentLocation: string;
  rankUsed: number;
  preferredBranch: string;
  year: number;
}

export type FollowupStatus = 'pending' | 'completed';

export interface LeadFollowup {
  id: string;
  leadId: string;
  adminId: string;
  remark: string;
  nextCallbackDate: FirestoreTimestamp | null;
  status: FollowupStatus;
  createdAt: FirestoreTimestamp;
}

export interface CreateFollowupInput {
  leadId: string;
  remark: string;
  nextCallbackDate?: Date;
}

export interface LeadWithStudent extends Lead {
  student?: {
    rank: number;
    category: string;
    yearOfPassing: number;
    institution: string;
    domicileState: string;
    gender: string;
    counsellingType: string;
    preferredBranch: string;
    locationPreference1: string;
    locationPreference2: string;
    locationPreference3: string;
  };
}
