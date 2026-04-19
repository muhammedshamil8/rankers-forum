import { NextRequest, NextResponse } from 'next/server';
import { adminAuth } from '@/lib/firebase/admin';
import { createStudent, getStudentByUserId, updateStudent, getRemainingChecks } from '@/lib/services/students';
import { getUserById } from '@/lib/services/users';
import { CreateStudentInput } from '@/types';

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
 * GET /api/students/profile - Get current student profile
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
    const remainingChecks = await getRemainingChecks(uid);

    return NextResponse.json({
      user: {
        id: user.id,
        firstName: user.firstName,
        lastName: user.lastName,
        email: user.email,
        phone: user.phone,
        city: user.city,
        state: user.state,
      },
      student,
      remainingChecks,
    });
  } catch (error) {
    console.error('Get student profile error:', error);
    return NextResponse.json({ error: 'Failed to get profile' }, { status: 500 });
  }
}

/**
 * POST /api/students/profile - Create or update student profile
 */
export async function POST(request: NextRequest) {
  try {
    const uid = await verifySession(request);

    if (!uid) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const user = await getUserById(uid);

    if (!user || user.role !== 'student') {
      return NextResponse.json({ error: 'Not a student' }, { status: 403 });
    }

    const body = await request.json();
    const {
      marks,
      rank,
      yearOfPassing,
      category,
      gender,
      institution,
      domicileState,
      counsellingType,
      preferredBranch,
      locationPreference1,
      locationPreference2,
      locationPreference3,
      referralCode,
    } = body;

    // Validate required fields (Problem 7: domicileState now optional)
    if (!rank || !yearOfPassing || !category || !gender || !counsellingType || !preferredBranch) {
      const missing = [];
      if (!rank) missing.push('rank');
      if (!category) missing.push('category');
      if (!gender) missing.push('gender');
      
      return NextResponse.json({ 
        error: `Missing required fields: ${missing.join(', ')}` 
      }, { status: 400 });
    }

    const existingStudent = await getStudentByUserId(uid);

    if (existingStudent) {
      // Students can only update certain fields, and only once (per UI warning)
      // For now, allow updates but in production might want to restrict this
      await updateStudent(uid, {
        marks: marks ? parseInt(marks) : 0,
        rank,
        yearOfPassing,
        category,
        gender,
        institution: institution || '',
        domicileState: domicileState || '',
        counsellingType,
        preferredBranch,
        locationPreference1: locationPreference1 || '',
        locationPreference2: locationPreference2 || '',
        locationPreference3: locationPreference3 || '',
        referralCode: referralCode || '',
      });

      return NextResponse.json({ success: true, message: 'Profile updated' });
    }

    const studentInput: CreateStudentInput = {
      marks: marks ? parseInt(marks) : 0,
      rank,
      yearOfPassing,
      category,
      gender,
      institution: institution || '',
      domicileState: domicileState || '',
      counsellingType,
      preferredBranch,
      locationPreference1: locationPreference1 || '',
      locationPreference2: locationPreference2 || '',
      locationPreference3: locationPreference3 || '',
      referralCode: referralCode || '',
    };

    const student = await createStudent(uid, studentInput);

    return NextResponse.json({
      success: true,
      student,
      message: 'Profile created'
    });
  } catch (error) {
    console.error('Create student profile error:', error);
    return NextResponse.json({ error: 'Failed to save profile' }, { status: 500 });
  }
}
