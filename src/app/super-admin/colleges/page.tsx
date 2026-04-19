'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { Loader2, Upload, Edit, Download, Search } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { AdminLayout } from '@/components/layout/AdminLayout';
import { useRequireAuth } from '@/lib/hooks';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { AVAILABLE_YEARS } from '@/lib/constants';
import { UploadDialog } from '@/components/modals/UploadDialog';
import { TableShimmer } from '@/components/ui/table-shimmer';
import { Pagination } from '@/components/ui/pagination';

interface College {
  id: string;
  collegeName: string;
  collegeLocation: string;
  type: string;
  courseName: string;
  category: string;
  rank: number;
  status: string;
}

export default function CollegePage() {
  const router = useRouter();
  const { isAuthorized, loading: authLoading } = useRequireAuth(['super_admin']);
  const queryClient = useQueryClient();
  
  const [selectedYear, setSelectedYear] = useState(new Date().getFullYear());
  const [uploadDialogOpen, setUploadDialogOpen] = useState(false);
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage] = useState(10);
  const [searchQuery, setSearchQuery] = useState('');

  const { data: collegesData, isLoading } = useQuery({
    queryKey: ['colleges', selectedYear],
    queryFn: async () => {
      const response = await fetch(`/api/super-admin/colleges?year=${selectedYear}`);
      if (!response.ok) throw new Error('Failed to fetch colleges');
      return response.json();
    },
    enabled: !!isAuthorized,
  });

  const handleYearChange = (year: number) => {
    setSelectedYear(year);
    setCurrentPage(1); // Reset to first page when year changes
    setSearchQuery(''); // Clear search when year changes
    // Invalidate and refetch the query for the new year
    queryClient.invalidateQueries({ queryKey: ['colleges', year] });
  };

  const handleSearchChange = (value: string) => {
    setSearchQuery(value);
    setCurrentPage(1); // Reset to first page when search changes
  };

  useEffect(() => {
    if (!authLoading && !isAuthorized) {
      router.push('/');
    }
  }, [authLoading, isAuthorized, router]);

  const colleges: College[] = collegesData?.cutoffs || [];
  
  // Filter colleges based on search query
  const filteredColleges = colleges.filter((college) => {
    if (!searchQuery.trim()) return true;
    
    const query = searchQuery.toLowerCase();
    return (
      college.collegeName?.toLowerCase().includes(query) ||
      college.courseName?.toLowerCase().includes(query) ||
      college.category?.toLowerCase().includes(query) ||
      college.collegeLocation?.toLowerCase().includes(query)
    );
  });
  
  // Pagination calculations
  const totalItems = filteredColleges.length;
  const totalPages = Math.ceil(totalItems / itemsPerPage);
  const startIndex = (currentPage - 1) * itemsPerPage;
  const endIndex = startIndex + itemsPerPage;
  const paginatedColleges = filteredColleges.slice(startIndex, endIndex);

  return (
    <AdminLayout
      title="College Details"
      actions={
        <div className="flex items-center gap-3">
          <Button variant="outline" size="sm" onClick={() => setUploadDialogOpen(true)}>
            <Upload className="h-4 w-4 mr-2" />
            Upload
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
          {/* Year Tabs and Search Bar */}
          <div className="flex items-center justify-between gap-4 mb-6 flex-wrap">
            {/* Year Tabs */}
            <div className="flex gap-4">
              {AVAILABLE_YEARS.map((year) => (
                <button
                  key={year}
                  onClick={() => handleYearChange(year)}
                  className={`text-sm font-medium pb-2 border-b-2 transition-colors ${
                    selectedYear === year
                      ? 'text-slate-900 border-indigo-600'
                      : 'text-slate-500 border-transparent hover:text-slate-700'
                  }`}
                >
                  {year}
                </button>
              ))}
            </div>

            {/* Search Bar */}
            <div className="relative max-w-2xl  w-full max-w-[450px]">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-slate-400" />
              <Input
                type="text"
                placeholder="Search by college name,  course name, category, or location..."
                value={searchQuery}
                onChange={(e) => handleSearchChange(e.target.value)}
                className="pl-10 pr-4 w-full"
              />
            </div>
          </div>

          {/* Colleges Table */}
          <div className="bg-white rounded-xl border border-slate-100 overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="bg-[#2F129B] text-white text-sm rounded-t-2xl overflow-hidden">
                    <th className="text-left px-6 py-4 font-medium rounded-tl-2xl">College Name</th>
                    <th className="text-left px-6 py-4 font-medium">Category</th>
                    <th className="text-left px-6 py-4 font-medium">Rank</th>
                    <th className="text-left px-6 py-4 font-medium rounded-tr-2xl">Course Name</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {isLoading ? (
                    <TableShimmer rows={6} columns={4} hasActionsColumn={false} />
                  ) : filteredColleges.length === 0 ? (
                    <tr>
                      <td colSpan={4} className="px-6 py-16">
                        <div className="flex items-center justify-center min-h-96">
                          <p className="text-slate-500 text-sm">
                            {searchQuery 
                              ? `No colleges found matching "${searchQuery}".` 
                              : `No colleges found for ${selectedYear}.`}
                          </p>
                        </div>
                      </td>
                    </tr>
                  ) : (
                    paginatedColleges.map((college, index) => (
                      <tr key={`${college.id}-${index}`} className="hover:bg-slate-50">
                        <td className="px-6 py-4 text-sm text-slate-900">{college.collegeName}</td>
                        <td className="px-6 py-4 text-sm text-slate-600">{college.category}</td>
                        <td className="px-6 py-4 text-sm text-slate-600">{college.rank}</td>
                        <td className="px-6 py-4 text-sm text-slate-600 uppercase">{college.courseName}</td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
            
            {/* Pagination */}
            {!isLoading && filteredColleges.length > 0 && (
              <Pagination
                currentPage={currentPage}
                totalPages={totalPages}
                onPageChange={setCurrentPage}
                itemsPerPage={itemsPerPage}
                totalItems={totalItems}
              />
            )}
          </div>
        </>
      )}
      
      {/* Upload Dialog */}
      <UploadDialog open={uploadDialogOpen} onOpenChange={setUploadDialogOpen} />
    </AdminLayout>
  );
}
