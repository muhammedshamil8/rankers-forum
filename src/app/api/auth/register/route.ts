import { NextRequest, NextResponse } from 'next/server';
import { adminAuth } from '@/lib/firebase/admin';
import { incrementStat, initializeStats } from '@/lib/services/stats';
import { createUser } from '@/lib/services/users';

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { email, password, firstName, lastName, phone, city, state } = body;

    // Validate required fields
    if (!email || !password || !firstName || !lastName || !phone) {
      return NextResponse.json(
        { error: 'Missing required fields' },
        { status: 400 }
      );
    }

    // Create Firebase Auth user
    const userRecord = await adminAuth.createUser({
      email,
      password,
      displayName: `${firstName} ${lastName}`,
    });

    // Create user document in MongoDB using updated service
    await createUser(userRecord.uid, {
      role: 'student',
      firstName,
      lastName,
      email,
      phone,
      city: city || '',
      state: state || '',
    });

    // Initialize stats if needed and increment registration count
    await initializeStats();
    await incrementStat('totalRegistrations');

    // Create custom token for client-side auth
    const customToken = await adminAuth.createCustomToken(userRecord.uid);

    return NextResponse.json({
      success: true,
      uid: userRecord.uid,
      customToken,
    });
  } catch (error) {
    console.error('Registration error:', error);
    
    const errorMessage = error instanceof Error ? error.message : 'Registration failed';
    const errorCode = (error as { code?: string }).code;
    
    if (errorCode === 'auth/email-already-exists') {
      return NextResponse.json(
        { error: 'Email already registered' },
        { status: 409 }
      );
    }
    
    return NextResponse.json(
      { error: errorMessage },
      { status: 500 }
    );
  }
}
