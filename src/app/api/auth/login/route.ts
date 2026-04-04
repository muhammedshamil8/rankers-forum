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

    // Verify the ID token
    const decodedToken = await adminAuth.verifyIdToken(idToken);
    const uid = decodedToken.uid;

    // Get user data from Firestore
    let user = await getUserById(uid);

    // If user doesn't exist (first-time Google OAuth), create one
    if (!user) {
      const firebaseUser = await adminAuth.getUser(uid);
      
      // Parse display name into first and last name
      const displayName = firebaseUser.displayName || '';
      const nameParts = displayName.split(' ');
      const firstName = nameParts[0] || 'User';
      const lastName = nameParts.slice(1).join(' ') || '';

      // Create user document using MongoDB service
      await createUser(uid, {
        role: 'student',
        firstName,
        lastName,
        email: firebaseUser.email || '',
        phone: firebaseUser.phoneNumber || '',
        city: '',
        state: '',
      });

      // Increment registration stats
      try {
        await initializeStats();
        await incrementStat('totalRegistrations');
      } catch (statError) {
        console.error('Failed to update stats:', statError);
      }

      // Get the newly created user
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

    // Create session cookie
    const expiresIn = 60 * 60 * 24 * 5 * 1000; // 5 days
    const sessionCookie = await adminAuth.createSessionCookie(idToken, { expiresIn });

    // Check if student has profile (for role-based redirect)
    let hasStudentProfile = false;
    if (user.role === 'student') {
      const studentProfile = await getStudentByUserId(uid);
      hasStudentProfile = !!studentProfile;
    }

    // Create response with session cookie
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
