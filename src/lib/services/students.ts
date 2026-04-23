import dbConnect from '../mongodb';
import { StudentModel } from '@/models/Student';
import { DashboardStatsModel } from '@/models/Stats';
import { Student, CreateStudentInput } from '@/types';
import { MAX_COLLEGE_CHECKS } from '../constants';
import { getUserById } from './users';

/**
 * Helper to map Mongoose document to frontend Student interface
 */
function mapStudent(doc: any): Student {
  const data = doc.toObject ? doc.toObject() : doc;
  return {
    userId: data.userId.toString(),
    rank: data.rank,
    yearOfPassing: data.yearOfPassing,
    category: data.category,
    gender: data.gender,
    institution: data.institution,
    domicileState: data.domicileState,
    counsellingType: data.counsellingType,
    preferredBranch: data.preferredBranch,
    locationPreference1: data.locationPreference1,
    locationPreference2: data.locationPreference2,
    locationPreference3: data.locationPreference3,
    checksUsed: data.checksUsed,
    isProfileComplete: data.isProfileComplete,
    score: data.score,
    referralCode: data.referralCode,
    createdAt: data.createdAt,
    updatedAt: data.updatedAt,
  } as Student;
}

export async function createStudent(
  userId: string,
  data: CreateStudentInput
): Promise<Student> {
  await dbConnect();
  
  const student = await StudentModel.create({
    userId,
    ...data,
    checksUsed: 0,
    isProfileComplete: true,
  });
  
  let statsDoc = await DashboardStatsModel.findOne();
  if (!statsDoc) {
    statsDoc = await DashboardStatsModel.create({
      totalRegistrations: 0,
      totalInfoFilled: 0,
      totalRequests: 0,
      pendingCallbacks: 0,
    });
  }
  
  await DashboardStatsModel.findByIdAndUpdate(statsDoc._id, {
    $inc: { totalInfoFilled: 1 }
  });
  
  return mapStudent(student);
}


export async function getStudentByUserId(userId: string): Promise<Student | null> {
  await dbConnect();
  
  const doc = await StudentModel.findOne({ userId });
  if (!doc) {
    return null;
  }
  
  return mapStudent(doc);
}


export async function updateStudent(
  userId: string,
  data: Partial<Omit<Student, 'userId' | 'createdAt' | 'checksUsed'>>
): Promise<void> {
  await dbConnect();
  await StudentModel.findOneAndUpdate({ userId }, data);
}


export async function incrementChecksUsed(userId: string): Promise<boolean> {
  await dbConnect();
  
  const user = await getUserById(userId);
  if (user && (user.role === 'admin' || user.role === 'super_admin')) {
    return true; // Admins have unlimited checks
  }

  const student = await StudentModel.findOne({ userId });
  
  if (!student) {
    throw new Error('Student not found');
  }
  
  /* 
  if (student.checksUsed >= MAX_COLLEGE_CHECKS) {
    return false;
  }
  
  student.checksUsed += 1;
  await student.save();
  */
  return true;
}


export async function canPerformLookup(userId: string): Promise<boolean> {
  await dbConnect();
  
  const user = await getUserById(userId);
  if (user && (user.role === 'admin' || user.role === 'super_admin')) {
    return true; // Admins can always perform lookup
  }

  /*
  const student = await StudentModel.findOne({ userId });
  
  if (!student) {
    return false;
  }
  
  return student.checksUsed < MAX_COLLEGE_CHECKS;
  */
  return true; // Bypass all limit checks
}


export async function getRemainingChecks(userId: string): Promise<number> {
  await dbConnect();
  const student = await StudentModel.findOne({ userId });
  
  if (!student) {
    return 0;
  }
  
  return MAX_COLLEGE_CHECKS - student.checksUsed;
}


export async function getStudents(
  limit: number = 20,
  startAfter?: string
): Promise<Student[]> {
  await dbConnect();
  
  let query = StudentModel.find().sort({ createdAt: -1 }).limit(limit);
  
  if (startAfter) {
    const startDoc = await StudentModel.findOne({ userId: startAfter });
    if (startDoc) {
      query = query.where('createdAt').lt(startDoc.createdAt);
    }
  }
  
  const snapshot = await query.exec();
  return snapshot.map(mapStudent);
}


export async function countStudents(): Promise<number> {
  await dbConnect();
  return StudentModel.countDocuments();
}


export async function countCompletedProfiles(): Promise<number> {
  await dbConnect();
  return StudentModel.countDocuments({ isProfileComplete: true });
}
