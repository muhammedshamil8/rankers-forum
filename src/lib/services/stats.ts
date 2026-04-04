import dbConnect from '../mongodb';
import { DashboardStatsModel } from '@/models/Stats';
import { DashboardStats } from '@/types';
import { UserModel } from '@/models/User';
import { StudentModel } from '@/models/Student';
import { adminDb } from '../firebase/admin';
import { COLLECTIONS } from '../constants';

/**
 * Helper to get the single stats document
 */
async function getStatsDoc() {
  let doc = await DashboardStatsModel.findOne();
  if (!doc) {
    doc = await DashboardStatsModel.create({
      totalRegistrations: 0,
      totalInfoFilled: 0,
      totalRequests: 0,
      pendingCallbacks: 0,
    });
  }
  return doc;
}

/**
 * Initialize dashboard stats if they don't exist
 */
export async function initializeStats(): Promise<void> {
  await dbConnect();
  await getStatsDoc();
}

/**
 * Get dashboard stats
 */
export async function getDashboardStats(): Promise<DashboardStats> {
  await dbConnect();
  const doc = await getStatsDoc();
  
  return {
    id: 'global',
    totalRegistrations: doc.totalRegistrations,
    totalInfoFilled: doc.totalInfoFilled,
    totalRequests: doc.totalRequests,
    pendingCallbacks: doc.pendingCallbacks,
    updatedAt: doc.updatedAt,
  } as DashboardStats;
}

/**
 * Increment a specific stat
 */
export async function incrementStat(
  stat: keyof Omit<DashboardStats, 'id' | 'updatedAt'>,
  amount: number = 1
): Promise<void> {
  await dbConnect();
  const doc = await getStatsDoc();
  await DashboardStatsModel.findByIdAndUpdate(doc._id, {
    $inc: { [stat]: amount }
  });
}

/**
 * Decrement a specific stat
 */
export async function decrementStat(
  stat: keyof Omit<DashboardStats, 'id' | 'updatedAt'>,
  amount: number = 1
): Promise<void> {
  await dbConnect();
  const doc = await getStatsDoc();
  await DashboardStatsModel.findByIdAndUpdate(doc._id, {
    $inc: { [stat]: -amount }
  });
}

/**
 * Recalculate all stats from scratch (utility function)
 */
export async function recalculateStats(): Promise<DashboardStats> {
  await dbConnect();
  
  const usersCount = await UserModel.countDocuments({ role: 'student' });
  const studentsCount = await StudentModel.countDocuments({ isProfileComplete: true });
  
  // Leads are still on Firestore for now
  const [leadsSnap, pendingSnap] = await Promise.all([
    adminDb.collection(COLLECTIONS.LEADS).count().get(),
    adminDb.collection(COLLECTIONS.LEADS).where('status', 'in', ['assigned', 'in_progress']).count().get(),
  ]);
  
  const statsUpdate = {
    totalRegistrations: usersCount,
    totalInfoFilled: studentsCount,
    totalRequests: leadsSnap.data().count,
    pendingCallbacks: pendingSnap.data().count,
  };
  
  const doc = await getStatsDoc();
  const updated = await DashboardStatsModel.findByIdAndUpdate(doc._id, statsUpdate, { new: true });
  
  return {
    id: 'global',
    totalRegistrations: updated.totalRegistrations,
    totalInfoFilled: updated.totalInfoFilled,
    totalRequests: updated.totalRequests,
    pendingCallbacks: updated.pendingCallbacks,
    updatedAt: updated.updatedAt,
  } as DashboardStats;
}
