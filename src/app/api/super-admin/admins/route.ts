import { NextRequest, NextResponse } from 'next/server';
import { adminAuth } from '@/lib/firebase/admin';
import { getUserById } from '@/lib/services/users';
import { getAllAdmins, getAvailableAdmins, createAdmin, deactivateAdmin, activateAdmin } from '@/lib/services/admins';


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

    const searchParams = request.nextUrl.searchParams;
    const available = searchParams.get('available');

    if (available === 'true') {
      const admins = await getAvailableAdmins();
      return NextResponse.json({ admins });
    }

    const admins = await getAllAdmins();
    return NextResponse.json({ admins });
  } catch (error) {
    console.error('Get admins error:', error);
    return NextResponse.json({ error: 'Failed to get admins' }, { status: 500 });
  }
}


export async function POST(request: NextRequest) {
  try {
    const superAdminUid = await verifySuperAdminSession(request);
    
    if (!superAdminUid) {
      return NextResponse.json({ error: 'Super admin access required' }, { status: 403 });
    }

    const body = await request.json();
    const { 
      firstName, 
      lastName, 
      email, 
      phone, 
      password,
      employeeNumber,
      jobTitle,
      jobType,
      maxActiveLeads,
    } = body;

    if (!firstName || !lastName || !email || !phone || !password || !employeeNumber) {
      return NextResponse.json({ error: 'Missing required fields' }, { status: 400 });
    }

    const admin = await createAdmin({
      firstName,
      lastName,
      email,
      phone,
      employeeNumber,
      jobTitle: jobTitle || 'Admin',
      jobType: jobType || 'full_time',
      maxActiveLeads: maxActiveLeads || 50,
    }, password);

    return NextResponse.json({ 
      success: true, 
      admin: {
        id: admin.id,
        email: admin.email,
        firstName: admin.firstName,
        lastName: admin.lastName,
      }
    });
  } catch (error) {
    console.error('Create admin error:', error);
    
    const errorCode = (error as { code?: string }).code;
    
    if (errorCode === 'auth/email-already-exists') {
      return NextResponse.json({ error: 'Email already registered' }, { status: 409 });
    }
    
    return NextResponse.json({ error: 'Failed to create admin' }, { status: 500 });
  }
}


export async function PATCH(request: NextRequest) {
  try {
    const superAdminUid = await verifySuperAdminSession(request);
    
    if (!superAdminUid) {
      return NextResponse.json({ error: 'Super admin access required' }, { status: 403 });
    }

    const body = await request.json();
    const { adminId, isActive, action } = body;

    if (!adminId) {
      return NextResponse.json({ error: 'Admin ID required' }, { status: 400 });
    }

    if (typeof isActive === 'boolean') {
      if (isActive) {
        await activateAdmin(adminId);
        return NextResponse.json({ success: true, message: 'Admin activated' });
      } else {
        await deactivateAdmin(adminId);
        return NextResponse.json({ success: true, message: 'Admin deactivated' });
      }
    }

    if (action === 'deactivate') {
      await deactivateAdmin(adminId);
      return NextResponse.json({ success: true, message: 'Admin deactivated' });
    }

    if (action === 'activate') {
      await activateAdmin(adminId);
      return NextResponse.json({ success: true, message: 'Admin activated' });
    }

    return NextResponse.json({ error: 'Invalid action' }, { status: 400 });
  } catch (error) {
    console.error('Update admin error:', error);
    return NextResponse.json({ error: 'Failed to update admin' }, { status: 500 });
  }
}

