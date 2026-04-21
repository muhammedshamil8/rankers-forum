'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { Loader2, Upload, Edit, Download, Users, UserPlus, Plus } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { AdminLayout } from '@/components/layout/AdminLayout';
import { useRequireAuth } from '@/lib/hooks';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { JOB_TYPES } from '@/lib/constants';
import { TableShimmer } from '@/components/ui/table-shimmer';
import Image from 'next/image';

interface Lead {
  id: string;
  studentName: string;
  studentPhone: string;
  studentLocation: string;
  rankUsed: number;
  preferredBranch: string;
  status: string;
}

interface Admin {
  id: string;
  firstName: string;
  lastName: string;
  email: string;
  phone: string;
  isActive: boolean;
  profile: {
    employeeNumber?: string;
    jobTitle?: string;
    jobType?: string;
    maxActiveLeads?: number;
    currentActiveLeads?: number;
  };
}

export default function AdminManagementPage() {
  const router = useRouter();
  const queryClient = useQueryClient();
  const { isAuthorized, loading: authLoading } = useRequireAuth(['super_admin']);

  const [createModalOpen, setCreateModalOpen] = useState(false);
  const [detailsModalOpen, setDetailsModalOpen] = useState(false);
  const [leadsModalOpen, setLeadsModalOpen] = useState(false);
  const [selectedAdmin, setSelectedAdmin] = useState<Admin | null>(null);
  const [newAdmin, setNewAdmin] = useState({
    firstName: '',
    lastName: '',
    email: '',
    phone: '',
    password: '',
    employeeNumber: '',
    jobTitle: '',
    jobType: 'full_time',
    maxActiveLeads: 50,
  });

  const { data: adminsData, isLoading } = useQuery({
    queryKey: ['admins'],
    queryFn: async () => {
      const response = await fetch('/api/super-admin/admins');
      if (!response.ok) throw new Error('Failed to fetch admins');
      return response.json();
    },
    enabled: !!isAuthorized,
  });

  const { data: assignedLeadsData, isLoading: leadsLoading } = useQuery({
    queryKey: ['admin-assigned-leads', selectedAdmin?.id],
    queryFn: async () => {
      const response = await fetch(`/api/admin/leads?adminId=${selectedAdmin?.id}`);
      if (!response.ok) throw new Error('Failed to fetch leads');
      return response.json();
    },
    enabled: !!isAuthorized && leadsModalOpen && !!selectedAdmin?.id,
  });

  const createMutation = useMutation({
    mutationFn: async (data: typeof newAdmin) => {
      const response = await fetch('/api/super-admin/admins', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data),
      });
      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || 'Failed to create admin');
      }
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admins'] });
      setCreateModalOpen(false);
      setNewAdmin({
        firstName: '',
        lastName: '',
        email: '',
        phone: '',
        password: '',
        employeeNumber: '',
        jobTitle: '',
        jobType: 'full_time',
        maxActiveLeads: 50,
      });
    },
  });

  const toggleActiveMutation = useMutation({
    mutationFn: async ({ adminId, isActive }: { adminId: string; isActive: boolean }) => {
      const response = await fetch('/api/super-admin/admins', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ adminId, isActive }),
      });
      if (!response.ok) throw new Error('Failed to update admin');
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admins'] });
    },
  });

  useEffect(() => {
    if (!authLoading && !isAuthorized) {
      router.push('/');
    }
  }, [authLoading, isAuthorized, router]);

  const handleViewDetails = (admin: Admin) => {
    setSelectedAdmin(admin);
    setDetailsModalOpen(true);
  };

  const handleViewLeads = (admin: Admin) => {
    setSelectedAdmin(admin);
    setLeadsModalOpen(true);
  };

  const admins: Admin[] = adminsData?.admins || [];

  return (
    <AdminLayout
      title="Admin Management"
      actions={
        <div className="flex items-center gap-3">
          <Button size="sm" onClick={() => setCreateModalOpen(true)}>
            <Plus className="h-4 w-4 mr-2" />
            Create Admin
          </Button>
        </div>
      }
    >
      {(authLoading || !isAuthorized) ? (
        <div className="min-h-[400px] flex items-center justify-center">
          <Loader2 className="h-8 w-8 animate-spin text-indigo-600" />
        </div>
      ) : (
        <>
          <div className="bg-white rounded-xl border border-slate-100 overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="bg-[#2F129B] text-white text-sm rounded-t-2xl overflow-hidden">
                    <th className="text-left px-6 py-4 font-medium rounded-tl-2xl">Admin Name</th>
                    <th className="text-left px-6 py-4 font-medium">Employee Number</th>
                    <th className="text-left px-6 py-4 font-medium">Phone no.</th>
                    <th className="text-left px-6 py-4 font-medium">Email Id</th>
                    <th className="text-left px-6 py-4 font-medium">Callback</th>
                    <th className="text-left px-6 py-4 font-medium">Active</th>
                    <th className="text-left px-6 py-4 font-medium rounded-tr-2xl">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {isLoading ? (
                    <TableShimmer rows={6} columns={7} />
                  ) : admins.length === 0 ? (
                    <tr>
                      <td colSpan={7} className="px-6 py-16">
                        <div className="flex items-center justify-center min-h-96">
                          <p className="text-slate-500 text-sm">No admins found. Click "Create Admin" to add one.</p>
                        </div>
                      </td>
                    </tr>
                  ) : (
                    admins.map((admin) => (
                      <tr key={admin.id} className="hover:bg-slate-50">
                        <td className="px-6 py-4 text-sm text-slate-900">
                          {admin.firstName} {admin.lastName}
                        </td>
                        <td className="px-6 py-4 text-sm text-slate-600">
                          {admin.profile?.employeeNumber || '-'}
                        </td>
                        <td className="px-6 py-4 text-sm text-slate-600">{admin.phone}</td>
                        <td className="px-6 py-4 text-sm text-slate-600">{admin.email}</td>
                        <td className="px-6 py-4 text-sm text-slate-600">
                          {admin.profile?.currentActiveLeads || 0}
                        </td>
                        <td className="px-6 py-4">
                          <button
                            onClick={() => toggleActiveMutation.mutate({ adminId: admin.id, isActive: !admin.isActive })}
                            disabled={toggleActiveMutation.isPending}
                          >
                            {admin.isActive ? (
                              <Badge className="bg-green-50 text-green-700 border-green-200 cursor-pointer">Yes</Badge>
                            ) : (
                              <Badge className="bg-slate-100 text-slate-600 border-slate-200 cursor-pointer">No</Badge>
                            )}
                          </button>
                        </td>
                        <td className="px-6 py-4">
                          <div className="flex items-center gap-2">
                            <button
                              onClick={() => handleViewDetails(admin)}
                              className="text-indigo-600 hover:text-indigo-700"
                              title="View Details"
                            >
                              <Image src="/details.svg" alt="Details" width={24} height={24} />
                            </button>
                            <button
                              onClick={() => handleViewLeads(admin)}
                              className="text-slate-500 hover:text-indigo-600"
                              title="View Assigned Leads"
                            >
                              <Users className="h-5 w-5" />
                            </button>
                          </div>
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </>
      )}

      <Dialog open={createModalOpen} onOpenChange={setCreateModalOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Create New Admin</DialogTitle>
            <DialogDescription className="sr-only">
              Fill in the details below to create a new administrator account.
            </DialogDescription>
          </DialogHeader>

          <form
            onSubmit={(e) => {
              e.preventDefault();
              createMutation.mutate(newAdmin);
            }}
            className="space-y-4"
          >
            {createMutation.error && (
              <div className="p-3 text-sm text-red-600 bg-red-50 rounded-lg border border-red-100">
                {createMutation.error.message}
              </div>
            )}

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>First Name</Label>
                <Input
                  value={newAdmin.firstName}
                  onChange={(e) => setNewAdmin({ ...newAdmin, firstName: e.target.value })}
                  required
                />
              </div>
              <div className="space-y-2">
                <Label>Last Name</Label>
                <Input
                  value={newAdmin.lastName}
                  onChange={(e) => setNewAdmin({ ...newAdmin, lastName: e.target.value })}
                  required
                />
              </div>
            </div>

            <div className="space-y-2">
              <Label>Email</Label>
              <Input
                type="email"
                value={newAdmin.email}
                onChange={(e) => setNewAdmin({ ...newAdmin, email: e.target.value })}
                required
              />
            </div>

            <div className="space-y-2">
              <Label>Phone</Label>
              <Input
                value={newAdmin.phone}
                onChange={(e) => setNewAdmin({ ...newAdmin, phone: e.target.value })}
                required
              />
            </div>

            <div className="space-y-2">
              <Label>Password</Label>
              <Input
                type="password"
                value={newAdmin.password}
                onChange={(e) => setNewAdmin({ ...newAdmin, password: e.target.value })}
                required
                minLength={6}
              />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>Employee Number</Label>
                <Input
                  value={newAdmin.employeeNumber}
                  onChange={(e) => setNewAdmin({ ...newAdmin, employeeNumber: e.target.value })}
                />
              </div>
              <div className="space-y-2">
                <Label>Job Title</Label>
                <Input
                  value={newAdmin.jobTitle}
                  onChange={(e) => setNewAdmin({ ...newAdmin, jobTitle: e.target.value })}
                />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>Job Type</Label>
                <Select
                  value={newAdmin.jobType}
                  onValueChange={(v) => setNewAdmin({ ...newAdmin, jobType: v })}
                >
                  <SelectTrigger>
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
              <div className="space-y-2">
                <Label>Max Active Leads</Label>
                <Input
                  type="number"
                  value={newAdmin.maxActiveLeads}
                  onChange={(e) => setNewAdmin({ ...newAdmin, maxActiveLeads: parseInt(e.target.value) || 50 })}
                />
              </div>
            </div>

            <div className="flex gap-3 pt-4">
              <Button type="button" variant="outline" className="flex-1" onClick={() => setCreateModalOpen(false)}>
                Cancel
              </Button>
              <Button type="submit" className="flex-1" disabled={createMutation.isPending}>
                {createMutation.isPending ? (
                  <Loader2 className="h-4 w-4 animate-spin" />
                ) : (
                  <>
                    <UserPlus className="h-4 w-4 mr-2" />
                    Create Admin
                  </>
                )}
              </Button>
            </div>
          </form>
        </DialogContent>
      </Dialog>

      <Dialog open={detailsModalOpen} onOpenChange={setDetailsModalOpen}>
        <DialogContent className="sm:max-w-lg">
          <DialogHeader>
            <DialogTitle>Admin Details</DialogTitle>
            <DialogDescription className="sr-only">
              Detailed view of the administrator's profile and performance.
            </DialogDescription>
          </DialogHeader>

          {selectedAdmin && (
            <div className="space-y-6">
              <div>
                <h3 className="text-indigo-700 font-semibold mb-4">Basic and Contact Details</h3>
                <div className="grid grid-cols-2 gap-4 text-sm">
                  <div>
                    <p className="text-slate-500">Full Name</p>
                    <p className="font-medium">{selectedAdmin.firstName} {selectedAdmin.lastName}</p>
                  </div>
                  <div>
                    <p className="text-slate-500">Phone Number</p>
                    <p className="font-medium">+91 {selectedAdmin.phone}</p>
                  </div>
                  <div>
                    <p className="text-slate-500">Email Address</p>
                    <p className="font-medium">{selectedAdmin.email}</p>
                  </div>
                  <div>
                    <p className="text-slate-500">Admin ID</p>
                    <p className="font-medium">{selectedAdmin.id}</p>
                  </div>
                </div>
              </div>

              <div>
                <h3 className="text-indigo-700 font-semibold mb-4">Employment Details</h3>
                <div className="grid grid-cols-2 gap-4 text-sm">
                  <div>
                    <p className="text-slate-500">Employee Number</p>
                    <p className="font-medium">{selectedAdmin.profile?.employeeNumber || '-'}</p>
                  </div>
                  <div>
                    <p className="text-slate-500">Job Title</p>
                    <p className="font-medium">{selectedAdmin.profile?.jobTitle || '-'}</p>
                  </div>
                  <div>
                    <p className="text-slate-500">Job Type</p>
                    <p className="font-medium capitalize">{selectedAdmin.profile?.jobType?.replace('_', ' ') || '-'}</p>
                  </div>
                  <div>
                    <p className="text-slate-500">Account Status</p>
                    <p className="font-medium">
                      {selectedAdmin.isActive ? 'Active' : 'Inactive'}
                    </p>
                  </div>
                </div>
              </div>

              <div>
                <h3 className="text-indigo-700 font-semibold mb-4">Lead Management Stats</h3>
                <div className="grid grid-cols-2 gap-4 text-sm">
                  <div>
                    <p className="text-slate-500">Active Leads</p>
                    <p className="font-medium">{selectedAdmin.profile?.currentActiveLeads || 0}</p>
                  </div>
                  <div>
                    <p className="text-slate-500">Max Lead Capacity</p>
                    <p className="font-medium">{selectedAdmin.profile?.maxActiveLeads || 50}</p>
                  </div>
                </div>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>

      <Dialog open={leadsModalOpen} onOpenChange={setLeadsModalOpen}>
        <DialogContent className="sm:max-w-4xl max-h-[80vh] overflow-hidden flex flex-col">
          <DialogHeader>
            <DialogTitle>
              Leads Assigned to {selectedAdmin?.firstName} {selectedAdmin?.lastName}
            </DialogTitle>
            <DialogDescription className="sr-only">
              List of all leads currently assigned to this administrator.
            </DialogDescription>
          </DialogHeader>

          <div className="flex-1 overflow-y-auto mt-4">
            <div className="bg-white rounded-xl border border-slate-100 overflow-hidden">
              <table className="w-full">
                <thead className="sticky top-0 z-10">
                  <tr className="bg-[#2F129B] text-white text-sm">
                    <th className="text-left px-6 py-4 font-medium">Student Name</th>
                    <th className="text-left px-6 py-4 font-medium">Location</th>
                    <th className="text-left px-6 py-4 font-medium">Phone</th>
                    <th className="text-left px-6 py-4 font-medium">Rank</th>
                    <th className="text-left px-6 py-4 font-medium">Status</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {leadsLoading ? (
                    <tr>
                      <td colSpan={5} className="px-6 py-4">
                        <div className="flex justify-center p-8">
                          <Loader2 className="h-6 w-6 animate-spin text-indigo-600" />
                        </div>
                      </td>
                    </tr>
                  ) : !assignedLeadsData?.leads || assignedLeadsData.leads.length === 0 ? (
                    <tr>
                      <td colSpan={5} className="px-6 py-16 text-center text-slate-500">
                        No leads assigned to this admin.
                      </td>
                    </tr>
                  ) : (
                    assignedLeadsData.leads.map((lead: Lead) => (
                      <tr key={lead.id} className="hover:bg-slate-50">
                        <td className="px-6 py-4 text-sm text-slate-900">{lead.studentName}</td>
                        <td className="px-6 py-4 text-sm text-slate-600">{lead.studentLocation}</td>
                        <td className="px-6 py-4 text-sm text-slate-600">{lead.studentPhone}</td>
                        <td className="px-6 py-4 text-sm text-slate-600">{lead.rankUsed}</td>
                        <td className="px-6 py-4 text-sm">
                          <Badge className={
                            lead.status === 'completed' ? 'bg-green-50 text-green-700 border-green-200' :
                              lead.status === 'in_progress' ? 'bg-blue-50 text-blue-700 border-blue-200' :
                                'bg-amber-50 text-amber-700 border-amber-200'
                          }>
                            {lead.status.replace('_', ' ').charAt(0).toUpperCase() + lead.status.replace('_', ' ').slice(1)}
                          </Badge>
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </AdminLayout>
  );
}
