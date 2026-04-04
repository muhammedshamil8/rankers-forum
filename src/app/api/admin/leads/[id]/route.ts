import { NextRequest, NextResponse } from 'next/server';
import { adminAuth } from '@/lib/firebase/admin';
import { getUserById } from '@/lib/services/users';
import { getLeadById, assignLead, updateLeadStatus } from '@/lib/services/leads';
import { getStudentByUserId } from '@/lib/services/students';
import { LeadStatus } from '@/types';

/**
 * Helper to verify session and require super_admin role
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
 * GET /api/admin/leads/[id] - Get lead details with student info
 */
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const sessionCookie = request.cookies.get('session')?.value;
    
    if (!sessionCookie) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const decoded = await adminAuth.verifySessionCookie(sessionCookie, true);
    const user = await getUserById(decoded.uid);
    
    if (!user || !['admin', 'super_admin'].includes(user.role)) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { id } = await params;
    const lead = await getLeadById(id);
    
    if (!lead) {
      return NextResponse.json({ error: 'Lead not found' }, { status: 404 });
    }

    // Check if admin has access to this lead
    if (user.role === 'admin' && lead.assignedAdminId !== decoded.uid) {
      return NextResponse.json({ error: 'Access denied' }, { status: 403 });
    }

    // Get student details
    const student = await getStudentByUserId(lead.studentId);
    const studentUser = await getUserById(lead.studentId);

    return NextResponse.json({
      lead,
      student: student ? {
        ...student,
        user: studentUser ? {
          firstName: studentUser.firstName,
          lastName: studentUser.lastName,
          email: studentUser.email,
          phone: studentUser.phone,
          city: studentUser.city,
          state: studentUser.state,
        } : null,
      } : null,
    });
  } catch (error) {
    console.error('Get lead error:', error);
    return NextResponse.json({ error: 'Failed to get lead' }, { status: 500 });
  }
}
/**
 * PATCH /api/admin/leads/[id] - Update lead (assign or change status)
 * Supports both action-based and direct field updates
 */
export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const body = await request.json();
    const { action, adminId, status, assignToAdminId, assignedTo } = body;

    // Handle assignment - supports multiple field names for flexibility
    const assignmentAdminId = assignToAdminId || assignedTo || adminId;
    
    if (action === 'assign' || (assignmentAdminId && !action)) {
      // Only super admin can assign
      const superAdminUid = await verifySuperAdminSession(request);
      
      if (!superAdminUid) {
        return NextResponse.json({ error: 'Super admin access required' }, { status: 403 });
      }

      if (!assignmentAdminId) {
        return NextResponse.json({ error: 'Admin ID required' }, { status: 400 });
      }

      await assignLead(id, assignmentAdminId);
      
      return NextResponse.json({ success: true, message: 'Lead assigned' });
    }

    // Handle status update
    if (action === 'status' || (status && !action)) {
      // Both admin and super admin can update status
      const sessionCookie = request.cookies.get('session')?.value;
      
      if (!sessionCookie) {
        return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
      }

      const decoded = await adminAuth.verifySessionCookie(sessionCookie, true);
      const user = await getUserById(decoded.uid);
      
      if (!user || !['admin', 'super_admin'].includes(user.role)) {
        return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
      }

      if (!status) {
        return NextResponse.json({ error: 'Status required' }, { status: 400 });
      }

      await updateLeadStatus(id, status as LeadStatus);
      
      return NextResponse.json({ success: true, message: 'Status updated' });
    }

    return NextResponse.json({ error: 'Invalid action or missing fields' }, { status: 400 });
  } catch (error: any) {
    console.error('Update lead 500 error:', {
      message: error.message,
      stack: error.stack,
      id: params ? (await params).id : 'missing id'
    });
    return NextResponse.json({ 
      error: 'Failed to update lead', 
      details: error.message 
    }, { status: 500 });
  }
}
