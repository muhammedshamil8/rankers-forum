import dbConnect from '../mongodb';
import { UserModel } from '@/models/User';
import { User, CreateUserInput, UserRole } from '@/types';


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


export async function getUserById(uid: string): Promise<User | null> {
  await dbConnect();
  
  const user = await UserModel.findById(uid);
  if (!user) {
    return null;
  }
  
  return mapUser(user);
}


export async function getUserByEmail(email: string): Promise<User | null> {
  await dbConnect();
  
  const user = await UserModel.findOne({ email });
  if (!user) {
    return null;
  }
  
  return mapUser(user);
}


export async function getUserByPhone(phone: string): Promise<User | null> {
  await dbConnect();
  
  const user = await UserModel.findOne({ phone });
  if (!user) {
    return null;
  }
  
  return mapUser(user);
}


export async function updateUser(
  uid: string,
  data: Partial<Omit<User, 'id' | 'createdAt'>>
): Promise<void> {
  await dbConnect();
  await UserModel.findByIdAndUpdate(uid, data);
}


export async function updateUserRole(
  uid: string,
  role: UserRole
): Promise<void> {
  await dbConnect();
  await UserModel.findByIdAndUpdate(uid, { role });
}


export async function deactivateUser(uid: string): Promise<void> {
  await dbConnect();
  await UserModel.findByIdAndUpdate(uid, { isActive: false });
}


export async function activateUser(uid: string): Promise<void> {
  await dbConnect();
  await UserModel.findByIdAndUpdate(uid, { isActive: true });
}


export async function getUsersByRole(role: UserRole): Promise<User[]> {
  await dbConnect();
  
  const users = await UserModel.find({ role }).sort({ createdAt: -1 });
  return users.map(mapUser);
}


export async function countUsersByRole(role: UserRole): Promise<number> {
  await dbConnect();
  return UserModel.countDocuments({ role });
}
