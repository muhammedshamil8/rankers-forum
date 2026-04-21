export type FirestoreTimestamp = any;

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

export interface AdminWithUser extends User {
  profile: AdminProfile;
}
