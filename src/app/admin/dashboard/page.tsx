'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { Loader2, Users, FileCheck, Phone, Clock } from 'lucide-react';
import { AdminLayout } from '@/components/layout';
import { Badge } from '@/components/ui/badge';
import { useAuth, useRequireAuth } from '@/lib/hooks';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { TableShimmer } from '@/components/ui/table-shimmer';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { LEAD_STATUSES } from '@/lib/constants';

interface DashboardStats {
  totalRegistrations: number;
  totalInfoFilled: number;
  totalRequests: number;
  pendingCallbacks: number;
}

type ApiDate = string | Date | { _seconds: number; _nanoseconds?: number } | null | undefined;

interface Lead {
  id: string;
  studentName: string;
  studentPhone: string;
  studentLocation: string;
  rankUsed: number;
  preferredBranch: string;
  status: string;
  assignedAt: ApiDate;
  createdAt: ApiDate;
}

function formatDate(dateValue: ApiDate) {
  if (!dateValue) return 'N/A';

  const date = typeof dateValue === 'object' && '_seconds' in dateValue
    ? new Date(dateValue._seconds * 1000)
    : new Date(dateValue);

  if (Number.isNaN(date.getTime())) return 'N/A';

  return date.toLocaleDateString('en-IN', {
    day: '2-digit',
    month: 'short',
    year: 'numeric',
  });
}

