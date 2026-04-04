import { FirestoreTimestamp } from './user';

// ============================================
// College Types
// ============================================

export type CollegeType = 'government' | 'private' | 'deemed' | '';

// ============================================
// College Rank Cutoff Types
// ============================================

export interface CollegeRankCutoff {
  id: string;
  // All data denormalized - no foreign keys
  collegeName: string;
  collegeLocation: string;
  collegeType: CollegeType;
  quota?: string;
  city?: string;
  state?: string;
  // Course data
  courseName: string;
  courseFees?: number;
  year: number;
  category: string;
  rank: number;
  createdAt: FirestoreTimestamp;
}

// ============================================
// Chance Indicator
// ============================================

export type ChanceLevel = 'high' | 'moderate' | 'low' | 'not_eligible';

export interface CollegeWithChance extends CollegeRankCutoff {
  chance: ChanceLevel;
  chanceLabel: string;
}

// ============================================
// Excel Upload Types
// ============================================

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

// ============================================
// Dashboard Stats
// ============================================

export interface DashboardStats {
  id: string;
  totalRegistrations: number;
  totalInfoFilled: number;
  totalRequests: number;
  pendingCallbacks: number;
  updatedAt: FirestoreTimestamp;
}
