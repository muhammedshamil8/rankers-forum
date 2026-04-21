'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { Loader2, User, Briefcase, Save } from 'lucide-react';
import { AdminSidebar } from '@/components/layout';
import { Header, Footer } from '@/components/layout';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { useAuth, useRequireAuth } from '@/lib/hooks';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { JOB_TYPES, INDIAN_STATES } from '@/lib/constants';

interface ProfileData {
  user: {
    id: string;
    firstName: string;
    lastName: string;
    email: string;
    phone: string;
    city: string;
    state: string;
    role: string;
  };
  adminProfile?: {
    employeeNumber: string;
    jobTitle: string;
    jobType: string;
    dateOfBirth: { _seconds: number };
    maritalStatus: string;
    bloodGroup: string;
    nationality: string;
    noticePeriod: string;
    maxActiveLeads: number;
    currentActiveLeads: number;
  };
}

export default function ProfilePage() {
  const router = useRouter();
  const queryClient = useQueryClient();
  const { user: authUser, loading: authLoading } = useAuth();
  const { isAuthorized } = useRequireAuth(['student', 'admin', 'super_admin']);
  
  const [personalData, setPersonalData] = useState({
    firstName: '',
    lastName: '',
    phone: '',
    city: '',
    state: '',
  });

  const [jobData, setJobData] = useState({
    jobTitle: '',
    jobType: 'full_time',
    noticePeriod: '',
    maritalStatus: '',
    bloodGroup: '',
    nationality: 'India',
  });

  const isAdminOrSuperAdmin = authUser?.role === 'admin' || authUser?.role === 'super_admin';

  const { data, isLoading } = useQuery({
    queryKey: ['profile'],
    queryFn: async () => {
      const response = await fetch('/api/profile');
      if (!response.ok) throw new Error('Failed to fetch profile');
      return response.json() as Promise<ProfileData>;
    },
    enabled: !!isAuthorized,
  });

  useEffect(() => {
    if (data?.user) {
      setPersonalData({
        firstName: data.user.firstName || '',
        lastName: data.user.lastName || '',
        phone: data.user.phone || '',
        city: data.user.city || '',
        state: data.user.state || '',
      });
    }
    if (data?.adminProfile) {
      setJobData({
        jobTitle: data.adminProfile.jobTitle || '',
        jobType: data.adminProfile.jobType || 'full_time',
        noticePeriod: data.adminProfile.noticePeriod || '',
        maritalStatus: data.adminProfile.maritalStatus || '',
        bloodGroup: data.adminProfile.bloodGroup || '',
        nationality: data.adminProfile.nationality || 'India',
      });
    }
  }, [data]);

  const updateMutation = useMutation({
    mutationFn: async (updateData: { personal?: typeof personalData; job?: typeof jobData }) => {
      const response = await fetch('/api/profile', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(updateData),
      });
      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || 'Failed to update profile');
      }
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['profile'] });
    },
  });

  useEffect(() => {
    if (!authLoading && !isAuthorized) {
      router.push('/');
    }
  }, [authLoading, isAuthorized, router]);

  if (authLoading || !isAuthorized || isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-slate-50">
        <Loader2 className="h-8 w-8 animate-spin text-indigo-600" />
      </div>
    );
  }

  const renderProfileContent = () => (
    <div className="space-y-6">
      <div className="flex items-center gap-4">
        <div className="w-20 h-20 bg-gradient-to-br from-indigo-500 to-violet-500 rounded-full flex items-center justify-center">
          <span className="text-white font-bold text-2xl">
            {data?.user?.firstName?.[0]}{data?.user?.lastName?.[0]}
          </span>
        </div>
        <div>
          <h1 className="text-2xl font-bold text-slate-900">
            {data?.user?.firstName} {data?.user?.lastName}
          </h1>
          <Badge className="capitalize mt-1">
            {data?.user?.role?.replace('_', ' ')}
          </Badge>
        </div>
      </div>

      {updateMutation.isSuccess && (
        <div className="p-3 bg-green-50 border border-green-200 rounded-lg text-green-600 text-sm">
          Profile updated successfully!
        </div>
      )}

      {updateMutation.error && (
        <div className="p-3 bg-red-50 border border-red-200 rounded-lg text-red-600 text-sm">
          {updateMutation.error.message}
        </div>
      )}

      <Tabs defaultValue="personal">
        <TabsList>
          <TabsTrigger value="personal" className="flex items-center gap-2">
            <User className="h-4 w-4" />
            Personal Details
          </TabsTrigger>
          {isAdminOrSuperAdmin && (
            <TabsTrigger value="job" className="flex items-center gap-2">
              <Briefcase className="h-4 w-4" />
              Job Details
            </TabsTrigger>
          )}
        </TabsList>

        <TabsContent value="personal" className="mt-6">
          <Card>
            <CardHeader>
              <CardTitle>Personal Information</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid md:grid-cols-2 gap-4">
                <div>
                  <Label>First Name</Label>
                  <Input
                    value={personalData.firstName}
                    onChange={(e) => setPersonalData({ ...personalData, firstName: e.target.value })}
                    className="mt-1"
                  />
                </div>
                <div>
                  <Label>Last Name</Label>
                  <Input
                    value={personalData.lastName}
                    onChange={(e) => setPersonalData({ ...personalData, lastName: e.target.value })}
                    className="mt-1"
                  />
                </div>
              </div>

              <div>
                <Label>Email</Label>
                <Input
                  value={data?.user?.email || ''}
                  disabled
                  className="mt-1 bg-slate-50"
                />
                <p className="text-xs text-slate-500 mt-1">Email cannot be changed</p>
              </div>

              <div>
                <Label>Phone</Label>
                <Input
                  value={personalData.phone}
                  onChange={(e) => setPersonalData({ ...personalData, phone: e.target.value })}
                  className="mt-1"
                />
              </div>

              <div className="grid md:grid-cols-2 gap-4">
                <div>
                  <Label>City</Label>
                  <Input
                    value={personalData.city}
                    onChange={(e) => setPersonalData({ ...personalData, city: e.target.value })}
                    className="mt-1"
                  />
                </div>
                <div>
                  <Label>State</Label>
                  <Select 
                    value={personalData.state} 
                    onValueChange={(v) => setPersonalData({ ...personalData, state: v })}
                  >
                    <SelectTrigger className="mt-1">
                      <SelectValue placeholder="Select state" />
                    </SelectTrigger>
                    <SelectContent>
                      {INDIAN_STATES.map((state) => (
                        <SelectItem key={state} value={state}>
                          {state}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </div>

              <Button
                onClick={() => updateMutation.mutate({ personal: personalData })}
                disabled={updateMutation.isPending}
              >
                {updateMutation.isPending ? (
                  <Loader2 className="h-4 w-4 animate-spin mr-2" />
                ) : (
                  <Save className="h-4 w-4 mr-2" />
                )}
                Save Changes
              </Button>
            </CardContent>
          </Card>
        </TabsContent>

        {isAdminOrSuperAdmin && (
          <TabsContent value="job" className="mt-6">
            <Card>
              <CardHeader>
                <CardTitle>Job Information</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid md:grid-cols-2 gap-4">
                  <div>
                    <Label>Employee Number</Label>
                    <Input
                      value={data?.adminProfile?.employeeNumber || ''}
                      disabled
                      className="mt-1 bg-slate-50"
                    />
                  </div>
                  <div>
                    <Label>Job Title</Label>
                    <Input
                      value={jobData.jobTitle}
                      onChange={(e) => setJobData({ ...jobData, jobTitle: e.target.value })}
                      className="mt-1"
                    />
                  </div>
                </div>

                <div className="grid md:grid-cols-2 gap-4">
                  <div>
                    <Label>Job Type</Label>
                    <Select 
                      value={jobData.jobType} 
                      onValueChange={(v) => setJobData({ ...jobData, jobType: v })}
                    >
                      <SelectTrigger className="mt-1">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        {JOB_TYPES.map((type) => (
                          <SelectItem key={type.value} value={type.value}>
                            {type.label}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                  <div>
                    <Label>Notice Period</Label>
                    <Input
                      value={jobData.noticePeriod}
                      onChange={(e) => setJobData({ ...jobData, noticePeriod: e.target.value })}
                      placeholder="e.g., 30 days"
                      className="mt-1"
                    />
                  </div>
                </div>

                <div className="grid md:grid-cols-3 gap-4">
                  <div>
                    <Label>Marital Status</Label>
                    <Select 
                      value={jobData.maritalStatus} 
                      onValueChange={(v) => setJobData({ ...jobData, maritalStatus: v })}
                    >
                      <SelectTrigger className="mt-1">
                        <SelectValue placeholder="Select" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="single">Single</SelectItem>
                        <SelectItem value="married">Married</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  <div>
                    <Label>Blood Group</Label>
                    <Select 
                      value={jobData.bloodGroup} 
                      onValueChange={(v) => setJobData({ ...jobData, bloodGroup: v })}
                    >
                      <SelectTrigger className="mt-1">
                        <SelectValue placeholder="Select" />
                      </SelectTrigger>
                      <SelectContent>
                        {['A+', 'A-', 'B+', 'B-', 'O+', 'O-', 'AB+', 'AB-'].map((bg) => (
                          <SelectItem key={bg} value={bg}>{bg}</SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                  <div>
                    <Label>Nationality</Label>
                    <Input
                      value={jobData.nationality}
                      onChange={(e) => setJobData({ ...jobData, nationality: e.target.value })}
                      className="mt-1"
                    />
                  </div>
                </div>

                <div className="pt-2">
                  <p className="text-sm text-slate-500 mb-2">
                    Active Leads: {data?.adminProfile?.currentActiveLeads} / {data?.adminProfile?.maxActiveLeads}
                  </p>
                </div>

                <Button
                  onClick={() => updateMutation.mutate({ job: jobData })}
                  disabled={updateMutation.isPending}
                >
                  {updateMutation.isPending ? (
                    <Loader2 className="h-4 w-4 animate-spin mr-2" />
                  ) : (
                    <Save className="h-4 w-4 mr-2" />
                  )}
                  Save Changes
                </Button>
              </CardContent>
            </Card>
          </TabsContent>
        )}
      </Tabs>
    </div>
  );

  if (isAdminOrSuperAdmin) {
    return (
      <>
      <AdminSidebar onLogoutClick={()=>{}}/>
        {renderProfileContent()}
     </>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-white">
      <Header />
      <main className="mx-auto max-w-3xl px-4 sm:px-6 lg:px-8 py-12">
        {renderProfileContent()}
      </main>
      <Footer />
    </div>
  );
}
