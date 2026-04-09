import { NextRequest, NextResponse } from 'next/server';
import { adminAuth } from '@/lib/firebase/admin';
import { getUserById } from '@/lib/services/users';
import { getLeads, populateStudentInfo } from '@/lib/services/leads';
import { LeadStatus } from '@/types';

/**
 * Helper to verify session and require admin/super_admin role
 */
async function verifyAdminSession(request: NextRequest): Promise<{ uid: string; role: string } | null> {
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

    return { uid: decoded.uid, role: user.role };
  } catch {
    return null;
  }
}

/**
 * GET /api/admin/leads - Get leads (filtered by role)
 * Super admin sees all, admin sees only assigned
 */
export async function GET(request: NextRequest) {
  try {
    const session = await verifyAdminSession(request);

    if (!session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const searchParams = request.nextUrl.searchParams;
    const status = searchParams.get('status') as LeadStatus | null;
    const adminId = searchParams.get('adminId');
    const limit = parseInt(searchParams.get('limit') || '20');
    const startAfter = searchParams.get('startAfter') || undefined;

    // Admin only sees their assigned leads
    // Super admin sees all, with optional adminId filter
    const options: {
      status?: LeadStatus;
      assignedAdminId?: string;
      limit: number;
      startAfter?: string;
    } = {
      limit,
      startAfter,
    };

    if (status) {
      options.status = status;
    }

    if (session.role === 'admin') {
      options.assignedAdminId = session.uid;
    } else if (session.role === 'super_admin' && adminId) {
      options.assignedAdminId = adminId;
    }

    const rawLeads = await getLeads(options);
    const leads = await populateStudentInfo(rawLeads);

    return NextResponse.json({ leads });
  } catch (error) {
    console.error('Get leads error:', error);
    return NextResponse.json({ error: 'Failed to get leads' }, { status: 500 });
  }
}
