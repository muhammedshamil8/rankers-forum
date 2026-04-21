import { NextRequest, NextResponse } from 'next/server';
import { adminAuth } from '@/lib/firebase/admin';
import { getUserById, updateUser } from '@/lib/services/users';
import { getAdminByUserId, updateAdminProfile } from '@/lib/services/admins';


async function verifySession(request: NextRequest): Promise<string | null> {
  const sessionCookie = request.cookies.get('session')?.value;

  if (!sessionCookie) {
    return null;
  }

  try {
    const decoded = await adminAuth.verifySessionCookie(sessionCookie, true);
    return decoded.uid;
  } catch {
    return null;
  }
}


export async function GET(request: NextRequest) {
  try {
    const uid = await verifySession(request);

    if (!uid) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const user = await getUserById(uid);

    if (!user) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 });
    }

    let adminProfile = null;
    if (user.role === 'admin' || user.role === 'super_admin') {
      adminProfile = await getAdminByUserId(uid);
    }

    return NextResponse.json({
      user: {
        id: user.id,
        role: user.role,
        firstName: user.firstName,
        lastName: user.lastName,
        email: user.email,
        phone: user.phone,
        city: user.city,
        state: user.state,
        avatarUrl: user.avatarUrl,
        isActive: user.isActive,
        createdAt: user.createdAt,
      },
      adminProfile: adminProfile ? {
        employeeNumber: adminProfile.employeeNumber,
        dateOfJoining: adminProfile.dateOfJoining,
        jobTitle: adminProfile.jobTitle,
        jobType: adminProfile.jobType,
        noticePeriod: adminProfile.noticePeriod,
        dateOfBirth: adminProfile.dateOfBirth,
        gender: adminProfile.gender,
        maritalStatus: adminProfile.maritalStatus,
        bloodGroup: adminProfile.bloodGroup,
        nationality: adminProfile.nationality,
        maxActiveLeads: adminProfile.maxActiveLeads,
        currentActiveLeads: adminProfile.currentActiveLeads,
      } : null,
    });
  } catch (error) {
    console.error('Get profile error:', error);
    return NextResponse.json({ error: 'Failed to get profile' }, { status: 500 });
  }
}


export async function PATCH(request: NextRequest) {
  try {
    const uid = await verifySession(request);

    if (!uid) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const user = await getUserById(uid);

    if (!user) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 });
    }

    const body = await request.json();

    const userUpdates: Record<string, unknown> = {};
    if (body.firstName) userUpdates.firstName = body.firstName;
    if (body.lastName) userUpdates.lastName = body.lastName;
    if (body.phone) userUpdates.phone = body.phone;
    if (body.city) userUpdates.city = body.city;
    if (body.state) userUpdates.state = body.state;

    if (Object.keys(userUpdates).length > 0) {
      await updateUser(uid, userUpdates);
    }

    if ((user.role === 'admin' || user.role === 'super_admin') && body.adminProfile) {
      const adminUpdates: Record<string, unknown> = {};
      if (body.adminProfile.maritalStatus) adminUpdates.maritalStatus = body.adminProfile.maritalStatus;
      if (body.adminProfile.gender) adminUpdates.gender = body.adminProfile.gender;
      if (body.adminProfile.bloodGroup) adminUpdates.bloodGroup = body.adminProfile.bloodGroup;
      if (body.adminProfile.nationality) adminUpdates.nationality = body.adminProfile.nationality;
      if (body.adminProfile.dateOfBirth) adminUpdates.dateOfBirth = new Date(body.adminProfile.dateOfBirth);

      if (Object.keys(adminUpdates).length > 0) {
        await updateAdminProfile(uid, adminUpdates);
      }
    }

    return NextResponse.json({ success: true, message: 'Profile updated' });
  } catch (error) {
    console.error('Update profile error:', error);
    return NextResponse.json({ error: 'Failed to update profile' }, { status: 500 });
  }
}
