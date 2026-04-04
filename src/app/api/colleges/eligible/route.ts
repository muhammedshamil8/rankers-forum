import { NextRequest, NextResponse } from 'next/server';
import { adminAuth } from '@/lib/firebase/admin';
import { getStudentByUserId, canPerformLookup, incrementChecksUsed } from '@/lib/services/students';
import { getUserById } from '@/lib/services/users';
import { getEligibleColleges } from '@/lib/services/colleges';
import { createLead } from '@/lib/services/leads';
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
 * GET /api/colleges/eligible - Get eligible colleges for student
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

    // Check if student can perform lookup
    const canLookup = await canPerformLookup(uid);

    if (!canLookup) {
      return NextResponse.json(
        { error: 'Maximum college checks reached (2/2)' },
        { status: 403 }
      );
    }

    // Get query parameters
    const searchParams = request.nextUrl.searchParams;
    const collegeType = searchParams.get('type') as CollegeType | null;
    const state = searchParams.get('state');

    // Get eligible colleges
    const { primary, others } = await getEligibleColleges({
      studentRank: student.rank,
      courseName: student.preferredBranch,
      category: student.category,
      year: CURRENT_YEAR - 1,
      quota: student.counsellingType,
      locations: [student.locationPreference1, student.locationPreference2, student.locationPreference3]
      // collegeType: collegeType || undefined,
      // state: state || undefined,
    });

    // Only increment usage and create lead on first call (not on filtering)
    const isFirstLookup = searchParams.get('track') === 'true';

    if (isFirstLookup) {
      // Increment checks used
      await incrementChecksUsed(uid);

      // Create lead
      await createLead({
        studentId: uid,
        studentName: `${user.firstName} ${user.lastName}`,
        studentPhone: user.phone,
        studentEmail: user.email,
        studentLocation: `${user.city}, ${user.state}`,
        rankUsed: student.rank,
        preferredBranch: student.preferredBranch,
        year: CURRENT_YEAR,
      });
    }

    return NextResponse.json({
      colleges: primary,
      otherColleges: others,
      totalCount: primary.length + others.length,
      currentYear: CURRENT_YEAR,
    });
  } catch (error) {
    console.error('Get eligible colleges error:', error);
    return NextResponse.json({ error: 'Failed to get colleges' }, { status: 500 });
  }
}
