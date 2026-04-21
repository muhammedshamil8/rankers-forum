import { FirestoreTimestamp } from './user';

export type CollegeType = 'government' | 'private' | 'deemed' | '';

export interface CollegeRankCutoff {
  id: string;
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
  createdAt: FirestoreTimestamp;
}

export type ChanceLevel = 'high' | 'moderate' | 'low' | 'not_eligible';

export interface CollegeWithChance extends CollegeRankCutoff {
  chance: ChanceLevel;
  chanceLabel: string;
}

export type UploadStatus = 'processing' | 'completed' | 'failed';

export interface ExcelUploadLog {
  id: string;
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
  createdAt: FirestoreTimestamp;
  completedAt: FirestoreTimestamp | null;
}

export interface DashboardStats {
  id: string;
  totalRegistrations: number;
  totalInfoFilled: number;
  totalRequests: number;
  pendingCallbacks: number;
  updatedAt: FirestoreTimestamp;
}
