import { NextRequest, NextResponse } from 'next/server';
import { adminAuth } from '@/lib/firebase/admin';
import { getStudentByUserId, canPerformLookup, incrementChecksUsed } from '@/lib/services/students';
import { getUserById } from '@/lib/services/users';
import { getEligibleColleges } from '@/lib/services/colleges';
import { createLead } from '@/lib/services/leads';
import { CollegeType } from '@/types';
import { CURRENT_YEAR, MAX_COLLEGE_CHECKS } from '@/lib/constants';


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


export async function GET(request: NextRequest) {
  try {
    const uid = await verifySession(request);

    if (!uid) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const user = await getUserById(uid);

    if (!user || !['student', 'admin', 'super_admin'].includes(user.role)) {
      return NextResponse.json({ error: 'Unauthorized role' }, { status: 403 });
    }

    const student = await getStudentByUserId(uid);

    if (!student || !student.isProfileComplete) {
      return NextResponse.json(
        { error: 'Complete your profile first' },
        { status: 400 }
      );
    }

    // We no longer block lookups here. Limits are only enforced when SAVING a new rank in the profile API.
    // This provides "Unlimited preference checks for 1 rank".

    const searchParams = request.nextUrl.searchParams;
    const collegeType = searchParams.get('type') as CollegeType | null;
    const state = searchParams.get('state');
    const tab = searchParams.get('tab') || undefined;

    const { primary, others } = await getEligibleColleges({
      studentRank: student.rank,
      courseName: student.preferredBranch,
      category: student.category,
      year: CURRENT_YEAR - 1,
      counsellingType: student.counsellingType,
      tab,
      locations: [student.locationPreference1, student.locationPreference2, student.locationPreference3].filter(Boolean),
    });

    const isFirstLookup = searchParams.get('track') === 'true';

    // Only create leads for actual students, not admins
    if (isFirstLookup && user.role === 'student') {
      const firstName = user?.firstName || '';
      const lastName = user?.lastName || '';
      let studentName = `${firstName} ${lastName}`.trim();

      if (!studentName) {
        studentName = user?.email?.split('@')[0] || 'Student';
      }

      const studentPhone = user?.phone || '';
      const studentEmail = user?.email || '';
      
      let studentLocation = '';
      if (user?.city && user?.state) {
        studentLocation = `${user.city}, ${user.state}`;
      } else if (user?.state) {
        studentLocation = user.state;
      } else if (student.domicileState) {
        studentLocation = student.domicileState;
      }

      await createLead({
        studentId: uid,
        studentName,
        studentPhone,
        studentEmail,
        studentLocation,
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
