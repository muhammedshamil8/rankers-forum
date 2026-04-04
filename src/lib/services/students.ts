import dbConnect from '../mongodb';
import { StudentModel } from '@/models/Student';
import { DashboardStatsModel } from '@/models/Stats';
import { Student, CreateStudentInput } from '@/types';
import { MAX_COLLEGE_CHECKS } from '../constants';

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
    createdAt: data.createdAt,
    updatedAt: data.updatedAt,
  } as Student;
}

/**
 * Create a new student profile
 */
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
  
  // Increment totalInfoFilled in stats
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

/**
 * Get a student by their user ID
 */
export async function getStudentByUserId(userId: string): Promise<Student | null> {
  await dbConnect();
  
  const doc = await StudentModel.findOne({ userId });
  if (!doc) {
    return null;
  }
  
  return mapStudent(doc);
}

/**
 * Update a student's profile
 */
export async function updateStudent(
  userId: string,
  data: Partial<Omit<Student, 'userId' | 'createdAt' | 'checksUsed'>>
): Promise<void> {
  await dbConnect();
  await StudentModel.findOneAndUpdate({ userId }, data);
}

/**
 * Increment the checks used count for a student
 * Returns false if max checks already reached
 */
export async function incrementChecksUsed(userId: string): Promise<boolean> {
  await dbConnect();
  const student = await StudentModel.findOne({ userId });
  
  if (!student) {
    throw new Error('Student not found');
  }
  
  if (student.checksUsed >= MAX_COLLEGE_CHECKS) {
    return false;
  }
  
  student.checksUsed += 1;
  await student.save();
  return true;
}

/**
 * Check if a student can perform more college lookups
 */
export async function canPerformLookup(userId: string): Promise<boolean> {
  await dbConnect();
  const student = await StudentModel.findOne({ userId });
  
  if (!student) {
    return false;
  }
  
  return student.checksUsed < MAX_COLLEGE_CHECKS;
}

/**
 * Get remaining checks for a student
 */
export async function getRemainingChecks(userId: string): Promise<number> {
  await dbConnect();
  const student = await StudentModel.findOne({ userId });
  
  if (!student) {
    return 0;
  }
  
  return MAX_COLLEGE_CHECKS - student.checksUsed;
}

/**
 * Get all students with pagination
 */
export async function getStudents(
  limit: number = 20,
  startAfter?: string
): Promise<Student[]> {
  await dbConnect();
  
  let query = StudentModel.find().sort({ createdAt: -1 }).limit(limit);
  
  if (startAfter) {
    const startDoc = await StudentModel.findOne({ userId: startAfter });
    if (startDoc) {
      // Find documents created strictly before the startAfter document
      query = query.where('createdAt').lt(startDoc.createdAt);
    }
  }
  
  const snapshot = await query.exec();
  return snapshot.map(mapStudent);
}

/**
 * Count total students
 */
export async function countStudents(): Promise<number> {
  await dbConnect();
  return StudentModel.countDocuments();
}

/**
 * Count students with complete profiles
 */
export async function countCompletedProfiles(): Promise<number> {
  await dbConnect();
  return StudentModel.countDocuments({ isProfileComplete: true });
}
