import { NextRequest, NextResponse } from 'next/server';
import { adminAuth } from '@/lib/firebase/admin';
import { getStudentByUserId } from '@/lib/services/students';
import { getUserById } from '@/lib/services/users';
import { getPreviousYearCutoffs } from '@/lib/services/colleges';
import { CollegeType } from '@/types';
import { CURRENT_YEAR } from '@/lib/constants';

/**
 * Helper to verify session and get user ID
 */
async function verifySession(request: NextRequest): Promise<string | null> {
  const sessionCookie = request.cookies.get('session')?.value;
  
  if (!sessionCookie) {
    return null;
  }

  try {
    const decoded = await adminAuth.verifySessionCookie(sessionCookie, true);
    return decoded.uid;
  } catch {
    return null;
  }
}

/**
 * GET /api/colleges/previous-year - Get previous year cutoffs
 * Query params: type (optional), state (optional)
 */
export async function GET(request: NextRequest) {
  try {
    const uid = await verifySession(request);
    
    if (!uid) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const user = await getUserById(uid);
    
    if (!user || user.role !== 'student') {
      return NextResponse.json({ error: 'Not a student' }, { status: 403 });
    }

    const student = await getStudentByUserId(uid);

    if (!student || !student.isProfileComplete) {
      return NextResponse.json(
        { error: 'Complete your profile first' },
        { status: 400 }
      );
    }

    // Get query parameters
    const searchParams = request.nextUrl.searchParams;
    const collegeType = searchParams.get('type') as CollegeType | null;
    const state = searchParams.get('state');

    // Get previous year cutoffs (last 2 years)
    const cutoffsByYear = await getPreviousYearCutoffs({
      studentRank: student.rank,
      courseName: student.preferredBranch,
      category: student.category,
      // quota: student.counsellingType === 'all_india' ? 'All India' : 'State',
      currentYear: CURRENT_YEAR,
      yearsBack: 2,
      locations: [student.locationPreference1, student.locationPreference2, student.locationPreference3]
      // collegeType: collegeType || undefined,
      // state: state || undefined,
    });

    return NextResponse.json({
      cutoffsByYear,
      studentRank: student.rank,
    });
  } catch (error) {
    console.error('Get previous year cutoffs error:', error);
    return NextResponse.json({ error: 'Failed to get cutoffs' }, { status: 500 });
  }
}
