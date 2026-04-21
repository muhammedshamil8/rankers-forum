import { NextRequest, NextResponse } from 'next/server';
import dbConnect from '@/lib/mongodb';
import { ReferralCodeModel } from '@/models/ReferralCode';


export async function GET(request: NextRequest) {
  try {
    await dbConnect();
    const codes = await ReferralCodeModel.find({ isActive: true }).sort({ code: 1 });
    
    return NextResponse.json({
      codes: codes.map(c => ({ code: c.code, description: c.description })),
      totalCount: codes.length,
    });
  } catch (error) {
    console.error('Get referral codes error:', error);
    return NextResponse.json({ error: 'Failed to get referral codes' }, { status: 500 });
  }
}
