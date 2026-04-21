'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { Loader2, Edit } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { AdminLayout } from '@/components/layout/AdminLayout';
import { useAuth, useRequireAuth } from '@/lib/hooks';
import { useQuery } from '@tanstack/react-query';

interface AdminProfile {
  firstName: string;
  lastName: string;
  email: string;
  phone: string;
  city: string;
  state: string;
  dateOfBirth: string;
  gender: string;
  maritalStatus: string;
  bloodGroup: string;
  nationality: string;
  employeeNumber: string;
  dateOfJoining: string;
  jobTitle: string;
  jobType: string;
  noticePeriod: string;
}

export default function ProfilePage() {
  const router = useRouter();
  const { user, loading: authLoading } = useAuth();
  const { isAuthorized } = useRequireAuth(['super_admin', 'admin']);

  const { data: profileData, isLoading } = useQuery({
    queryKey: ['admin-profile'],
    queryFn: async () => {
      const response = await fetch('/api/profile');
      if (!response.ok) throw new Error('Failed to fetch profile');
      return response.json();
    },
    enabled: !!isAuthorized,
  });

  useEffect(() => {
    if (!authLoading && !isAuthorized) {
      router.push('/');
    }
  }, [authLoading, isAuthorized, router]);

  const profile: AdminProfile = {
    ...profileData?.user,
    ...profileData?.adminProfile,
    dateOfBirth: profileData?.adminProfile?.dateOfBirth?._seconds
      ? new Date(profileData.adminProfile.dateOfBirth._seconds * 1000).toLocaleDateString('en-IN')
      : profileData?.adminProfile?.dateOfBirth || '-',
    dateOfJoining: profileData?.adminProfile?.dateOfJoining?._seconds
      ? new Date(profileData.adminProfile.dateOfJoining._seconds * 1000).toLocaleDateString('en-IN')
      : profileData?.adminProfile?.dateOfJoining || '-',
  };

  return (
    <AdminLayout title="My Profile">
      {(authLoading || !isAuthorized || isLoading) ? (
        <div className="min-h-[400px] flex items-center justify-center">
          <Loader2 className="h-8 w-8 animate-spin text-indigo-600" />
        </div>
      ) : (
        <>
          <div className="bg-white flex items-center justify-center rounded-xl border border-slate-100 p-8 mb-2">
            <div className="flex items-center gap-6">
              <div className="w-24 h-24 rounded-full bg-gradient-to-br from-slate-200 to-slate-300 flex items-center justify-center text-3xl font-bold text-slate-600">
                {user?.firstName?.[0]}{user?.lastName?.[0]}
              </div>
              <div>
                <h2 className="text-2xl font-bold text-slate-900">
                  {user?.firstName} {user?.lastName}
                </h2>
                <p className="text-slate-500">
                  {user?.role === 'super_admin' ? 'Super Admin' : 'Admin'}
                </p>
                <p className="text-slate-500">{profile.city || '-'}, {profile.state || '-'}</p>
              </div>
            </div>
          </div>

          <div className="bg-white rounded-xl border border-slate-100 p-8 mb-2">
            <div className="flex items-center justify-between mb-2">
              <h3 className="text-base font-medium text-indigo-700">Personal Details</h3>
              <Button variant="ghost" size="sm" disabled>
                <Edit className="h-4 w-4 mr-2" />
                Edit
              </Button>
            </div>

            <div className="grid md:grid-cols-3 gap-6">
              <div>
                <p className="text-sm text-slate-500">First Name</p>
                <p className="font-medium text-sm text-slate-900">{user?.firstName || '-'}</p>
              </div>
              <div>
                <p className="text-sm text-slate-500">Last Name</p>
                <p className="font-medium text-sm text-slate-900">{user?.lastName || '-'}</p>
              </div>
              <div>
                <p className="text-sm text-slate-500">Gender</p>
                <p className="font-medium text-sm text-slate-900 capitalize">{profile.gender || '-'}</p>
              </div>
              <div>
                <p className="text-sm text-slate-500">Date of Birth</p>
                <p className="font-medium text-sm text-slate-900">{profile.dateOfBirth || '-'}</p>
              </div>
              <div>
                <p className="text-sm text-slate-500">Location</p>
                <p className="font-medium text-sm text-slate-900">
                  {profile.city && profile.state ? `${profile.city}, ${profile.state}` : '-'}
                </p>
              </div>
              <div>
                <p className="text-sm text-slate-500">Mobile Number</p>
                <p className="font-medium text-sm text-slate-900">{profile.phone ? `+91 ${profile.phone}` : '-'}</p>
              </div>
              <div>
                <p className="text-sm text-slate-500">Personal Email</p>
                <p className="font-medium text-sm text-slate-900">{user?.email || '-'}</p>
              </div>
              <div>
                <p className="text-sm text-slate-500">Marital Status</p>
                <p className="font-medium text-sm text-slate-900 capitalize">{profile.maritalStatus || '-'}</p>
              </div>
              <div>
                <p className="text-sm text-slate-500">Blood Group</p>
                <p className="font-medium text-sm text-slate-900">{profile.bloodGroup || '-'}</p>
              </div>
              <div>
                <p className="text-sm text-slate-500">Nationality</p>
                <p className="font-medium text-sm text-slate-900">{profile.nationality || 'India'}</p>
              </div>
            </div>
          </div>

          <div className="bg-white rounded-xl border border-slate-100 p-8">
            <h3 className=" font-medium text-indigo-700 mb-2">Job Details</h3>

            <div className="grid md:grid-cols-3 gap-6">
              <div>
                <p className="text-sm text-slate-500">Employee Number</p>
                <p className="font-medium text-sm text-slate-900">{profile.employeeNumber || '-'}</p>
              </div>
              <div>
                <p className="text-sm text-slate-500">Date of Joining</p>
                <p className="font-medium text-sm text-slate-900">{profile.dateOfJoining || '-'}</p>
              </div>
              <div>
                <p className="text-sm text-slate-500">Job Title</p>
                <p className="font-medium   text-sm text-slate-900">
                  {profile.jobTitle || (user?.role === 'super_admin' ? 'Super Admin' : 'Admin')}
                </p>
              </div>
              <div>
                <p className="text-sm text-slate-500">Work Email</p>
                <p className="font-medium text-sm text-slate-900">{user?.email || '-'}</p>
              </div>
              <div>
                <p className="text-sm text-slate-500">Job Type</p>
                <p className="font-medium text-sm text-slate-900 capitalize">
                  {profile.jobType?.replace('_', ' ') || 'Full Time'}
                </p>
              </div>
              <div>
                <p className="text-sm text-slate-500">Notice Period</p>
                <p className="font-medium text-sm text-slate-900">{profile.noticePeriod || '1 Month'}</p>
              </div>
            </div>
          </div>
        </>
      )}
    </AdminLayout>
  );
}
