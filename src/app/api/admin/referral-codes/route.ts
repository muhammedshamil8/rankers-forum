import { NextRequest, NextResponse } from 'next/server';
import { adminAuth } from '@/lib/firebase/admin';
import { getUserById } from '@/lib/services/users';
import dbConnect from '@/lib/mongodb';
import { ReferralCodeModel } from '@/models/ReferralCode';


async function verifySuperAdminSession(request: NextRequest): Promise<string | null> {
  const sessionCookie = request.cookies.get('session')?.value;
  
  if (!sessionCookie) {
    return null;
  }

  try {
    const decoded = await adminAuth.verifySessionCookie(sessionCookie, true);
    const user = await getUserById(decoded.uid);
    
    if (!user || user.role !== 'super_admin') {
      return null;
    }
    
    return decoded.uid;
  } catch {
    return null;
  }
}


export async function GET(request: NextRequest) {
  try {
    const superAdminUid = await verifySuperAdminSession(request);
    if (!superAdminUid) {
      return NextResponse.json({ error: 'Super admin access required' }, { status: 403 });
    }

    await dbConnect();
    const codes = await ReferralCodeModel.find().sort({ createdAt: -1 });

    return NextResponse.json({ 
      success: true,
      codes: codes.map(c => ({
        id: c._id.toString(),
        code: c.code,
        description: c.description,
        isActive: c.isActive,
        createdAt: c.createdAt,
      }))
    });
  } catch (error) {
    console.error('Fetch referral codes error:', error);
    return NextResponse.json({ error: 'Failed to fetch referral codes' }, { status: 500 });
  }
}


export async function POST(request: NextRequest) {
  try {
    const superAdminUid = await verifySuperAdminSession(request);
    if (!superAdminUid) {
      return NextResponse.json({ error: 'Super admin access required' }, { status: 403 });
    }

    const { code, description } = await request.json();

    if (!code) {
      return NextResponse.json({ error: 'Referral code is required' }, { status: 400 });
    }

    await dbConnect();

    const existing = await ReferralCodeModel.findOne({ code: code.toUpperCase() });
    if (existing) {
      return NextResponse.json({ error: 'Referral code already exists' }, { status: 400 });
    }

    const newCode = await ReferralCodeModel.create({
      code: code.toUpperCase(),
      description: description || '',
      isActive: true,
    });

    return NextResponse.json({ 
      success: true, 
      code: {
        id: newCode._id.toString(),
        code: newCode.code,
        description: newCode.description,
        isActive: newCode.isActive,
        createdAt: newCode.createdAt,
      }
    });
  } catch (error) {
    console.error('Create referral code error:', error);
    return NextResponse.json({ error: 'Failed to create referral code' }, { status: 500 });
  }
}


export async function PATCH(request: NextRequest) {
  try {
    const superAdminUid = await verifySuperAdminSession(request);
    if (!superAdminUid) {
      return NextResponse.json({ error: 'Super admin access required' }, { status: 403 });
    }

    const { id, isActive } = await request.json();

    if (!id) {
      return NextResponse.json({ error: 'ID is required' }, { status: 400 });
    }

    await dbConnect();
    const updated = await ReferralCodeModel.findByIdAndUpdate(
      id,
      { isActive },
      { new: true }
    );

    if (!updated) {
      return NextResponse.json({ error: 'Code not found' }, { status: 404 });
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Update referral code error:', error);
    return NextResponse.json({ error: 'Failed to update referral code' }, { status: 500 });
  }
}
