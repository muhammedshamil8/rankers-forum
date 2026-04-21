import { NextRequest, NextResponse } from 'next/server';
import { adminAuth } from '@/lib/firebase/admin';
import { getUserById } from '@/lib/services/users';
import { getDashboardStats } from '@/lib/services/stats';
import { getAdminPendingCallbacks } from '@/lib/services/leads';


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


export async function GET(request: NextRequest) {
  try {
    const session = await verifyAdminSession(request);
    
    if (!session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const stats = await getDashboardStats();

    const pendingCallbacks = await getAdminPendingCallbacks(session.uid);

    return NextResponse.json({
      stats: session.role === 'super_admin' ? stats : null,
      pendingCallbacks,
      pendingCount: pendingCallbacks.length,
    });
  } catch (error) {
    console.error('Get dashboard error:', error);
    return NextResponse.json({ error: 'Failed to get dashboard data' }, { status: 500 });
  }
}
