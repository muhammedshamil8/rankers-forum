import { NextRequest, NextResponse } from 'next/server';
import { adminAuth } from '@/lib/firebase/admin';
import { getUserById } from '@/lib/services/users';
import { createFollowup, getFollowupsByLeadId, completeFollowup } from '@/lib/services/leads';


async function verifyAdminSession(request: NextRequest): Promise<string | null> {
  const sessionCookie = request.cookies.get('session')?.value;
  
  if (!sessionCookie) {
    return null;
  }

  try {
    const decoded = await adminAuth.verifySessionCookie(sessionCookie, true);
    const user = await getUserById(decoded.uid);
    
    if (!user || !['admin', 'super_admin'].includes(user.role)) {
      return null;
    }
    
    return decoded.uid;
  } catch {
    return null;
  }
}


export async function GET(request: NextRequest) {
  try {
    const adminUid = await verifyAdminSession(request);
    
    if (!adminUid) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const searchParams = request.nextUrl.searchParams;
    const leadId = searchParams.get('leadId');

    if (!leadId) {
      return NextResponse.json({ error: 'Lead ID required' }, { status: 400 });
    }

    const followups = await getFollowupsByLeadId(leadId);

    return NextResponse.json({ followups });
  } catch (error) {
    console.error('Get followups error:', error);
    return NextResponse.json({ error: 'Failed to get followups' }, { status: 500 });
  }
}


export async function POST(request: NextRequest) {
  try {
    const adminUid = await verifyAdminSession(request);
    
    if (!adminUid) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await request.json();
    const { leadId, remark, nextCallbackDate } = body;

    if (!leadId || !remark) {
      return NextResponse.json({ error: 'Lead ID and remark required' }, { status: 400 });
    }

    const followup = await createFollowup(adminUid, {
      leadId,
      remark,
      nextCallbackDate: nextCallbackDate ? new Date(nextCallbackDate) : undefined,
    });

    return NextResponse.json({ success: true, followup });
  } catch (error) {
    console.error('Create followup error:', error);
    return NextResponse.json({ error: 'Failed to create followup' }, { status: 500 });
  }
}


export async function PATCH(request: NextRequest) {
  try {
    const adminUid = await verifyAdminSession(request);
    
    if (!adminUid) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await request.json();
    const { followupId } = body;

    if (!followupId) {
      return NextResponse.json({ error: 'Followup ID required' }, { status: 400 });
    }

    await completeFollowup(followupId);

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Complete followup error:', error);
    return NextResponse.json({ error: 'Failed to complete followup' }, { status: 500 });
  }
}
