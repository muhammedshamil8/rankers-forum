import dbConnect from '../mongodb';
import { DashboardStatsModel } from '@/models/Stats';
import { DashboardStats } from '@/types';
import { UserModel } from '@/models/User';
import { StudentModel } from '@/models/Student';
import { LeadModel } from '@/models/Lead';


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


export async function initializeStats(): Promise<void> {
  await dbConnect();
  await getStatsDoc();
}


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


export async function recalculateStats(): Promise<DashboardStats> {
  await dbConnect();
  
  const [usersCount, studentsCount, totalRequests, pendingCallbacks] = await Promise.all([
    UserModel.countDocuments({ role: 'student' }),
    StudentModel.countDocuments({ isProfileComplete: true }),
    LeadModel.countDocuments({}),
    LeadModel.countDocuments({ status: { $in: ['assigned', 'in_progress'] } }),
  ]);
  
  const statsUpdate = {
    totalRegistrations: usersCount,
    totalInfoFilled: studentsCount,
    totalRequests,
    pendingCallbacks,
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
