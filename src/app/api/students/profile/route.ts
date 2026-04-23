import { NextRequest, NextResponse } from 'next/server';
import { adminAuth } from '@/lib/firebase/admin';
import { createStudent, getStudentByUserId, updateStudent, getRemainingChecks, canPerformLookup, incrementChecksUsed } from '@/lib/services/students';
import { getUserById } from '@/lib/services/users';
import { CreateStudentInput } from '@/types';


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
      return NextResponse.json({ error: 'Unauthorized Role' }, { status: 403 });
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


export async function POST(request: NextRequest) {
  try {
    const uid = await verifySession(request);

    if (!uid) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const user = await getUserById(uid);

    if (!user || !['student', 'admin', 'super_admin'].includes(user.role)) {
      return NextResponse.json({ error: 'Unauthorized role' }, { status: 403 });
    }

    const body = await request.json();
    const {
      score,
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

    const rankNum = rank ? parseInt(rank.toString()) : 0;

    if (!rankNum || !yearOfPassing || !category || !gender || !counsellingType || !preferredBranch) {
      const missing = [];
      if (!rankNum) missing.push('rank');
      if (!category) missing.push('category');
      if (!gender) missing.push('gender');
      
      return NextResponse.json({ 
        error: `Missing required fields: ${missing.join(', ')}` 
      }, { status: 400 });
    }

    const existingStudent = await getStudentByUserId(uid);

    // Usage tracking logic
    if (user.role === 'student') {
      const isNewStudent = !existingStudent;
      const rankChanged = existingStudent && existingStudent.rank !== rankNum;

      /* 
      if (isNewStudent || rankChanged) {
        const canLookup = await canPerformLookup(uid);
        if (!canLookup) {
          return NextResponse.json(
            { error: 'Maximum rank checks reached (10/10). Please contact support to increase your limit.' },
            { status: 403 }
          );
        }
        await incrementChecksUsed(uid);
      }
      */
    }

    const studentData = {
      score: score ? parseInt(score.toString()) : 0,
      rank: rankNum,
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

    if (existingStudent) {
      await updateStudent(uid, studentData);
      return NextResponse.json({ success: true, message: 'Profile updated' });
    }

    const student = await createStudent(uid, studentData);

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
