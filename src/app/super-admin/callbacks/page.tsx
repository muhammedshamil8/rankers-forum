'use client';

import { useState, useEffect, Suspense } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { Loader2, Search, UserPlus, Phone, Check } from 'lucide-react';
import { AdminSidebar } from '@/components/layout';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Label } from '@/components/ui/label';
import { useAuth, useRequireAuth } from '@/lib/hooks';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';

interface Lead {
  id: string;
  studentName: string;
  studentPhone: string;
  studentLocation: string;
  status: string;
  assignedAdminId: string | null;
}

interface Admin {
  id: string;
  firstName: string;
  lastName: string;
  email: string;
  profile: {
    currentActiveLeads: number;
    maxActiveLeads: number;
    isAvailable: boolean;
  };
}

export default function SuperAdminCallbacksPage() {
  return (
    <Suspense fallback={
      <div className="min-h-screen flex items-center justify-center bg-slate-50">
        <Loader2 className="h-8 w-8 animate-spin text-indigo-600" />
      </div>
    }>
      <SuperAdminCallbacksContent />
    </Suspense>
  );
}

function SuperAdminCallbacksContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const queryClient = useQueryClient();
  const { loading: authLoading } = useAuth();
  const { isAuthorized } = useRequireAuth(['super_admin']);
  
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState('new');
  const [assignModalOpen, setAssignModalOpen] = useState(false);
  const [selectedLead, setSelectedLead] = useState<Lead | null>(null);
  const [selectedAdminId, setSelectedAdminId] = useState('');

  // Check for assign parameter
  useEffect(() => {
    const assignId = searchParams.get('assign');
    if (assignId) {
      // Fetch lead and open assign modal
      fetch(`/api/admin/leads/${assignId}`)
        .then(res => res.json())
        .then(data => {
          if (data.lead) {
            setSelectedLead(data.lead);
            setAssignModalOpen(true);
          }
        });
    }
  }, [searchParams]);

  // Fetch unassigned leads
  const { data: leadsData, isLoading } = useQuery({
    queryKey: ['super-admin-callbacks', statusFilter],
    queryFn: async () => {
      const params = new URLSearchParams();
      if (statusFilter !== 'all') params.set('status', statusFilter);
      const response = await fetch(`/api/admin/leads?${params.toString()}`);
      if (!response.ok) throw new Error('Failed to fetch leads');
      return response.json();
    },
    enabled: !!isAuthorized,
  });

  // Fetch available admins
  const { data: adminsData } = useQuery({
    queryKey: ['available-admins'],
    queryFn: async () => {
      const response = await fetch('/api/super-admin/admins?available=true');
      if (!response.ok) throw new Error('Failed to fetch admins');
      return response.json();
    },
    enabled: !!isAuthorized && assignModalOpen,
  });

  // Assign lead mutation
  const [assignError, setAssignError] = useState<string | null>(null);

  const assignMutation = useMutation({
    mutationFn: async ({ leadId, adminId }: { leadId: string; adminId: string }) => {
      const response = await fetch(`/api/admin/leads/${leadId}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ assignToAdminId: adminId }),
      });
      const data = await response.json();
      if (!response.ok) throw new Error(data?.error || 'Failed to assign lead');
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['super-admin-callbacks'] });
      setAssignModalOpen(false);
      setSelectedLead(null);
      setSelectedAdminId('');
      setAssignError(null);
    },
    onError: (error: Error) => {
      setAssignError(error.message || 'Assignment failed. Please try again.');
    },
  });

  useEffect(() => {
    if (!authLoading && !isAuthorized) {
      router.push('/');
    }
  }, [authLoading, isAuthorized, router]);

  if (authLoading || !isAuthorized) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-slate-50">
        <Loader2 className="h-8 w-8 animate-spin text-indigo-600" />
      </div>
    );
  }

  const leads: Lead[] = leadsData?.leads || [];
  const admins: Admin[] = adminsData?.admins || [];
  
  const filteredLeads = leads.filter(lead =>
    (lead.studentName || '').toLowerCase().includes(searchQuery.toLowerCase()) ||
    (lead.studentPhone || '').includes(searchQuery)
  );

  return (
    <>
    <AdminSidebar/>
      <div className="space-y-6">
        <div>
          <h1 className="text-2xl font-bold text-slate-900">Callback Requests</h1>
          <p className="text-slate-600">Assign callback requests to admins</p>
        </div>

        {/* Filters */}
        <div className="flex flex-wrap gap-4">
          <div className="relative flex-1 min-w-[200px]">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
            <Input
              placeholder="Search by name or phone..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-10"
            />
          </div>
          <Select value={statusFilter} onValueChange={setStatusFilter}>
            <SelectTrigger className="w-48">
              <SelectValue placeholder="Filter by status" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All</SelectItem>
              <SelectItem value="new">New (Unassigned)</SelectItem>
              <SelectItem value="assigned">Assigned</SelectItem>
              <SelectItem value="in_progress">In Progress</SelectItem>
              <SelectItem value="completed">Completed</SelectItem>
            </SelectContent>
          </Select>
        </div>

        {/* Leads Grid */}
        {isLoading ? (
          <div className="flex items-center justify-center py-12">
            <Loader2 className="h-8 w-8 animate-spin text-indigo-600" />
          </div>
        ) : filteredLeads.length > 0 ? (
          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-4">
            {filteredLeads.map((lead) => (
              <Card key={lead.id} className="hover:shadow-md transition-shadow">
                <CardContent className="p-5">
                  <div className="flex items-start justify-between mb-3">
                    <div>
                      <h3 className="font-semibold text-slate-900">{lead.studentName}</h3>
                      <p className="text-sm text-slate-500">{lead.studentLocation}</p>
                    </div>
                    <Badge variant={
                      lead.status === 'completed' ? 'completed' :
                      lead.status === 'assigned' ? 'pending' :
                      'warning'
                    }>
                      {lead.status.replace('_', ' ')}
                    </Badge>
                  </div>
                  <div className="flex items-center gap-2 text-sm text-slate-600 mb-4">
                    <Phone className="h-4 w-4" />
                    {lead.studentPhone}
                  </div>
                  <div className="flex gap-2">
                    {!lead.assignedAdminId ? (
                      <Button
                        size="sm"
                        className="flex-1"
                        onClick={() => {
                          setSelectedLead(lead);
                          setAssignModalOpen(true);
                        }}
                      >
                        <UserPlus className="h-4 w-4 mr-1" />
                        Assign
                      </Button>
                    ) : (
                      <div className="flex-1 flex items-center justify-center text-sm text-emerald-600 bg-emerald-50 rounded-lg py-2">
                        <Check className="h-4 w-4 mr-1" />
                        Assigned
                      </div>
                    )}
                    <a href={`tel:${lead.studentPhone}`}>
                      <Button variant="outline" size="sm">
                        <Phone className="h-4 w-4" />
                      </Button>
                    </a>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        ) : (
          <Card>
            <CardContent className="p-12 text-center text-slate-500">
              No callback requests found.
            </CardContent>
          </Card>
        )}
      </div>

      {/* Assign Modal */}
      <Dialog open={assignModalOpen} onOpenChange={setAssignModalOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Assign Callback</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            {selectedLead && (
              <div className="p-4 bg-slate-50 rounded-lg">
                <p className="font-medium">{selectedLead.studentName}</p>
                <p className="text-sm text-slate-500">{selectedLead.studentPhone}</p>
              </div>
            )}

            <div>
              <Label>Select Admin</Label>
              <Select value={selectedAdminId} onValueChange={setSelectedAdminId}>
                <SelectTrigger className="mt-2">
                  <SelectValue placeholder="Choose an admin" />
                </SelectTrigger>
                <SelectContent>
                  {admins.map((admin) => (
                    <SelectItem key={admin.id} value={admin.id}>
                      <div className="flex items-center justify-between w-full">
                        <span>{admin.firstName} {admin.lastName}</span>
                        <span className="text-xs text-slate-500 ml-2">
                          ({admin.profile.currentActiveLeads}/{admin.profile.maxActiveLeads} leads)
                        </span>
                      </div>
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            {assignError && (
              <div className="p-3 text-sm text-red-600 bg-red-50 rounded-lg border border-red-100">
                {assignError}
              </div>
            )}

            <Button
              className="w-full"
              onClick={() => {
                if (selectedLead && selectedAdminId) {
                  setAssignError(null);
                  assignMutation.mutate({
                    leadId: selectedLead.id,
                    adminId: selectedAdminId,
                  });
                }
              }}
              disabled={!selectedAdminId || assignMutation.isPending}
            >
              {assignMutation.isPending ? (
                <Loader2 className="h-4 w-4 animate-spin mr-2" />
              ) : null}
              Assign Callback
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </>
  );
}
