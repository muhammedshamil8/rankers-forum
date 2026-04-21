'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { Loader2, Plus, Ticket, CheckCircle2, XCircle, Search } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { AdminLayout } from '@/components/layout/AdminLayout';
import { useRequireAuth } from '@/lib/hooks';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { TableShimmer } from '@/components/ui/table-shimmer';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import { Badge } from '@/components/ui/badge';

interface ReferralCode {
  id: string;
  code: string;
  description: string;
  isActive: boolean;
  createdAt: string;
}

export default function ReferralCodesPage() {
  const router = useRouter();
  const { isAuthorized, loading: authLoading } = useRequireAuth(['super_admin']);
  const queryClient = useQueryClient();
  
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [newCode, setNewCode] = useState('');
  const [description, setDescription] = useState('');
  const [searchQuery, setSearchQuery] = useState('');
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  // Fetch codes
  const { data, isLoading } = useQuery({
    queryKey: ['referral-codes'],
    queryFn: async () => {
      const response = await fetch('/api/admin/referral-codes');
      if (!response.ok) throw new Error('Failed to fetch referral codes');
      return response.json();
    },
    enabled: !!isAuthorized,
  });

  // Create mutation
  const createMutation = useMutation({
    mutationFn: async (payload: { code: string; description: string }) => {
      const response = await fetch('/api/admin/referral-codes', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });
      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || 'Failed to create code');
      }
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['referral-codes'] });
      setIsModalOpen(false);
      setNewCode('');
      setDescription('');
    },
  });

  // Toggle status mutation
  const toggleMutation = useMutation({
    mutationFn: async ({ id, isActive }: { id: string; isActive: boolean }) => {
      const response = await fetch('/api/admin/referral-codes', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ id, isActive }),
      });
      if (!response.ok) throw new Error('Update failed');
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['referral-codes'] });
    },
  });

  useEffect(() => {
    if (!authLoading && !isAuthorized) {
      router.push('/');
    }
  }, [authLoading, isAuthorized, router]);

  const codes: ReferralCode[] = data?.codes || [];
  const filteredCodes = codes.filter(c => 
    c.code.toLowerCase().includes(searchQuery.toLowerCase()) || 
    c.description.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const handleCreate = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newCode.trim()) return;
    createMutation.mutate({ code: newCode, description });
  };

  return (
    <AdminLayout
      title="Referral Codes"
      actions={
        <Button onClick={() => setIsModalOpen(true)} className="bg-indigo-600 hover:bg-indigo-700">
          <Plus className="h-4 w-4 mr-2" />
          Create Code
        </Button>
      }
    >
      {(authLoading || !isAuthorized) ? (
        <div className="min-h-[400px] flex items-center justify-center">
          <Loader2 className="h-8 w-8 animate-spin text-indigo-600" />
        </div>
      ) : (
        <>
          <div className="mb-6 max-w-md relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
            <Input
              placeholder="Search codes or descriptions..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-10"
            />
          </div>

          <div className="bg-white rounded-xl border border-slate-100 overflow-hidden shadow-sm">
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="bg-[#2F129B] text-white text-sm">
                    <th className="text-left px-6 py-4 font-medium">Referral Code</th>
                    <th className="text-left px-6 py-4 font-medium">Description</th>
                    <th className="text-left px-6 py-4 font-medium text-center">Status</th>
                    <th className="text-left px-6 py-4 font-medium">Created On</th>
                    <th className="text-right px-6 py-4 font-medium">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {isLoading ? (
                    <TableShimmer rows={5} columns={5} />
                  ) : filteredCodes.length === 0 ? (
                    <tr>
                      <td colSpan={5} className="px-6 py-12 text-center text-slate-500">
                        No referral codes found.
                      </td>
                    </tr>
                  ) : (
                    filteredCodes.map((item) => (
                      <tr key={item.id} className="hover:bg-slate-50 transition-colors">
                        <td className="px-6 py-4 font-bold text-slate-900 tracking-wider">
                          <code className="bg-slate-100 px-2 py-1 rounded text-indigo-700">{item.code}</code>
                        </td>
                        <td className="px-6 py-4 text-sm text-slate-600 max-w-xs truncate">
                          {item.description || '—'}
                        </td>
                        <td className="px-6 py-4 text-center">
                          <Badge className={item.isActive ? 'bg-green-100 text-green-700 hover:bg-green-100 border-none' : 'bg-slate-100 text-slate-500 hover:bg-slate-100 border-none'}>
                            {item.isActive ? 'Active' : 'Inactive'}
                          </Badge>
                        </td>
                        <td className="px-6 py-4 text-sm text-slate-500">
                          {mounted ? new Date(item.createdAt).toLocaleDateString() : '--/--/----'}
                        </td>
                        <td className="px-6 py-4 text-right">
                          <div className="flex justify-end">
                            <Switch
                              checked={item.isActive}
                              onCheckedChange={(val: boolean) => toggleMutation.mutate({ id: item.id, isActive: val })}
                              disabled={toggleMutation.isPending}
                            />
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

      <Dialog open={isModalOpen} onOpenChange={setIsModalOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Create New Referral Code</DialogTitle>
          </DialogHeader>
          <form onSubmit={handleCreate} className="space-y-4 pt-4">
            <div className="space-y-2">
              <Label htmlFor="code">Code (Uppercase)</Label>
              <Input
                id="code"
                placeholder="e.g. WELCOME2024"
                value={newCode}
                onChange={(e) => setNewCode(e.target.value.toUpperCase())}
                required
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="desc">Description</Label>
              <Input
                id="desc"
                placeholder="e.g. For new direct students"
                value={description}
                onChange={(e) => setDescription(e.target.value)}
              />
            </div>
            {createMutation.error && (
              <p className="text-sm text-red-600">{createMutation.error.message}</p>
            )}
            <div className="flex justify-end gap-3 pt-4 border-t">
              <Button type="button" variant="outline" onClick={() => setIsModalOpen(false)}>
                Cancel
              </Button>
              <Button type="submit" disabled={createMutation.isPending}>
                {createMutation.isPending ? 'Creating...' : 'Create Code'}
              </Button>
            </div>
          </form>
        </DialogContent>
      </Dialog>
    </AdminLayout>
  );
}
