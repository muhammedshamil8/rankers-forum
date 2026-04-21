'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { Loader2, Phone, Eye, MessageSquare, Search } from 'lucide-react';
import { AdminLayout } from '@/components/layout';
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
import { LEAD_STATUSES } from '@/lib/constants';

interface Lead {
  id: string;
  studentId: string;
  studentName: string;
  studentPhone: string;
  studentEmail: string;
  studentLocation: string;
  rankUsed: number;
  preferredBranch: string;
  year: number;
  status: string;
  callbackRequested: boolean;
  createdAt: { _seconds: number };
}

interface LeadWithStudent extends Lead {
  student?: {
    rank: number;
    category: string;
    yearOfPassing: number;
    institution: string;
    domicileState: string;
    gender: string;
    counsellingType: string;
    preferredBranch: string;
    locationPreference1: string;
    locationPreference2: string;
    locationPreference3: string;
  };
}

export default function AdminLeadsPage() {
  const router = useRouter();
  const queryClient = useQueryClient();
  const { loading: authLoading } = useAuth();
  const { isAuthorized } = useRequireAuth(['admin']);

  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedLead, setSelectedLead] = useState<LeadWithStudent | null>(null);
  const [detailsOpen, setDetailsOpen] = useState(false);
  const [followupOpen, setFollowupOpen] = useState(false);
  const [followupRemark, setFollowupRemark] = useState('');
  const [newStatus, setNewStatus] = useState('');

  // Fetch assigned leads
  const { data, isLoading } = useQuery({
    queryKey: ['admin-leads', statusFilter],
    queryFn: async () => {
      const params = new URLSearchParams();
      if (statusFilter && statusFilter !== 'all') params.set('status', statusFilter);
      const response = await fetch(`/api/admin/leads?${params.toString()}`);
      if (!response.ok) throw new Error('Failed to fetch leads');
      return response.json();
    },
    enabled: !!isAuthorized,
  });

  // Fetch lead details
  const fetchLeadDetails = async (leadId: string) => {
    const response = await fetch(`/api/admin/leads/${leadId}`);
    if (!response.ok) throw new Error('Failed to fetch lead details');
    return response.json();
  };

  // Update lead status mutation
  const updateStatusMutation = useMutation({
    mutationFn: async ({ leadId, status }: { leadId: string; status: string }) => {
      const response = await fetch(`/api/admin/leads/${leadId}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status }),
      });
      if (!response.ok) throw new Error('Failed to update status');
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin-leads'] });
      setDetailsOpen(false);
    },
  });

  // Create followup mutation
  const createFollowupMutation = useMutation({
    mutationFn: async ({ leadId, remark }: { leadId: string; remark: string }) => {
      const response = await fetch('/api/admin/followups', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ leadId, remark }),
      });
      if (!response.ok) throw new Error('Failed to create followup');
      return response.json();
    },
    onSuccess: () => {
      setFollowupOpen(false);
      setFollowupRemark('');
      queryClient.invalidateQueries({ queryKey: ['admin-leads'] });
    },
  });

  const handleViewDetails = async (lead: Lead) => {
    try {
      const details = await fetchLeadDetails(lead.id);
      setSelectedLead(details.lead);
      setNewStatus(details.lead.status);
      setDetailsOpen(true);
    } catch {
      // Handle error
    }
  };

  const handleAddFollowup = (lead: Lead) => {
    setSelectedLead(lead as LeadWithStudent);
    setFollowupOpen(true);
  };

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

  const leads: Lead[] = data?.leads || [];
  const filteredLeads = leads.filter(lead =>
    lead.studentName.toLowerCase().includes(searchQuery.toLowerCase()) ||
    lead.studentPhone.includes(searchQuery)
  );

  return (
    <AdminLayout title="Assigned Leads">
      <div className="space-y-6">
        <div>
          <p className="text-slate-600">Manage your assigned callback requests</p>
        </div>

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
              <SelectItem value="all">All Statuses</SelectItem>
              {LEAD_STATUSES.map((status) => (
                <SelectItem key={status.value} value={status.value}>
                  {status.label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        <Card>
          <CardContent className="p-0">
            {isLoading ? (
              <div className="flex items-center justify-center py-12">
                <Loader2 className="h-8 w-8 animate-spin text-indigo-600" />
              </div>
            ) : filteredLeads.length > 0 ? (
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead>
                    <tr className="text-left text-sm text-slate-500 border-b bg-slate-50">
                      <th className="p-4 font-medium">Student</th>
                      <th className="p-4 font-medium">Phone</th>
                      <th className="p-4 font-medium">Location</th>
                      <th className="p-4 font-medium">Rank</th>
                      <th className="p-4 font-medium">Status</th>
                      <th className="p-4 font-medium">Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    {filteredLeads.map((lead) => (
                      <tr key={lead.id} className="border-b last:border-0 hover:bg-slate-50">
                        <td className="p-4">
                          <div>
                            <p className="font-medium text-slate-900">{lead.studentName}</p>
                            <p className="text-sm text-slate-500">{lead.studentEmail}</p>
                          </div>
                        </td>
                        <td className="p-4 text-slate-600">{lead.studentPhone}</td>
                        <td className="p-4 text-slate-600">{lead.studentLocation}</td>
                        <td className="p-4 text-slate-600">{lead.rankUsed.toLocaleString()}</td>
                        <td className="p-4">
                          <Badge variant={
                            lead.status === 'completed' ? 'completed' :
                              lead.status === 'in_progress' ? 'pending' :
                                'warning'
                          }>
                            {lead.status.replace('_', ' ')}
                          </Badge>
                        </td>
                        <td className="p-4">
                          <div className="flex items-center gap-2">
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => handleViewDetails(lead)}
                            >
                              <Eye className="h-4 w-4" />
                            </Button>
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => handleAddFollowup(lead)}
                            >
                              <MessageSquare className="h-4 w-4" />
                            </Button>
                            <a href={`tel:${lead.studentPhone}`}>
                              <Button variant="ghost" size="sm">
                                <Phone className="h-4 w-4" />
                              </Button>
                            </a>
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            ) : (
              <p className="text-center text-slate-500 py-12">No leads found.</p>
            )}
          </CardContent>
        </Card>
      </div>

      <Dialog open={detailsOpen} onOpenChange={setDetailsOpen}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>Lead Details</DialogTitle>
          </DialogHeader>
          {selectedLead && (
            <div className="space-y-6">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label className="text-slate-500">Name</Label>
                  <p className="font-medium">{selectedLead.studentName}</p>
                </div>
                <div>
                  <Label className="text-slate-500">Phone</Label>
                  <p className="font-medium">{selectedLead.studentPhone}</p>
                </div>
                <div>
                  <Label className="text-slate-500">Email</Label>
                  <p className="font-medium">{selectedLead.studentEmail}</p>
                </div>
                <div>
                  <Label className="text-slate-500">Location</Label>
                  <p className="font-medium">{selectedLead.studentLocation}</p>
                </div>
                <div>
                  <Label className="text-slate-500">Rank Used</Label>
                  <p className="font-medium">{selectedLead.rankUsed.toLocaleString()}</p>
                </div>
                <div>
                  <Label className="text-slate-500">Preferred Branch</Label>
                  <p className="font-medium">{selectedLead.preferredBranch.toUpperCase()}</p>
                </div>
              </div>

              {selectedLead.student && (
                <div className="border-t pt-4">
                  <h4 className="font-medium mb-3">Student Academic Info</h4>
                  <div className="grid grid-cols-2 gap-4 text-sm">
                    <div>
                      <Label className="text-slate-500">Category</Label>
                      <p>{selectedLead.student.category.toUpperCase()}</p>
                    </div>
                    <div>
                      <Label className="text-slate-500">Institution</Label>
                      <p>{selectedLead.student.institution}</p>
                    </div>
                    <div>
                      <Label className="text-slate-500">Domicile State</Label>
                      <p>{selectedLead.student.domicileState}</p>
                    </div>
                    <div>
                      <Label className="text-slate-500">Counselling Type</Label>
                      <p>{selectedLead.student.counsellingType}</p>
                    </div>
                  </div>
                </div>
              )}

              <div className="border-t pt-4">
                <Label>Update Status</Label>
                <div className="flex gap-3 mt-2">
                  <Select value={newStatus} onValueChange={setNewStatus}>
                    <SelectTrigger className="flex-1">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {LEAD_STATUSES.map((status) => (
                        <SelectItem key={status.value} value={status.value}>
                          {status.label}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  <Button
                    onClick={() => updateStatusMutation.mutate({
                      leadId: selectedLead.id,
                      status: newStatus
                    })}
                    disabled={updateStatusMutation.isPending}
                  >
                    {updateStatusMutation.isPending ? (
                      <Loader2 className="h-4 w-4 animate-spin" />
                    ) : (
                      'Update'
                    )}
                  </Button>
                </div>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>

      <Dialog open={followupOpen} onOpenChange={setFollowupOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Add Follow-up Remark</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <div>
              <Label>Remark</Label>
              <textarea
                className="w-full mt-2 p-3 border border-slate-200 rounded-lg resize-none focus:outline-none focus:ring-2 focus:ring-indigo-500"
                rows={4}
                placeholder="Enter your follow-up remarks..."
                value={followupRemark}
                onChange={(e) => setFollowupRemark(e.target.value)}
              />
            </div>
            <Button
              className="w-full"
              onClick={() => {
                if (selectedLead && followupRemark.trim()) {
                  createFollowupMutation.mutate({
                    leadId: selectedLead.id,
                    remark: followupRemark,
                  });
                }
              }}
              disabled={createFollowupMutation.isPending || !followupRemark.trim()}
            >
              {createFollowupMutation.isPending ? (
                <Loader2 className="h-4 w-4 animate-spin mr-2" />
              ) : null}
              Save Remark
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </AdminLayout>
  );
}
