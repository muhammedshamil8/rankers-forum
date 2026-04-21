import { NextRequest, NextResponse } from 'next/server';
import { adminAuth } from '@/lib/firebase/admin';
import { getUserById } from '@/lib/services/users';
import { getStudentByUserId } from '@/lib/services/students';
import { getLeads } from '@/lib/services/leads';
import { incrementStat } from '@/lib/services/stats';
import { LeadModel } from '@/models/Lead';


async function verifyStudentSession(request: NextRequest): Promise<{ uid: string; user: ReturnType<typeof getUserById> extends Promise<infer T> ? T : never } | null> {
  const sessionCookie = request.cookies.get('session')?.value;
  
  if (!sessionCookie) {
    return null;
  }

  try {
    const decoded = await adminAuth.verifySessionCookie(sessionCookie, true);
    const user = await getUserById(decoded.uid);
    
    if (!user || user.role !== 'student') {
      return null;
    }
    
    return { uid: decoded.uid, user };
  } catch {
    return null;
  }
}


export async function GET(request: NextRequest) {
  try {
    const session = await verifyStudentSession(request);
    
    if (!session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const leads = await getLeads();

    const studentLeads = leads.filter(lead => lead.studentId === session.uid);
    const hasCallback = studentLeads.some(lead => lead.callbackRequested);
    const pendingCallback = studentLeads.find(lead => 
      lead.callbackRequested && 
      !['completed', 'closed'].includes(lead.status)
    );

    return NextResponse.json({
      hasCallback,
      pendingCallback: pendingCallback ? {
        id: pendingCallback.id,
        status: pendingCallback.status,
        createdAt: pendingCallback.createdAt,
      } : null,
    });
  } catch (error) {
    console.error('Get callback status error:', error);
    return NextResponse.json({ error: 'Failed to get callback status' }, { status: 500 });
  }
}


export async function POST(request: NextRequest) {
  try {
    const session = await verifyStudentSession(request);
    
    if (!session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { uid, user } = session;

    const student = await getStudentByUserId(uid);
    
    if (!student) {
      return NextResponse.json({ 
        error: 'Student profile not found', 
        requiresProfile: true 
      }, { status: 400 });
    }

    const existingLead = await LeadModel.findOne({
      studentId: uid,
      callbackRequested: true,
      status: { $in: ['new', 'assigned', 'in_progress'] },
    }).sort({ createdAt: -1 });

    if (existingLead) {
      return NextResponse.json({ 
        error: 'You already have a pending callback request',
        existingCallback: true,
      }, { status: 409 });
    }

    const firstName = user?.firstName || '';
    const lastName = user?.lastName || '';
    let studentName = `${firstName} ${lastName}`.trim();

    if (!studentName) {
      studentName = user?.email?.split('@')[0] || 'Student';
    }

    const studentPhone = user?.phone || '';
    const studentEmail = user?.email || '';
    
    let studentLocation = '';
    if (user?.city && user?.state) {
      studentLocation = `${user.city}, ${user.state}`;
    } else if (user?.state) {
      studentLocation = user.state;
    } else if (student.domicileState) {
      studentLocation = student.domicileState;
    }

    let leadId: string | null = null;

    const updatedLead = await LeadModel.findOneAndUpdate(
      {
        studentId: uid,
        callbackRequested: false,
        status: { $in: ['new', 'assigned', 'in_progress'] },
      },
      {
        $set: {
          callbackRequested: true,
          studentName,
          studentPhone,
          studentEmail,
          studentLocation,
          rankUsed: student.rank || 0,
          preferredBranch: student.preferredBranch || '',
          year: student.yearOfPassing || new Date().getFullYear(),
        },
      },
      { sort: { createdAt: -1 }, new: true }
    );

    if (updatedLead) {
      leadId = updatedLead._id.toString();
    } else {
      const pendingLead = await LeadModel.findOneAndUpdate(
        {
          studentId: uid,
          callbackRequested: true,
          status: 'new',
          assignedAdminId: null,
        },
        {
          $setOnInsert: {
            studentId: uid,
            studentName,
            studentPhone,
            studentEmail,
            studentLocation,
            rankUsed: student.rank || 0,
            preferredBranch: student.preferredBranch || '',
            year: student.yearOfPassing || new Date().getFullYear(),
            status: 'new',
            callbackRequested: true,
            assignedAdminId: null,
            assignedAt: null,
          },
        },
        { upsert: true, new: true }
      );

      leadId = pendingLead._id.toString();
    }

    await incrementStat('pendingCallbacks');

    return NextResponse.json({ 
      success: true, 
      message: 'Callback request submitted successfully',
      leadId,
    });
  } catch (error) {
    console.error('Create callback error:', error);
    return NextResponse.json({ error: 'Failed to create callback request' }, { status: 500 });
  }
}
