import { NextRequest, NextResponse } from 'next/server';
import dbConnect from '@/lib/mongodb';
import { ReferralCodeModel } from '@/models/ReferralCode';

/**
 * GET /api/referral-codes - Get active referral codes
 * Public endpoint
 */
export async function GET(request: NextRequest) {
  try {
    await dbConnect();
    const codes = await ReferralCodeModel.find({ isActive: true }).sort({ code: 1 });

    // Seed some codes if none exist yet (for demo/development)
    if (codes.length === 0) {
      const demoCodes = [
        { code: 'REF100', description: 'Special Reference 100' },
        { code: 'WELCOME50', description: 'Welcome Discount' },
        { code: 'STUDY2024', description: 'Academic Year 2024' },
      ];
      return NextResponse.json({
        codes: demoCodes,
        totalCount: demoCodes.length,
      });
    }

    return NextResponse.json({
      codes: codes.map(c => ({ code: c.code, description: c.description })),
      totalCount: codes.length,
    });
  } catch (error) {
    console.error('Get referral codes error:', error);
    return NextResponse.json({ error: 'Failed to get referral codes' }, { status: 500 });
  }
}
