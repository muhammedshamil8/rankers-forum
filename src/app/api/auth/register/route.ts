import { NextRequest, NextResponse } from 'next/server';
import { adminAuth } from '@/lib/firebase/admin';
import { incrementStat, initializeStats } from '@/lib/services/stats';
import { createUser } from '@/lib/services/users';
import { isValidPhoneNumber, normalizePhoneNumber } from '@/lib/phone';
import { z } from 'zod';

const registerSchema = z.object({
  email: z.string().trim().email('Invalid email address'),
  password: z.string().min(6, 'Password must be at least 6 characters'),
  firstName: z.string().trim().min(1, 'First name is required'),
  lastName: z.string().trim().min(1, 'Last name is required'),
  phone: z.string().trim().min(1, 'Phone number is required'),
  city: z.string().trim().optional().default(''),
  state: z.string().trim().optional().default(''),
});

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const parsed = registerSchema.safeParse(body);

    if (!parsed.success) {
      return NextResponse.json(
        { error: parsed.error.issues[0]?.message || 'Invalid registration details' },
        { status: 400 }
      );
    }

    const { email, password, firstName, lastName, phone, city, state } = parsed.data;
    const normalizedPhone = normalizePhoneNumber(phone);

    if (!isValidPhoneNumber(normalizedPhone)) {
      return NextResponse.json(
        { error: 'Please enter a valid phone number' },
        { status: 400 }
      );
    }

    const userRecord = await adminAuth.createUser({
      email,
      password,
      displayName: `${firstName} ${lastName}`,
    });

    await createUser(userRecord.uid, {
      role: 'student',
      firstName,
      lastName,
      email,
      phone: normalizedPhone,
      city,
      state,
    });

    await initializeStats();
    await incrementStat('totalRegistrations');

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