export default function AdminDashboardPage() {
  const router = useRouter();
  const queryClient = useQueryClient();
  const { loading: authLoading } = useAuth();
  const { isAuthorized } = useRequireAuth(['admin']);

  const { data: stats, isLoading: statsLoading } = useQuery({
    queryKey: ['admin-dashboard-stats'],
    queryFn: async () => {
      const response = await fetch('/api/admin/dashboard');
      if (!response.ok) throw new Error('Failed to fetch stats');
      return response.json() as Promise<{ stats: DashboardStats; pendingCallbacks: number }>;
    },
    enabled: !!isAuthorized,
  });

  const { data: leadsData, isLoading: leadsLoading } = useQuery({
    queryKey: ['admin-leads'],
    queryFn: async () => {
      const response = await fetch('/api/admin/leads');
      if (!response.ok) throw new Error('Failed to fetch leads');
      return response.json();
    },
    enabled: !!isAuthorized,
  });

  const updateStatusMutation = useMutation({
    mutationFn: async ({ leadId, status }: { leadId: string, status: string }) => {
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
      queryClient.invalidateQueries({ queryKey: ['admin-dashboard-stats'] });
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

  const statCards = [
    {
      title: 'Assigned Leads',
      value: leads.length,
      icon: Users,
      color: 'bg-indigo-50 text-indigo-600',
    },
    {
      title: 'Pending Callbacks',
      value: leads.filter((l) => ['new', 'pending'].includes(l.status)).length,
      icon: Phone,
      color: 'bg-amber-50 text-amber-600',
    },
    {
      title: 'Completed Today',
      value: leads.filter((l) => l.status === 'completed')?.length || 0,
      icon: FileCheck,
      color: 'bg-green-50 text-green-600',
    },
    {
      title: 'In Progress',
      value: leads.filter((l) => l.status === 'in_progress')?.length || 0,
      icon: Clock,
      color: 'bg-purple-50 text-purple-600',
    },
  ];

  const getStatusBadge = (status: string, leadId: string) => {
    const statusMap: Record<string, { label: string, color: string }> = {
      'new': { label: 'New', color: 'bg-slate-100 text-slate-700 border-slate-200' },
      'pending': { label: 'Pending', color: 'bg-amber-50 text-amber-700 border-amber-200' },
      'in_progress': { label: 'In Progress', color: 'bg-blue-50 text-blue-700 border-blue-200' },
      'completed': { label: 'Completed', color: 'bg-green-50 text-green-700 border-green-200' },
      'not_interested': { label: 'Not Interested', color: 'bg-red-50 text-red-700 border-red-200' },
      'wrong_number': { label: 'Wrong Number', color: 'bg-orange-50 text-orange-700 border-orange-200' },
      'follow_up': { label: 'Follow Up', color: 'bg-purple-50 text-purple-700 border-purple-200' },
      'callback_requested': { label: 'Callback', color: 'bg-cyan-50 text-cyan-700 border-cyan-200' },
      'no_response': { label: 'No Response', color: 'bg-gray-50 text-gray-700 border-gray-200' },
    };

    const currentStatus = statusMap[status] || { label: status.replace('_', ' '), color: 'bg-slate-50 text-slate-600 border-slate-200' };

    return (
      <Select
        defaultValue={status}
        onValueChange={(newStatus) => updateStatusMutation.mutate({ leadId, status: newStatus })}
        disabled={updateStatusMutation.isPending}
      >
        <SelectTrigger className={`h-8 w-[140px] border-none shadow-none focus:ring-0 ${currentStatus.color}`}>
          <SelectValue>
            <Badge variant="outline" className={`${currentStatus.color} border-none hover:${currentStatus.color}`}>
              {currentStatus.label}
            </Badge>
          </SelectValue>
        </SelectTrigger>
        <SelectContent>
          {LEAD_STATUSES.map((statusOption) => (
            <SelectItem key={statusOption.value} value={statusOption.value}>
              {statusOption.label}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>
    );
  };

  return (
    <AdminLayout title="Dashboard">
      <div className="space-y-6">
        <div>
          <p className="text-slate-600">Welcome back! Here&apos;s your overview.</p>
        </div>

        {/* Stats Grid */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3 mb-3">
          {statCards.map((stat, index) => (
            <div key={index} className="bg-white rounded-xl p-6 border border-slate-100">
              <div className="flex items-center gap-4">
                <div className={`w-12 h-12 rounded-xl ${stat.color} flex items-center justify-center`}>
                  <stat.icon className="h-6 w-6" />
                </div>
                <div>
                  <p className="text-sm text-slate-500">{stat.title}</p>
                  <p className="text-2xl font-bold text-slate-900">
                    {statsLoading || leadsLoading ? '...' : stat.value.toLocaleString()}
                  </p>
                </div>
              </div>
            </div>
          ))}
        </div>

        {/* Recent Leads Table */}
        <div className="rounded-xl border-slate-100 overflow-hidden">
          <div className="py-3 border-b border-slate-100">
            <h2 className="text-lg font-medium text-slate-900">Assigned Callbacks</h2>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="bg-[#2F129B] text-white text-sm rounded-t-2xl overflow-hidden">
                  <th className="text-left px-6 py-4 font-medium rounded-tl-2xl">Name</th>
                  <th className="text-left px-6 py-4 font-medium">State</th>
                  <th className="text-left px-6 py-4 font-medium">Phone no.</th>
                  <th className="text-left px-6 py-4 font-medium">Rank</th>
                  <th className="text-left px-6 py-4 font-medium">Course</th>
                  <th className="text-left px-6 py-4 font-medium">Assigned on</th>
                  <th className="text-left px-6 py-4 font-medium rounded-tr-2xl">Status</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {leadsLoading ? (
                  <TableShimmer rows={6} columns={7} />
                ) : leads.length === 0 ? (
                  <tr>
                    <td colSpan={7} className="px-6 py-16 ">
                      <div className="flex items-center justify-center min-h-96">
                        <p className="text-slate-500 text-sm">No assigned callbacks yet.</p>
                      </div>
                    </td>
                  </tr>
                ) : (
                  leads.slice(0, 10).map((lead) => (
                    <tr key={lead.id} className="hover:bg-slate-50">
                      <td className="px-6 py-4 text-sm text-slate-900">{lead.studentName}</td>
                      <td className="px-6 py-4 text-sm text-slate-600">{lead.studentLocation}</td>
                      <td className="px-6 py-4 text-sm text-slate-600">{lead.studentPhone}</td>
                      <td className="px-6 py-4 text-sm text-slate-600">{lead.rankUsed}</td>
                      <td className="px-6 py-4 text-sm text-slate-600">{lead.preferredBranch}</td>
                      <td className="px-6 py-4 text-sm text-slate-600">
                        {formatDate(lead.assignedAt)}
                      </td>
                      <td className="px-6 py-4">{getStatusBadge(lead.status, lead.id)}</td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </AdminLayout>
  );
}
