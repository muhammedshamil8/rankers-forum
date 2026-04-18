'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { Loader2, Printer, Download, X, Phone, Users, Search } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
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
import { INDIAN_STATES } from '@/lib/constants';
import { TableShimmer } from '@/components/ui/table-shimmer';
import { Pagination } from '@/components/ui/pagination';
import { exportToExcel } from '@/lib/utils/excel-export';
import Image from 'next/image';


interface Student {
  id: string;
  userId: string;
  firstName: string;
  lastName: string;
  email: string;
  phone: string;
  city: string;
  state: string;
  rank: number;
  institution: string;
  yearOfPassout: number;
  domicileState: string;
  gender: string;
  category: string;
  counsellingType: string;
  preferredBranch: string;
  interestedLocations: string[];
  hasCallback: boolean;
  leadId?: string;
}

interface Lead {
  id: string;
  studentId: string;
  studentName: string;
  studentPhone: string;
  studentState: string;
  rank: number;
  course: string;
  status: string;
}

export default function StudentsPage() {
  const router = useRouter();
  const queryClient = useQueryClient();
  const { isAuthorized, loading: authLoading } = useRequireAuth(['super_admin']);

  const [activeTab, setActiveTab] = useState<'details' | 'callback'>('details');
  const [stateFilter, setStateFilter] = useState('all');
  const [selectedStudent, setSelectedStudent] = useState<Student | null>(null);
  const [detailsModalOpen, setDetailsModalOpen] = useState(false);
  const [assignModalOpen, setAssignModalOpen] = useState(false);
  const [selectedLead, setSelectedLead] = useState<Lead | null>(null);
  const [selectedAdminId, setSelectedAdminId] = useState<string>('');
  const [searchQuery, setSearchQuery] = useState('');
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage] = useState(10);

  // Fetch students
  const { data: studentsData, isLoading: studentsLoading } = useQuery({
    queryKey: ['admin-students', stateFilter],
    queryFn: async () => {
      const params = new URLSearchParams();
      if (stateFilter !== 'all') params.append('state', stateFilter);
      const response = await fetch(`/api/super-admin/students?${params}`);
      if (!response.ok) throw new Error('Failed to fetch students');
      return response.json();
    },
    enabled: !!isAuthorized && activeTab === 'details',
  });

  // Fetch callback requests
  const { data: leadsData, isLoading: leadsLoading } = useQuery({
    queryKey: ['callback-requests', stateFilter],
    queryFn: async () => {
      const params = new URLSearchParams();
      if (stateFilter !== 'all') params.append('state', stateFilter);
      params.append('status', 'new');
      const response = await fetch(`/api/admin/leads?${params}`);
      if (!response.ok) throw new Error('Failed to fetch leads');
      return response.json();
    },
    enabled: !!isAuthorized && activeTab === 'callback',
  });

  // Fetch admins for assignment
  const { data: adminsData } = useQuery({
    queryKey: ['available-admins'],
    queryFn: async () => {
      const response = await fetch('/api/super-admin/admins');
      if (!response.ok) throw new Error('Failed to fetch admins');
      return response.json();
    },
    enabled: !!isAuthorized && assignModalOpen,
  });

  // Assign lead mutation
  const assignMutation = useMutation({
    mutationFn: async ({ leadId, adminId }: { leadId: string; adminId: string }) => {
      if (!leadId) {
        throw new Error('Missing Callback ID. Please refresh the page.');
      }
      const response = await fetch(`/api/admin/leads/${leadId}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ assignedTo: adminId, status: 'assigned' }),
      });
      if (!response.ok) throw new Error('Failed to assign lead');
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['callback-requests'] });
      queryClient.invalidateQueries({ queryKey: ['admin-students'] });
      setAssignModalOpen(false);
      setSelectedLead(null);
      setSelectedAdminId('');
    },
  });

  useEffect(() => {
    if (!authLoading && !isAuthorized) {
      router.push('/');
    }
  }, [authLoading, isAuthorized, router]);

  const handleSearchChange = (value: string) => {
    setSearchQuery(value);
    setCurrentPage(1); // Reset to first page when search changes
  };
  const handlePrint = () => {
    window.print();
  };

  const handleExport = () => {
    const exportData = filteredStudents.map(student => ({
      'Name': `${student.firstName} ${student.lastName}`,
      'Email': student.email,
      'Phone': student.phone,
      'City': student.city,
      'State': student.state,
      'Rank': student.rank,
      'Category': student.category,
      'Passout Year': student.yearOfPassout,
      'Has Callback': student.hasCallback ? 'Yes' : 'No'
    }));
    
    exportToExcel(exportData, 'Students_List', 'Students');
  };
  const handleTabChange = (tab: 'details' | 'callback') => {
    setActiveTab(tab);
    setSearchQuery(''); // Clear search when tab changes
    setCurrentPage(1); // Reset to first page when tab changes
  };

  const students: Student[] = studentsData?.students || [];
  const leads: Lead[] = leadsData?.leads || [];
  const admins = adminsData?.admins || [];

  // Filter students based on search query
  const filteredStudents = students.filter((student) => {
    if (!searchQuery.trim()) return true;

    const query = searchQuery.toLowerCase();
    return (
      `${student.firstName} ${student.lastName}`.toLowerCase().includes(query) ||
      student.email?.toLowerCase().includes(query) ||
      student.phone?.toLowerCase().includes(query) ||
      student.city?.toLowerCase().includes(query) ||
      student.state?.toLowerCase().includes(query) ||
      student.rank?.toString().includes(query)
    );
  });

  // Filter leads based on search query
  const filteredLeads = leads.filter((lead) => {
    if (!searchQuery.trim()) return true;

    const query = searchQuery.toLowerCase();
    return (
      lead.studentName?.toLowerCase().includes(query) ||
      lead.studentPhone?.toLowerCase().includes(query) ||
      (lead as any).studentLocation?.toLowerCase().includes(query) ||
      (lead as any).preferredBranch?.toLowerCase().includes(query) ||
      (lead as any).rankUsed?.toString().includes(query)
    );
  });

  // Pagination calculations for students
  const studentsTotalItems = filteredStudents.length;
  const studentsTotalPages = Math.ceil(studentsTotalItems / itemsPerPage);
  const studentsStartIndex = (currentPage - 1) * itemsPerPage;
  const studentsEndIndex = studentsStartIndex + itemsPerPage;
  const paginatedStudents = filteredStudents.slice(studentsStartIndex, studentsEndIndex);

  // Pagination calculations for leads
  const leadsTotalItems = filteredLeads.length;
  const leadsTotalPages = Math.ceil(leadsTotalItems / itemsPerPage);
  const leadsStartIndex = (currentPage - 1) * itemsPerPage;
  const leadsEndIndex = leadsStartIndex + itemsPerPage;
  const paginatedLeads = filteredLeads.slice(leadsStartIndex, leadsEndIndex);

  // Reset to page 1 if current page is out of bounds
  useEffect(() => {
    const totalPages = activeTab === 'details' ? studentsTotalPages : leadsTotalPages;
    if (currentPage > totalPages && totalPages > 0) {
      setCurrentPage(1);
    }
  }, [currentPage, studentsTotalPages, leadsTotalPages, activeTab]);

  const handleViewDetails = (student: Student) => {
    setSelectedStudent(student);
    setDetailsModalOpen(true);
  };

  const handleAssignCallback = (lead: Lead) => {
    setSelectedLead(lead);
    setAssignModalOpen(true);
  };

  const handleAssignCallbackFromStudent = (student: Student) => {
    if (!student.hasCallback) return;

    // Construct a Lead object from Student data
    const lead: Lead = {
      id: student.leadId || '',
      studentId: student.id,
      studentName: `${student.firstName} ${student.lastName}`,
      studentPhone: student.phone,
      studentState: student.state,
      rank: student.rank,
      course: student.preferredBranch || '',
      status: 'pending'
    };

    setSelectedLead(lead);
    setAssignModalOpen(true);
  };

  return (
    <AdminLayout
      title="Students Details"
      actions={
        <div className="flex items-center gap-3">
          <Select value={stateFilter} onValueChange={setStateFilter}>
            <SelectTrigger className="w-48">
              <SelectValue placeholder="All States" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All States</SelectItem>
              {INDIAN_STATES.map((state) => (
                <SelectItem key={state} value={state}>{state}</SelectItem>
              ))}
            </SelectContent>
          </Select>
          <Button variant="outline" size="sm" onClick={handlePrint}>
            <Printer className="h-4 w-4 mr-2" />
            Print
          </Button>
          <Button variant="outline" size="sm" onClick={handleExport}>
            <Download className="h-4 w-4 mr-2" />
            Export
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
          {/* Tabs and Search Bar */}
          <div className="flex items-center justify-between gap-4 mb-6 flex-wrap print:hidden">
            {/* Tabs */}
            <div className="flex gap-4">
              <button
                onClick={() => handleTabChange('details')}
                className={`text-sm font-medium pb-2 border-b-2 transition-colors ${activeTab === 'details'
                  ? 'text-slate-900 border-indigo-600'
                  : 'text-slate-500 border-transparent hover:text-slate-700'
                  }`}
              >
                Students Details
              </button>
              <button
                onClick={() => handleTabChange('callback')}
                className={`text-sm font-medium pb-2 border-b-2 transition-colors ${activeTab === 'callback'
                  ? 'text-slate-900 border-indigo-600'
                  : 'text-slate-500 border-transparent hover:text-slate-700'
                  }`}
              >
                Callback Request
              </button>
            </div>

            {/* Search Bar */}
            <div className="relative max-w-2xl w-full max-w-[450px]">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-slate-400" />
              <Input
                type="text"
                placeholder={activeTab === 'details'
                  ? "Search by name, email, phone, location, or rank..."
                  : "Search by name, phone, state, course, or rank..."}
                value={searchQuery}
                onChange={(e: React.ChangeEvent<HTMLInputElement>) => handleSearchChange(e.target.value)}
                className="pl-10 pr-4 w-full"
              />
            </div>
          </div>
        </>
      )}

      {/* Print Only Title */}
      <div className="hidden print:block mb-8">
        <h2 className="text-2xl font-bold text-slate-900">
          {activeTab === 'details' ? 'Students List' : 'Callback Requests'}
        </h2>
        <p className="text-sm text-slate-500">Generated on {new Date().toLocaleDateString()}</p>
      </div>

      {/* Students Table */}
      {activeTab === 'details' && (
        <div className="bg-white rounded-xl border border-slate-100 overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="bg-[#2F129B] text-white text-sm rounded-t-2xl overflow-hidden">
                  <th className="text-left px-6 py-4 font-medium rounded-tl-2xl">Name</th>
                  <th className="text-left px-6 py-4 font-medium">Location</th>
                  <th className="text-left px-6 py-4 font-medium">Phone no.</th>
                  <th className="text-left px-6 py-4 font-medium">Email Id</th>
                  <th className="text-left px-6 py-4 font-medium">Rank</th>
                  <th className="text-left px-6 py-4 font-medium">Callback</th>
                  <th className="text-left px-6 py-4 font-medium rounded-tr-2xl">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {studentsLoading ? (
                  <TableShimmer rows={6} columns={7} />
                ) : filteredStudents.length === 0 ? (
                  <tr>
                    <td colSpan={7} className="px-6 py-16">
                      <div className="flex items-center justify-center min-h-96">
                        <p className="text-slate-500 text-sm">
                          {searchQuery
                            ? `No students found matching "${searchQuery}".`
                            : 'No students found.'}
                        </p>
                      </div>
                    </td>
                  </tr>
                ) : (
                  paginatedStudents.map((student) => (
                    <tr key={student.id} className="hover:bg-slate-50">
                      <td className="px-6 py-4 text-sm text-slate-900">
                        {student.firstName} {student.lastName}
                      </td>
                      <td className="px-6 py-4 text-sm text-slate-600">
                        {student.city}, {student.state}
                      </td>
                      <td className="px-6 py-4 text-sm text-slate-600">{student.phone}</td>
                      <td className="px-6 py-4 text-sm text-slate-600">{student.email}</td>
                      <td className="px-6 py-4 text-sm text-slate-600">{student.rank || '-'}</td>
                      <td className="px-6 py-4">
                        {student.hasCallback ? (
                          <Badge className="bg-[#EE7701] text-white border-0">Yes</Badge>
                        ) : (
                          <Badge className="bg-[#4B5563] text-white border-0">No</Badge>
                        )}
                      </td>
                      <td className="px-6 py-4">
                        <div className="flex items-center gap-4">
                          <button
                            onClick={() => handleViewDetails(student)}
                            className="text-indigo-600 hover:text-indigo-700 cursor-pointer"
                          >
                            <Image src="/details.svg" alt="Details" width={24} height={24} />
                          </button>
                          <button
                            onClick={() => student.hasCallback && handleAssignCallbackFromStudent(student)}
                            className={`text-slate-400 ${student.hasCallback ? 'cursor-pointer' : 'cursor-not-allowed'}  hover:text-slate-600`}
                          >
                            {
                              student.hasCallback ? (
                                  <Users className="h-5 w-5 text-blue-500" />
                               
                              ) : (
                               <Users className="h-5 w-5" />
                              )
                            }
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>

          {/* Pagination */}
          <div className="print:hidden">
            {!studentsLoading && filteredStudents.length > 0 && (
              <Pagination
                currentPage={currentPage}
                totalPages={studentsTotalPages}
                onPageChange={setCurrentPage}
                itemsPerPage={itemsPerPage}
                totalItems={studentsTotalItems}
              />
            )}
          </div>
        </div>
      )}

      {/* Callback Requests Table */}
      {activeTab === 'callback' && (
        <div className="bg-white rounded-xl border border-slate-100 overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="bg-[#2F129B] text-white text-sm rounded-t-2xl overflow-hidden">
                  <th className="text-left px-6 py-4 font-medium rounded-tl-2xl">Name</th>
                  <th className="text-left px-6 py-4 font-medium">State</th>
                  <th className="text-left px-6 py-4 font-medium">Phone no.</th>
                  <th className="text-left px-6 py-4 font-medium">Rank</th>
                  <th className="text-left px-6 py-4 font-medium">Course</th>
                  <th className="text-left px-6 py-4 font-medium">Status</th>
                  <th className="text-left px-6 py-4 font-medium rounded-tr-2xl">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {leadsLoading ? (
                  <TableShimmer rows={6} columns={7} />
                ) : filteredLeads.length === 0 ? (
                  <tr>
                    <td colSpan={7} className="px-6 py-16">
                      <div className="flex items-center justify-center min-h-96">
                        <p className="text-slate-500 text-sm">
                          {searchQuery
                            ? `No callback requests found matching "${searchQuery}".`
                            : 'No callback requests found.'}
                        </p>
                      </div>
                    </td>
                  </tr>
                ) : (
                  paginatedLeads.map((lead: any) => (
                    <tr key={lead.id} className="hover:bg-slate-50">
                      <td className="px-6 py-4 text-sm text-slate-900">{lead.studentName}</td>
                      <td className="px-6 py-4 text-sm text-slate-600">{lead.studentLocation}</td>
                      <td className="px-6 py-4 text-sm text-slate-600">{lead.studentPhone}</td>
                      <td className="px-6 py-4 text-sm text-slate-600">{lead.rankUsed}</td>
                      <td className="px-6 py-4 text-sm text-slate-600">{lead.preferredBranch}</td>
                      <td className="px-6 py-4">
                        <Badge className="bg-amber-50 text-amber-700 border-amber-200">
                          Not Assigned
                        </Badge>
                      </td>
                      <td className="px-6 py-4">
                        <div className="flex items-center gap-2">
                          <button
                            onClick={() => handleAssignCallback(lead)}
                            className="text-indigo-600 hover:text-indigo-700"
                          >
                            <Users className="h-5 w-5 text-blue-500" />
                          </button>
                          {/* <button className="text-slate-400 hover:text-slate-600">
                            <Download className="h-5 w-5" />
                          </button> */}
                        </div>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>

          {/* Pagination */}
          <div className="print:hidden">
            {!leadsLoading && filteredLeads.length > 0 && (
              <Pagination
                currentPage={currentPage}
                totalPages={leadsTotalPages}
                onPageChange={setCurrentPage}
                itemsPerPage={itemsPerPage}
                totalItems={leadsTotalItems}
              />
            )}
          </div>
        </div>
      )}

      {/* Student Details Modal */}
      <Dialog open={detailsModalOpen} onOpenChange={setDetailsModalOpen}>
        <DialogContent className="sm:max-w-lg">
          <DialogHeader>
            <DialogTitle>Student Details</DialogTitle>
          </DialogHeader>

          {selectedStudent && (
            <div className="space-y-6">
              {/* Basic and Academic Details */}
              <div>
                <h3 className="text-indigo-700 font-semibold mb-4">Basic and Academic Details</h3>
                <div className="grid grid-cols-2 gap-4 text-sm">
                  <div>
                    <p className="text-slate-500">Full Name</p>
                    <p className="font-medium">{selectedStudent.firstName} {selectedStudent.lastName}</p>
                  </div>
                  <div>
                    <p className="text-slate-500">Phone Number</p>
                    <p className="font-medium">+91 {selectedStudent.phone}</p>
                  </div>
                  <div>
                    <p className="text-slate-500">Email Address</p>
                    <p className="font-medium">{selectedStudent.email}</p>
                  </div>
                  <div>
                    <p className="text-slate-500">Location</p>
                    <p className="font-medium">{selectedStudent.city}, {selectedStudent.state}</p>
                  </div>
                  <div>
                    <p className="text-slate-500">Rank</p>
                    <p className="font-medium">{selectedStudent.rank || '-'}</p>
                  </div>
                  <div>
                    <p className="text-slate-500">Year of Passout</p>
                    <p className="font-medium">{selectedStudent.yearOfPassout || '-'}</p>
                  </div>
                  <div>
                    <p className="text-slate-500">Institute</p>
                    <p className="font-medium">{selectedStudent.institution || '-'}</p>
                  </div>
                  <div>
                    <p className="text-slate-500">Domicile State</p>
                    <p className="font-medium">{selectedStudent.domicileState || '-'}</p>
                  </div>
                  <div>
                    <p className="text-slate-500">Gender</p>
                    <p className="font-medium capitalize">{selectedStudent.gender || '-'}</p>
                  </div>
                  <div>
                    <p className="text-slate-500">Category</p>
                    <p className="font-medium uppercase">{selectedStudent.category || '-'}</p>
                  </div>
                </div>
              </div>

              {/* Course and Location Preference */}
              <div>
                <h3 className="text-indigo-700 font-semibold mb-4">Course and Location Preference</h3>
                <div className="grid grid-cols-2 gap-4 text-sm">
                  <div>
                    <p className="text-slate-500">Counselling Type</p>
                    <p className="font-medium">{selectedStudent.counsellingType === 'all_india' ? 'All India Counselling' : 'State Counselling'}</p>
                  </div>
                  <div>
                    <p className="text-slate-500">Preferred Branch</p>
                    <p className="font-medium uppercase">{selectedStudent.preferredBranch || '-'}</p>
                  </div>
                </div>
                <div className="mt-4">
                  <p className="text-slate-500 text-sm mb-2">Interested Study Locations</p>
                  <div className="grid grid-cols-3 gap-4 text-sm">
                    {selectedStudent.interestedLocations?.slice(0, 3).map((loc : any, i : any) => (
                      <div key={i}>
                        <p className="text-slate-400 text-xs">{i + 1}{i === 0 ? 'st' : i === 1 ? 'nd' : 'rd'} Preference</p>
                        <p className="font-medium">{loc}</p>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>

      {/* Assign Callback Modal */}
      <Dialog open={assignModalOpen} onOpenChange={setAssignModalOpen}>
        <DialogContent className="sm:max-w-md">
          {selectedLead && (
            <>
              <div className="bg-slate-50 rounded-lg p-4 mb-4">
                <p className="text-sm text-slate-500">Student Name</p>
                <p className="font-semibold text-slate-900">{selectedLead.studentName}</p>
                <p className="text-sm text-slate-500 mt-2">Location</p>
                <p className="text-slate-700">{selectedLead.studentState}</p>
              </div>

              <DialogHeader>
                <DialogTitle className="text-lg font-semibold text-slate-900 mb-2">Assign Callback Request</DialogTitle>
                <DialogDescription>
                  Select an admin to assign the callback request
                </DialogDescription>
              </DialogHeader>

              <div className="space-y-3 max-h-64 overflow-y-auto">
                {admins.map((admin: any) => (
                  <label
                    key={admin.id}
                    className={`flex items-center justify-between p-3 rounded-lg border cursor-pointer transition-colors ${selectedAdminId === admin.id
                      ? 'border-indigo-600 bg-indigo-50'
                      : 'border-slate-200 hover:bg-slate-50'
                      }`}
                  >
                    <div className="flex items-center gap-3">
                      <input
                        type="radio"
                        name="admin"
                        value={admin.id}
                        checked={selectedAdminId === admin.id}
                        onChange={() => setSelectedAdminId(admin.id)}
                        className="text-indigo-600"
                      />
                      <div>
                        <p className="font-medium text-slate-900">{admin.firstName} {admin.lastName}</p>
                        <p className="text-sm text-slate-500">{admin.email}</p>
                      </div>
                    </div>
                    <span className="text-sm text-slate-500">
                      {admin.profile?.currentActiveLeads || 0} active tasks
                    </span>
                  </label>
                ))}
              </div>

              <div className="flex gap-3 mt-6">
                <Button
                  variant="outline"
                  className="flex-1"
                  onClick={() => setAssignModalOpen(false)}
                >
                  Cancel
                </Button>
                <Button
                  className="flex-1"
                  onClick={() => selectedLead && assignMutation.mutate({ leadId: selectedLead.id, adminId: selectedAdminId })}
                  disabled={!selectedAdminId || assignMutation.isPending}
                >
                  {assignMutation.isPending ? (
                    <Loader2 className="h-4 w-4 animate-spin" />
                  ) : (
                    'Assign →'
                  )}
                </Button>
              </div>
            </>
          )}
        </DialogContent>
      </Dialog>
    </AdminLayout>
  );
}
