import { adminAuth } from '../firebase/admin';
import dbConnect from '../mongodb';
import { UserModel } from '@/models/User';
import { AdminProfileModel } from '@/models/AdminProfile';
import { DEFAULT_MAX_ACTIVE_LEADS } from '../constants';
import { AdminProfile, CreateAdminInput, AdminWithUser, User } from '@/types';

// Helper to map
function mapUser(doc: any): User {
  const data = doc.toObject ? doc.toObject() : doc;
  return {
    id: data._id.toString(),
    role: data.role,
    firstName: data.firstName,
    lastName: data.lastName,
    email: data.email,
    phone: data.phone,
    city: data.city,
    state: data.state,
    isActive: data.isActive,
    avatarUrl: data.avatarUrl,
    createdAt: data.createdAt,
    updatedAt: data.updatedAt,
  } as User;
}

function mapAdminProfile(doc: any): AdminProfile {
  const data = doc.toObject ? doc.toObject() : doc;
  return {
    userId: data.userId.toString(),
    employeeNumber: data.employeeNumber,
    dateOfJoining: data.dateOfJoining,
    jobTitle: data.jobTitle,
    jobType: data.jobType,
    noticePeriod: data.noticePeriod,
    dateOfBirth: data.dateOfBirth,
    gender: data.gender,
    maritalStatus: data.maritalStatus,
    bloodGroup: data.bloodGroup,
    nationality: data.nationality,
    maxActiveLeads: data.maxActiveLeads,
    currentActiveLeads: data.currentActiveLeads,
    isAvailable: data.isAvailable,
    createdAt: data.createdAt,
    updatedAt: data.updatedAt,
  } as AdminProfile;
}

/**
 * Create a new admin user and profile
 */
export async function createAdmin(
  data: CreateAdminInput,
  password: string
): Promise<AdminWithUser> {
  await dbConnect();
  
  let userRecord;
  try {
    // Create Firebase Auth user
    userRecord = await adminAuth.createUser({
      email: data.email,
      password: password,
      displayName: `${data.firstName} ${data.lastName}`,
    });
  } catch (error) {
    throw error;
  }

  const now = new Date();

  try {
    const user = await UserModel.create({
      _id: userRecord.uid,
      role: 'admin',
      firstName: data.firstName,
      lastName: data.lastName,
      email: data.email,
      phone: data.phone,
      city: '',
      state: '',
      isActive: true,
      avatarUrl: null,
    });

    const adminProfile = await AdminProfileModel.create({
      userId: userRecord.uid,
      employeeNumber: data.employeeNumber,
      dateOfJoining: now,
      jobTitle: data.jobTitle,
      jobType: data.jobType,
      noticePeriod: '',
      dateOfBirth: now, 
      gender: 'male', 
      maritalStatus: '',
      bloodGroup: '',
      nationality: 'India',
      maxActiveLeads: data.maxActiveLeads || DEFAULT_MAX_ACTIVE_LEADS,
      currentActiveLeads: 0,
      isAvailable: true,
    });

    return {
      ...mapUser(user),
      profile: mapAdminProfile(adminProfile),
    } as AdminWithUser;
  } catch (error) {
    // Rollback Firebase user if DB save fails
    await adminAuth.deleteUser(userRecord.uid);
    throw error;
  }
}

/**
 * Get an admin profile by user ID
 */
export async function getAdminByUserId(userId: string): Promise<AdminProfile | null> {
  await dbConnect();
  const doc = await AdminProfileModel.findOne({ userId });
  if (!doc) return null;
  return mapAdminProfile(doc);
}

/**
 * Get admin with user data
 */
export async function getAdminWithUser(userId: string): Promise<AdminWithUser | null> {
  await dbConnect();
  const user = await UserModel.findById(userId);
  const profile = await AdminProfileModel.findOne({ userId });

  if (!user || !profile) return null;

  return {
    ...mapUser(user),
    profile: mapAdminProfile(profile),
  } as AdminWithUser;
}

/**
 * Get all admins with their user data
 */
export async function getAllAdmins(): Promise<AdminWithUser[]> {
  await dbConnect();
  
  const users = await UserModel.find({ role: 'admin' });
  const userIds = users.map(u => u._id);
  
  const profiles = await AdminProfileModel.find({ userId: { $in: userIds } });
  
  const adminDict = new Map();
  profiles.forEach(p => adminDict.set(p.userId.toString(), p));
  
  const results: AdminWithUser[] = [];
  
  users.forEach(u => {
    const p = adminDict.get(u._id.toString());
    if (p) {
      results.push({
        ...mapUser(u),
        profile: mapAdminProfile(p)
      } as AdminWithUser);
    }
  });

  return results;
}

/**
 * Get available admins for lead assignment
 */
export async function getAvailableAdmins(): Promise<AdminWithUser[]> {
  await dbConnect();
  // We need admins that are available and have capacity.
  // $expr allows us to compare two fields in the same document.
  const activeProfiles = await AdminProfileModel.find({
    isAvailable: true,
    $expr: { $lt: ["$currentActiveLeads", "$maxActiveLeads"] }
  });
  
  const userIds = activeProfiles.map(p => p.userId);
  const users = await UserModel.find({ _id: { $in: userIds }, role: 'admin', isActive: true });
  
  const activeUserIds = new Set(users.map(u => u._id.toString()));
  
  const results: AdminWithUser[] = [];
  
  for (const profile of activeProfiles) {
    if (activeUserIds.has(profile.userId.toString())) {
       const user = users.find(u => u._id.toString() === profile.userId.toString());
       if (user) {
         results.push({
           ...mapUser(user),
           profile: mapAdminProfile(profile)
         });
       }
    }
  }
  
  return results;
}

/**
 * Update admin profile
 */
export async function updateAdminProfile(
  userId: string,
  data: Partial<Omit<AdminProfile, 'userId' | 'createdAt'>>
): Promise<void> {
  await dbConnect();
  await AdminProfileModel.findOneAndUpdate({ userId }, data);
}

/**
 * Set admin availability
 */
export async function setAdminAvailability(
  userId: string,
  isAvailable: boolean
): Promise<void> {
  await dbConnect();
  await AdminProfileModel.findOneAndUpdate({ userId }, { isAvailable });
}

/**
 * Deactivate an admin
 */
export async function deactivateAdmin(userId: string): Promise<void> {
  await dbConnect();
  await Promise.all([
    UserModel.findByIdAndUpdate(userId, { isActive: false }),
    AdminProfileModel.findOneAndUpdate({ userId }, { isAvailable: false })
  ]);
}

/**
 * Activate an admin
 */
export async function activateAdmin(userId: string): Promise<void> {
  await dbConnect();
  await Promise.all([
    UserModel.findByIdAndUpdate(userId, { isActive: true }),
    AdminProfileModel.findOneAndUpdate({ userId }, { isAvailable: true })
  ]);
}
