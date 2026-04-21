// ============================================
// Generic Timestamp type for Firestore compatibility
// Works with both firebase/firestore and firebase-admin/firestore
// ============================================

// eslint-disable-next-line @typescript-eslint/no-explicit-any
export type FirestoreTimestamp = any;

// ============================================
// User Types
// ============================================

export type UserRole = 'student' | 'admin' | 'super_admin';

export interface User {
  id: string;
  role: UserRole;
  firstName: string;
  lastName: string;
  email: string;
  phone: string;
  city: string;
  state: string;
  isActive: boolean;
  avatarUrl: string | null;
  createdAt: FirestoreTimestamp;
  updatedAt: FirestoreTimestamp;
}

export interface CreateUserInput {
  role: UserRole;
  firstName: string;
  lastName: string;
  email: string;
  phone: string;
  city: string;
  state: string;
}

// ============================================
// Student Types
// ============================================

export type Gender = 'male' | 'female' | 'other';

export interface Student {
  userId: string;
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
  score: number;
  referralCode: string;
  createdAt: FirestoreTimestamp;
  updatedAt: FirestoreTimestamp;
}

export interface CreateStudentInput {
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
  score?: number;
  referralCode?: string;
}

// ============================================
// Admin Profile Types
// ============================================

export type JobType = 'full_time' | 'part_time' | 'contract';

export interface AdminProfile {
  userId: string;
  employeeNumber: string;
  dateOfJoining: FirestoreTimestamp;
  jobTitle: string;
  jobType: JobType;
  noticePeriod: string;
  dateOfBirth: FirestoreTimestamp;
  gender: Gender;
  maritalStatus: string;
  bloodGroup: string;
  nationality: string;
  maxActiveLeads: number;
  currentActiveLeads: number;
  isAvailable: boolean;
  createdAt: FirestoreTimestamp;
  updatedAt: FirestoreTimestamp;
}

export interface CreateAdminInput {
  firstName: string;
  lastName: string;
  email: string;
  phone: string;
  employeeNumber: string;
  jobTitle: string;
  jobType: JobType;
  maxActiveLeads: number;
}

// Combined user with profile for display
export interface AdminWithUser extends User {
  profile: AdminProfile;
}
