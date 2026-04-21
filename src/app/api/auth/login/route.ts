import { NextRequest, NextResponse } from 'next/server';
import { adminAuth } from '@/lib/firebase/admin';
import { getUserById, createUser } from '@/lib/services/users';
import { getStudentByUserId } from '@/lib/services/students';
import { initializeStats, incrementStat } from '@/lib/services/stats';

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { idToken } = body;

    if (!idToken) {
      return NextResponse.json(
        { error: 'ID token required' },
        { status: 400 }
      );
    }

    const decodedToken = await adminAuth.verifyIdToken(idToken);
    const uid = decodedToken.uid;

    let user = await getUserById(uid);

    if (!user) {
      const firebaseUser = await adminAuth.getUser(uid);
      
      const displayName = firebaseUser.displayName || '';
      const nameParts = displayName.split(' ');
      const firstName = nameParts[0] || 'User';
      const lastName = nameParts.slice(1).join(' ') || '';

      await createUser(uid, {
        role: 'student',
        firstName,
        lastName,
        email: firebaseUser.email || '',
        phone: firebaseUser.phoneNumber || '',
        city: '',
        state: '',
      });

      try {
        await initializeStats();
        await incrementStat('totalRegistrations');
      } catch (statError) {
        console.error('Failed to update stats:', statError);
      }

      user = await getUserById(uid);
    }

    if (!user) {
      return NextResponse.json(
        { error: 'Failed to create user' },
        { status: 500 }
      );
    }

    if (!user.isActive) {
      return NextResponse.json(
        { error: 'Account is deactivated' },
        { status: 403 }
      );
    }

    const expiresIn = 60 * 60 * 24 * 5 * 1000; // 5 days
    const sessionCookie = await adminAuth.createSessionCookie(idToken, { expiresIn });

    let hasStudentProfile = false;
    if (user.role === 'student') {
      const studentProfile = await getStudentByUserId(uid);
      hasStudentProfile = !!studentProfile;
    }

    const response = NextResponse.json({
      success: true,
      user: {
        id: user.id,
        role: user.role,
        firstName: user.firstName,
        lastName: user.lastName,
        email: user.email,
        isActive: user.isActive,
        hasStudentProfile,
      },
    });

    response.cookies.set('session', sessionCookie, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
      maxAge: expiresIn / 1000,
      path: '/',
    });

    return response;
  } catch (error) {
    console.error('Login error:', error);
    
    return NextResponse.json(
      { error: 'Authentication failed' },
      { status: 401 }
    );
  }
}
