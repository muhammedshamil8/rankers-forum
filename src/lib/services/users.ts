import dbConnect from '../mongodb';
import { UserModel } from '@/models/User';
import { User, CreateUserInput, UserRole } from '@/types';

/**
 * Helper to map Mongoose document to frontend User interface
 */
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

/**
 * Create a new user document in MongoDB
 */
export async function createUser(
  uid: string,
  data: CreateUserInput
): Promise<User> {
  await dbConnect();
  
  const user = await UserModel.create({
    _id: uid,
    ...data,
    isActive: true,
    avatarUrl: null,
  });
  
  return mapUser(user);
}

/**
 * Get a user by their UID
 */
export async function getUserById(uid: string): Promise<User | null> {
  await dbConnect();
  
  const user = await UserModel.findById(uid);
  if (!user) {
    return null;
  }
  
  return mapUser(user);
}

/**
 * Get a user by their email
 */
export async function getUserByEmail(email: string): Promise<User | null> {
  await dbConnect();
  
  const user = await UserModel.findOne({ email });
  if (!user) {
    return null;
  }
  
  return mapUser(user);
}

/**
 * Update a user's profile
 */
export async function updateUser(
  uid: string,
  data: Partial<Omit<User, 'id' | 'createdAt'>>
): Promise<void> {
  await dbConnect();
  await UserModel.findByIdAndUpdate(uid, data);
}

/**
 * Update a user's role
 */
export async function updateUserRole(
  uid: string,
  role: UserRole
): Promise<void> {
  await dbConnect();
  await UserModel.findByIdAndUpdate(uid, { role });
}

/**
 * Deactivate a user account
 */
export async function deactivateUser(uid: string): Promise<void> {
  await dbConnect();
  await UserModel.findByIdAndUpdate(uid, { isActive: false });
}

/**
 * Activate a user account
 */
export async function activateUser(uid: string): Promise<void> {
  await dbConnect();
  await UserModel.findByIdAndUpdate(uid, { isActive: true });
}

/**
 * Get all users by role
 */
export async function getUsersByRole(role: UserRole): Promise<User[]> {
  await dbConnect();
  
  const users = await UserModel.find({ role }).sort({ createdAt: -1 });
  return users.map(mapUser);
}

/**
 * Count users by role
 */
export async function countUsersByRole(role: UserRole): Promise<number> {
  await dbConnect();
  return UserModel.countDocuments({ role });
}
