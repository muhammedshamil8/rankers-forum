import { NextRequest, NextResponse } from 'next/server';
import { getUserByPhone, getUserByEmail } from '@/lib/services/users';
import { getPhoneLookupVariants } from '@/lib/phone';

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

    let user = null;

    const phoneCandidates = getPhoneLookupVariants(identifier);
    for (const candidate of phoneCandidates) {
      user = await getUserByPhone(candidate);
      if (user) {
        break;
      }
    }
    
    if (!user && identifier.includes('@')) {
      user = await getUserByEmail(identifier.trim().toLowerCase());
    }

    if (!user) {
      return NextResponse.json(
        { error: 'User not found' },
        { status: 404 }
      );
    }

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
