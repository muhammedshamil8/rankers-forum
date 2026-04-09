'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { Loader2, AlertTriangle, GraduationCap, Phone, ChevronDown, Building2 } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { useAuth, useRequireAuth } from '@/lib/hooks';
import { useQuery } from '@tanstack/react-query';
import { INDIAN_STATES } from '@/lib/constants';
import { LogoutModal } from '@/components/modals';
import Image from 'next/image';

interface College {
  id: string;
  collegeName: string;
  collegeLocation: string;
  collegeType: string;
  courseName: string;
  quota: string;
  category: string;
  openingRank?: number;
  rank: number;
  year: number;
  chance: 'high' | 'moderate' | 'low';
}

export default function PreviousYearPage() {
  const router = useRouter();
  const { loading: authLoading } = useAuth();
  const { isAuthorized } = useRequireAuth(['student']);

  const [logoutOpen, setLogoutOpen] = useState(false);
  const [activeTab, setActiveTab] = useState<'government' | 'private' | 'deemed'>('government');
  const [stateFilter, setStateFilter] = useState('all');
  const [expandedCollege, setExpandedCollege] = useState<string | null>(null);

  // Fetch previous year data
  const { data, isLoading } = useQuery({
    queryKey: ['previous-year-colleges'],
    queryFn: async () => {
      const response = await fetch('/api/colleges/previous-year');
      if (!response.ok) throw new Error('Failed to fetch data');
      return response.json();
    },
    enabled: !!isAuthorized,
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

  // Deduplicate colleges (in case of overlap between colleges and otherColleges)
  const uniqueCollegesMap = new Map();
  const rawColleges = [
    ...(data?.cutoffsByYear ? Object.values(data.cutoffsByYear).flatMap((y: any) => [
      ...(y.colleges || []),
      ...(y.otherColleges || [])
    ]) : []),
    ...(data?.colleges || [])
  ];

  rawColleges.forEach((c: any) => {
    // Composite key of ID and Year to be safe, but mostly MongoDB ID is unique
    const uniqueKey = `${c.id || c._id}-${c.year || 2024}`;
    if (!uniqueCollegesMap.has(uniqueKey)) {
      uniqueCollegesMap.set(uniqueKey, {
        ...c,
        id: c.id || c._id,
        rank: Number(c.rank || c.closingRank || 0),
        courseName: (c.courseName || c.branch || '').toString(),
      });
    }
  });

  const colleges = Array.from(uniqueCollegesMap.values()) as College[];

  console.log("DEBUG: Total colleges received:", colleges.length);
  if (colleges.length > 0) {
    console.log("DEBUG: Sample college type:", colleges[0].collegeType);
  }

  const filteredColleges = colleges.filter((college: College) => {
    // Ultra-robust type matching
    let type = (college.collegeType || '').toLowerCase();
    let normalized = '';
    if (type.includes('govt') || type.includes('government')) normalized = 'government';
    else if (type.includes('private university') || type.includes('deemed')) normalized = 'deemed';
    else if (type.includes('private')) normalized = 'private';
    else normalized = type; // Fallback to raw type

    const matchesType = normalized === activeTab;
    const matchesState = stateFilter === 'all' || (college.collegeLocation && college.collegeLocation.includes(stateFilter));
    
    return matchesType && matchesState;
  });

  console.log(`DEBUG: Filtered colleges for tab ${activeTab}:`, filteredColleges.length);

  // Group by year
  const collegesByYear = filteredColleges.reduce((acc, college: College) => {
    // Fallback to year if data structure is nested or flat
    const year = college.year || 2024; 
    if (!acc[year]) acc[year] = [];
    acc[year].push(college);
    return acc;
  }, {} as Record<number, College[]>);

  const years = Object.keys(collegesByYear).map(Number).sort((a, b) => b - a);
  console.log("DEBUG: Years found:", years);

  const getChanceBadge = (chance: string) => {
    switch (chance) {
      case 'high':
        return <Badge className="bg-green-50 text-green-500 border-green-200 hover:bg-green-50 text-xs font-normal">High Chance</Badge>;
      case 'moderate':
        return <Badge className="bg-amber-50 text-amber-500 border-amber-200 hover:bg-amber-50 text-xs font-normal">Moderate Chance</Badge>;
      case 'low':
        return <Badge className="bg-slate-100 text-slate-500 border-slate-200 hover:bg-slate-100 text-xs font-normal">Low Chance</Badge>;
      default:
        return null;
    }
  };

  const getChanceIndicatorColor = (chance: string) => {
    switch (chance) {
      case 'high': return 'bg-green-500';
      case 'moderate': return 'bg-amber-500';
      case 'low': return 'bg-slate-400';
      default: return 'bg-slate-300';
    }
  };

  return (
    <div className="min-h-screen bg-white">
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Title and Filters */}
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-6">
          <div>
            <h1 className="text-2xl sm:text-[26px] font-medium text-slate-900">Previous Year Predictions</h1>
            <p className="text-amber-600 flex items-center gap-2 mt-1 text-xs">
              <AlertTriangle className="h-4 w-4" />
              The previous year college lists are generated using historical counselling data for the same rank and are for reference purpose only.
            </p>
          </div>

          <div className="flex items-center gap-2">
            <span className="text-sm text-slate-600">State</span>
            <Select value={stateFilter} onValueChange={setStateFilter}>
              <SelectTrigger className="w-48">
                <SelectValue placeholder="All States" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All States</SelectItem>
                {INDIAN_STATES.map((state) => (
                  <SelectItem key={state} value={state}>
                    {state}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </div>

        {/* Tabs */}
        <div className="flex border w-fit rounded-[8px] p-1 gap-2 mb-6">
          {[
            { value: 'government', label: 'Government' },
            { value: 'private', label: 'Private' },
            { value: 'deemed', label: 'Deemed' },
          ].map((tab) => (
            <button
              key={tab.value}
              onClick={() => setActiveTab(tab.value as typeof activeTab)}
              className={`px-5 py-2 rounded-[8px] cursor-pointer  text-xs md:text-sm font-medium transition-colors ${activeTab === tab.value
                ? 'bg-linear-to-r from-[#2F129B] to-[#3B82F6] text-white'
                : '   text-slate-600  hover:bg-white'
                }`}
            >
              {tab.label}
            </button>
          ))}
        </div>

        {/* Description */}
        <p className="text-slate-600 text-sm mb-6">Previous Year (Colleges you would have gotten with your current rank)</p>

        {/* Loading State */}
        {isLoading ? (
          <div className="flex items-center justify-center py-12">
            <Loader2 className="h-8 w-8 animate-spin text-indigo-600" />
          </div>
        ) : years.length > 0 ? (
          <div className="space-y-8">
            {years.map((year) => (
              <div key={year} className='border-l-4 rounded-[8px] border-[#4B5563] pl-3 md:pl-5 py-2'>
                {/* Year Header */}
                <h3 className=" text-[#1E1E1E] mb-4">{year}</h3>

                {/* College List */}
                <div className="space-y-2">
                  {collegesByYear[year].map((college: College) => (
                    <div
                      key={college.id}
                      className="bg-[#F9FAFB] rounded-xl border border-[#9FA6B2]/60 overflow-hidden"
                    >
                      <div className="grid gap-y-4 lg:grid-cols-2 p-3 md:p-5">

                        {/* College Info */}

                        <div className="flex-1 flex justify-between  h-full ">
                          <div className='flex flex-col justify-center'>

                            <h3 className="font-semibold text-[#4B5563] text-sm">{college.collegeName}</h3>
                            <p className="text-[#4B5563] text-sm">{college.collegeLocation}</p>
                          </div>
                          {/* Actions */}
                          <div className="md:hidden flex flex-col items-center gap-2 ml-6">
                            {getChanceBadge(college.chance)}
                            <button
                              onClick={() => setExpandedCollege(expandedCollege === college.id ? null : college.id)}
                              className="flex items-center gap-1 rounded-[8px] cursor-pointer
                            py-1 px-2  border-2 border-[#3B82F6]/80  text-xs text-indigo-600 hover:text-indigo-700"
                            >
                              <Image src="/fileIcon.svg" alt="fileIcon" width={20} height={20} />
                              View Details
                            </button>
                          </div>
                        </div>

                        <div className='flex items-center  h-full justify-between'>
                          {/* Details Grid */}
                          <div className=" h-full  grid grid-cols-4 gap-1 md:gap-3 
                          text-center">
                            <div className='bg-[#E7EAEE] rounded-lg p-1 md:p-2 px-3 h-full'>
                              <p className=" text-[11px] md:text-xs text-slate-400 mb-1">Category</p>
                              <p className="text-sm font-medium text-slate-700">{college.category?.toUpperCase() || 'N/A'}</p>
                            </div>
                            <div className='bg-[#E7EAEE] rounded-lg p-1 md:p-2 px-3 h-full'>
                              <p className=" text-[11px] md:text-xs text-slate-400 mb-1">Quota</p>
                              <p className="text-sm font-medium text-slate-700">{college.quota === 'all_india' ? 'All India' : (college.quota || '').replace('_', ' ')}</p>
                            </div>
                            <div className='bg-[#E7EAEE] rounded-lg p-1 md:p-2 px-3 h-full'>
                              <p className=" text-[11px] md:text-xs text-slate-400 mb-1">Closing Rank</p>
                              <p className="text-sm font-medium text-slate-700">{college.rank?.toLocaleString() || 'N/A'}</p>
                            </div>
                            <div className='bg-[#E7EAEE] rounded-lg p-1 md:p-2 px-3 h-full'>
                              <p className=" text-[11px] md:text-xs text-slate-400 mb-1">Course</p>
                              <p className="text-sm font-medium text-slate-700">{(college.courseName || '').toUpperCase()}</p>
                            </div>
                          </div>

                          {/* Actions */}
                          <div className="hidden md:flex flex-col items-center gap-2 ml-6">
                            {getChanceBadge(college.chance)}
                            {/* <button
                              onClick={() => setExpandedCollege(expandedCollege === college.id ? null : college.id)}
                              className="flex items-center gap-1 rounded-[8px] cursor-pointer
                            py-1 px-2  border-2 border-[#3B82F6]/80  text-xs text-indigo-600 hover:text-indigo-700"
                            >
                              <Image src="/fileIcon.svg" alt="fileIcon" width={20} height={20} />
                              View Details
                            </button> */}
                          </div>
                        </div>
                      </div>

                      {/* Expanded Details */}
                      {expandedCollege === college.id && (
                        <div className="border-t border-slate-100 p-5 bg-slate-50">
                          <div className="grid sm:grid-cols-4 gap-4 text-sm">
                            <div>
                              <p className="text-slate-500">Category</p>
                              <p className="font-medium">{college.category?.toUpperCase() || 'N/A'}</p>
                            </div>
                            <div>
                              <p className="text-slate-500">Opening Rank</p>
                              <p className="font-medium">{college.openingRank ? college.openingRank.toLocaleString() : 'N/A'}</p>
                            </div>
                            <div>
                              <p className="text-slate-500">Closing Rank</p>
                              <p className="font-medium">{college.rank?.toLocaleString() || 'N/A'}</p>
                            </div>
                            <div>
                              <p className="text-slate-500">Quota</p>
                              <p className="font-medium">{college.quota === 'all_india' ? 'All India' : (college.quota || '').replace('_', ' ')}</p>
                            </div>
                          </div>
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div className="bg-white rounded-xl border border-slate-100 p-12 text-center">
            <Building2 className="h-12 w-12 text-slate-300 mx-auto mb-4" />
            <p className="text-slate-500">No previous year data available.</p>
          </div>
        )}

        {/* Back Link */}
        <div className="mt-8">
          <button
            onClick={() => router.back()}
            className="text-indigo-600 hover:text-indigo-700 font-medium"
          >
            ← Back to Current Year Results
          </button>
        </div>
      </main>

      <LogoutModal open={logoutOpen} onOpenChange={setLogoutOpen} />
    </div>
  );
}
