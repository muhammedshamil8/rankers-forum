'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { Loader2, FileText, CheckCircle, Phone, Users } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { AdminLayout } from '@/components/layout/AdminLayout';
import { useRequireAuth } from '@/lib/hooks';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import Image from 'next/image';
import { TableShimmer } from '@/components/ui/table-shimmer';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

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

export default function SuperAdminDashboard() {
  const router = useRouter();
  const { isAuthorized, loading: authLoading } = useRequireAuth(['super_admin', 'admin']);

  const { data: statsData, isLoading: statsLoading } = useQuery({
    queryKey: ['admin-dashboard-stats'],
    queryFn: async () => {
      const response = await fetch('/api/admin/dashboard');
      if (!response.ok) throw new Error('Failed to fetch stats');
      return response.json();
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

  useEffect(() => {
    if (!authLoading && !isAuthorized) {
      router.push('/');
    }
  }, [authLoading, isAuthorized, router]);

  const queryClient = useQueryClient();

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

  const stats: DashboardStats = statsData?.stats || {
    totalRegistrations: 0,
    totalInfoFilled: 0,
    totalRequests: 0,
    pendingCallbacks: 0,
  };

  const leads: Lead[] = (leadsData?.leads || []).filter((lead: Lead) => lead.assignedAt);

  const statCards = [
    { label: 'Total Registrations', value: stats.totalRegistrations, icon: "/calendar.svg", color: 'bg-indigo-50 text-indigo-600' },
    { label: 'Total Info Filled', value: stats.totalInfoFilled, icon: "/checkCircle.svg", color: 'bg-green-50 text-green-600' },
    { label: 'Total Requests', value: stats.totalRequests, icon: "/user.svg", color: 'bg-amber-50 text-amber-600' },
    { label: 'Pending Callbacks', value: stats.pendingCallbacks, icon: "/phone.svg", color: 'bg-purple-50 text-purple-600' },
  ];

  const getStatusBadge = (status: string, leadId: string) => {
    const statusMap: Record<string, { label: string, color: string }> = {
      'new': { label: 'Pending', color: 'bg-amber-50 text-amber-700 border-amber-200' },
      'pending': { label: 'Pending', color: 'bg-amber-50 text-amber-700 border-amber-200' },
      'in_progress': { label: 'In Progress', color: 'bg-blue-50 text-blue-700 border-blue-200' },
      'completed': { label: 'Completed', color: 'bg-green-50 text-green-700 border-green-200' },
    };

    const currentStatus = statusMap[status] || { label: status, color: 'bg-slate-50 text-slate-600 border-slate-200' };

    return (
      <Select
        defaultValue={status}
        onValueChange={(newStatus) => updateStatusMutation.mutate({ leadId, status: newStatus })}
        disabled={updateStatusMutation.isPending}
      >
        <SelectTrigger className={`h-8 w-[130px] border-none shadow-none focus:ring-0 ${currentStatus.color}`}>
          <SelectValue>
            <Badge className={`${currentStatus.color} border-none hover:${currentStatus.color}`}>
              {currentStatus.label}
            </Badge>
          </SelectValue>
        </SelectTrigger>
        <SelectContent>
          <SelectItem value="new">Pending</SelectItem>
          <SelectItem value="in_progress">In Progress</SelectItem>
          <SelectItem value="completed">Completed</SelectItem>
        </SelectContent>
      </Select>
    );
  };

  return (
    <AdminLayout title="Dashboard">
      {(authLoading || !isAuthorized) ? (
        <div className="min-h-[400px] flex items-center justify-center">
          <Loader2 className="h-8 w-8 animate-spin text-indigo-600" />
        </div>
      ) : (
        <>
          {/* Stats Cards */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3 mb-3">
            {statCards.map((stat, index) => (
              <div key={index} className="bg-white rounded-xl p-6 border border-slate-100">
                <div className="flex items-center gap-4">
                  <div className={`w-12 h-12 rounded-xl ${stat.color} flex items-center justify-center`}>
                    <Image src={stat.icon as string} alt={stat.label} width={28} height={28} />
                  </div>
                  <div>
                    <p className="text-sm text-slate-500">{stat.label}</p>
                    <p className="text-2xl font-bold text-slate-900">
                      {statsLoading ? '...' : stat.value.toLocaleString()}
                    </p>
                  </div>
                </div>
              </div>
            ))}
          </div>

          {/* Assigned Callbacks Table */}
          <div className=" rounded-xl  border-slate-100 overflow-hidden">
            <div className="py-3 border-b border-slate-100">
              <h2 className="text-lg font-medium text-slate-900">Assigned Callbacks</h2>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="bg-[#2F129B] text-white text-sm rounded-t-2xl overflow-hidden">
                    <th className="text-left px-6 py-4 font-medium rounded-tl-2xl ">Name</th>
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
                    leads.map((lead) => (
                      <tr key={lead.id} className="hover:bg-slate-50">
                        <td className="px-6 py-4 text-sm text-slate-900">{lead.studentName || 'N/A'}</td>
                        <td className="px-6 py-4 text-sm text-slate-600">{lead.studentLocation || 'N/A'}</td>
                        <td className="px-6 py-4 text-sm text-slate-600">{lead.studentPhone || 'N/A'}</td>
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
        </>
      )}
    </AdminLayout>
  );
}
