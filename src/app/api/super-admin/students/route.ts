import { NextRequest, NextResponse } from 'next/server';
import { adminAuth } from '@/lib/firebase/admin';
import { getUserById } from '@/lib/services/users';
import dbConnect from '@/lib/mongodb';
import { UserModel } from '@/models/User';
import { StudentModel } from '@/models/Student';
import { LeadModel } from '@/models/Lead';

/**
 * Helper to verify super admin session
 */
async function verifySuperAdminSession(request: NextRequest): Promise<string | null> {
  const sessionCookie = request.cookies.get('session')?.value;

  if (!sessionCookie) {
    return null;
  }

  try {
    const decoded = await adminAuth.verifySessionCookie(sessionCookie, true);
    const user = await getUserById(decoded.uid);

    if (!user || user.role !== 'super_admin') {
      return null;
    }

    return decoded.uid;
  } catch {
    return null;
  }
}

/**
 * GET /api/super-admin/students - Get all students with their user data
 * Query params: state (optional) - filter by state
 */
export async function GET(request: NextRequest) {
  try {
    const superAdminUid = await verifySuperAdminSession(request);

    if (!superAdminUid) {
      return NextResponse.json({ error: 'Super admin access required' }, { status: 403 });
    }

    const searchParams = request.nextUrl.searchParams;
    const stateFilter = searchParams.get('state');

    await dbConnect();

    // Query users with student role
    let usersQuery: any = { role: 'student' };

    if (stateFilter && stateFilter !== 'all') {
      usersQuery.state = stateFilter;
    }

    const users = await UserModel.find(usersQuery);
    const userIds = users.map(u => u._id.toString());

    // Fetch batch student profiles to avoid N+1 queries
    const studentProfiles = await StudentModel.find({ userId: { $in: userIds } });
    const studentMap = new Map();
    studentProfiles.forEach(s => studentMap.set(s.userId.toString(), s));

    // Fetch batch leads
    const activeLeads = await LeadModel.find({
      studentId: { $in: userIds },
      callbackRequested: true
    });
    
    const leadMap = new Map();
    activeLeads.forEach(l => {
      if (!leadMap.has(l.studentId.toString())) {
        leadMap.set(l.studentId.toString(), l);
      }
    });

    const students = users.map(userDoc => {
      const userData = userDoc.toObject();
      const studentData = studentMap.get(userData._id.toString())?.toObject() || null;
      const callbackSnapshot = leadMap.get(userData._id.toString());

      return {
        id: userData._id.toString(),
        userId: userData._id.toString(),
        firstName: userData.firstName || '',
        lastName: userData.lastName || '',
        email: userData.email || '',
        phone: userData.phone || '',
        city: userData.city || '',
        state: userData.state || '',
        rank: studentData?.rank || null,
        institution: studentData?.institution || '',
        yearOfPassout: studentData?.yearOfPassing || null,
        domicileState: studentData?.domicileState || '',
        gender: studentData?.gender || '',
        category: studentData?.category || '',
        counsellingType: studentData?.counsellingType || '',
        preferredBranch: studentData?.preferredBranch || '',
        interestedLocations: [
          studentData?.locationPreference1,
          studentData?.locationPreference2,
          studentData?.locationPreference3,
        ].filter(Boolean),
        hasCallback: !!callbackSnapshot,
        leadId: callbackSnapshot ? callbackSnapshot._id.toString() : null,
      };
    });

    return NextResponse.json({ students });
  } catch (error) {
    console.error('Get students error:', error);
    return NextResponse.json({ error: 'Failed to get students' }, { status: 500 });
  }
}
