import { NextRequest, NextResponse } from 'next/server';
import { getUserByPhone, getUserByEmail } from '@/lib/services/users';

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const identifier = searchParams.get('identifier');

    if (!identifier) {
      return NextResponse.json(
        { error: 'Identifier is required' },
        { status: 400 }
      );
    }

    // Attempt to find by phone
    let user = await getUserByPhone(identifier);
    
    // If not found by phone, try email (in case client is unsure)
    if (!user && identifier.includes('@')) {
      user = await getUserByEmail(identifier);
    }

    if (!user) {
      return NextResponse.json(
        { error: 'User not found' },
        { status: 404 }
      );
    }

    // Return the email associated with this identifier
    // This allows the client to sign in with Firebase using the email
    return NextResponse.json({
      email: user.email,
    });
  } catch (error) {
    console.error('Lookup error:', error);
    return NextResponse.json(
      { error: 'Lookup failed' },
      { status: 500 }
    );
  }
}
