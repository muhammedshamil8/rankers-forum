import { NextRequest, NextResponse } from 'next/server';
import { adminAuth } from '@/lib/firebase/admin';
import { getUserById } from '@/lib/services/users';
import { getCutoffsByYear, getAvailableYears } from '@/lib/services/colleges';
import { cleanCommas } from '@/lib/utils';

/**
 * Helper to verify super admin session
 */
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

/**
 * GET /api/super-admin/colleges - Get colleges with cutoffs
 * Query params: year (required)
 */
export async function GET(request: NextRequest) {
  try {
    const superAdminUid = await verifySuperAdminSession(request);
    
    if (!superAdminUid) {
      return NextResponse.json({ error: 'Super admin access required' }, { status: 403 });
    }

    const searchParams = request.nextUrl.searchParams;
    const year = searchParams.get('year');

    // If no year specified, return available years
    if (!year) {
      const years = await getAvailableYears();
      return NextResponse.json({ years });
    }

    const cutoffs = await getCutoffsByYear(parseInt(year));

    // Sanitize data for display and ensure id is present
    const sanitizedCutoffs = (cutoffs || []).map((cutoff: any) => ({
      ...cutoff,
      id: cutoff.id || cutoff._id?.toString(),
      collegeName: cleanCommas(cutoff.collegeName),
      collegeLocation: cleanCommas(cutoff.collegeLocation),
      city: cleanCommas(cutoff.city),
      state: cleanCommas(cutoff.state),
    }));

    return NextResponse.json({
      year: parseInt(year),
      cutoffs: sanitizedCutoffs,
      totalCount: sanitizedCutoffs.length,
    });
  } catch (error) {
    console.error('Get colleges error:', error);
    return NextResponse.json({ error: 'Failed to get colleges' }, { status: 500 });
  }
}
