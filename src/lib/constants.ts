// ============================================
// Form Options
// ============================================

export const CATEGORIES = [
  { value: 'general', label: 'General Merit(GM)' },
  { value: 'obc', label: 'OBC' },
  { value: 'sc', label: 'SC' },
  { value: 'st', label: 'ST' },
  { value: 'ews', label: 'EWS' },
] as const;

// Alias for NEET specific categories
export const NEET_CATEGORIES = CATEGORIES;

export const GENDERS = [
  { value: 'male', label: 'Male' },
  { value: 'female', label: 'Female' },
  { value: 'other', label: 'Other' },
] as const;

export const COUNSELLING_TYPES = [
  { value: 'all_india', label: 'All India Counselling' },
  { value: 'state', label: 'State Counselling' },
  { value: 'deemed', label: 'Deemed Counselling' },
] as const;

// Alias for quota types
export const QUOTA_TYPES = COUNSELLING_TYPES;

export const QUOTAS = [
  { value: 'all_india', label: 'All India' },
  { value: 'state', label: 'State' },
] as const;

export const COLLEGE_TYPES = [
  { value: 'government', label: 'Government' },
  { value: 'private', label: 'Private' },
  { value: 'deemed', label: 'Deemed' },
] as const;


export const JOB_TYPES = [
  { value: 'full_time', label: 'Full Time' },
  { value: 'part_time', label: 'Part Time' },
  { value: 'contract', label: 'Contract' },
] as const;

export const LEAD_STATUSES = [
  { value: 'new', label: 'New' },
  { value: 'assigned', label: 'Assigned' },
  { value: 'in_progress', label: 'In Progress' },
  { value: 'completed', label: 'Completed' },
  { value: 'closed', label: 'Closed' },
] as const;

// ============================================
// Indian States
// ============================================

export const INDIAN_STATES = [
  'Andhra Pradesh',
  'Arunachal Pradesh',
  'Assam',
  'Bihar',
  'Chhattisgarh',
  'Goa',
  'Gujarat',
  'Haryana',
  'Himachal Pradesh',
  'Jharkhand',
  'Karnataka',
  'Kerala',
  'Madhya Pradesh',
  'Maharashtra',
  'Manipur',
  'Meghalaya',
  'Mizoram',
  'Nagaland',
  'Odisha',
  'Punjab',
  'Rajasthan',
  'Sikkim',
  'Tamil Nadu',
  'Telangana',
  'Tripura',
  'Uttar Pradesh',
  'Uttarakhand',
  'West Bengal',
  'Delhi',
  'Jammu and Kashmir',
  'Ladakh',
  'Puducherry',
  'Chandigarh',
] as const;

// ============================================
// Business Rules
// ============================================

export const MAX_COLLEGE_CHECKS = 2;
export const DEFAULT_MAX_ACTIVE_LEADS = 50;

// ============================================
// Years for Data
// ============================================

export const AVAILABLE_YEARS = [2023, 2024, 2025] as const;
export const CURRENT_YEAR = 2025;
