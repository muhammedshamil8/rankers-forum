'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { Loader2, AlertTriangle, ChevronDown, Building2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
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

interface College {
  id: string;
  collegeName: string;
  collegeLocation: string;
  collegeType: string;
  courseName: string;
  quota: string;
  category: string;
  rank: number;
  chance: 'high' | 'moderate' | 'low';
  year?: number;
}

interface ResultData {
  colleges: College[];
  otherColleges?: College[];
  year?: number;
  currentYear?: number;
  rank: number;
}

export default function StudentResultPage() {
  const router = useRouter();
  const { loading: authLoading } = useAuth();
  const { isAuthorized } = useRequireAuth(['student']);

  const [logoutOpen, setLogoutOpen] = useState(false);
  const [activeTab, setActiveTab] = useState<'government' | 'private' | 'deemed'>('government');
  const [stateFilter, setStateFilter] = useState('all');
  const [resultData, setResultData] = useState<ResultData | null>(null);
  const [expandedCollege, setExpandedCollege] = useState<string | null>(null);

  // 1. Try to get data from sessionStorage first
  useEffect(() => {
    const stored = sessionStorage.getItem('collegeResult');
    if (stored) {
      try {
        const parsed = JSON.parse(stored);
        if (parsed && ((parsed.colleges && parsed.colleges.length > 0) || (parsed.otherColleges && parsed.otherColleges.length > 0))) {
          setResultData(parsed);
          console.log("DEBUG: Valid result found in session:", parsed.colleges?.length);
        } else {
          console.log("DEBUG: Session data empty/invalid, ignoring");
          sessionStorage.removeItem('collegeResult');
        }
      } catch (error) {
        console.error("DEBUG: Session parse error:", error);
        sessionStorage.removeItem('collegeResult');
      }
    }
  }, []);

  // 2. Fetch profile
  const { data: profileData, isLoading: isProfileLoading } = useQuery({
    queryKey: ['student-profile'],
    queryFn: async () => {
      const resp = await fetch('/api/students/profile');
      if (!resp.ok) return null;
      return resp.json();
    },
    enabled: !!isAuthorized,
  });

  // 3. Fetch results if not in session
  const { data: fetchedResults, isLoading: isFetchingResults } = useQuery({
    queryKey: ['eligible-colleges-direct', profileData?.student?.domicileState],
    queryFn: async () => {
      console.log("DEBUG: Fetching results from API for", profileData.student.domicileState);
      const params = new URLSearchParams({
        domicileState: profileData.student.domicileState,
      });
      const resp = await fetch(`/api/colleges/eligible?${params}`);
      if (!resp.ok) throw new Error('API Failed');
      return resp.json();
    },
    enabled: !!isAuthorized && !!profileData?.student && (!resultData || (resultData.colleges?.length === 0 && resultData.otherColleges?.length === 0)),
    staleTime: 60000, // 1 minute
  });

  useEffect(() => {
    if (fetchedResults && !resultData) {
      setResultData(fetchedResults);
    }
  }, [fetchedResults, resultData]);

  const isBusy = authLoading || (isAuthorized && !resultData && (isProfileLoading || isFetchingResults));

  // Redirect if absolutely no data found after loading
  useEffect(() => {
    if (!isBusy && isAuthorized && !resultData && !isFetchingResults && !isProfileLoading) {
      const timer = setTimeout(() => {
         if (!resultData) router.push('/student/info');
      }, 5000);
      return () => clearTimeout(timer);
    }
  }, [isBusy, isAuthorized, resultData, isFetchingResults, isProfileLoading, router]);

  if (isBusy) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-slate-50">
        <Loader2 className="h-8 w-8 animate-spin text-indigo-600" />
      </div>
    );
  }

  if (!resultData) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-slate-50">
        <div className="text-center">
           <Loader2 className="h-8 w-8 animate-spin text-indigo-600 mx-auto" />
           <p className="mt-4 text-slate-500">Retrieving your predictions...</p>
        </div>
      </div>
    );
  }

  // Deduplicate colleges (in case of overlap between colleges and otherColleges)
  const uniqueCollegesMap = new Map();
  [...(resultData.colleges || []), ...(resultData.otherColleges || [])].forEach((c: any) => {
    if (!uniqueCollegesMap.has(c.id)) {
      uniqueCollegesMap.set(c.id, {
        ...c,
        rank: Number(c.rank || c.closingRank || 0),
        courseName: (c.courseName || c.branch || '').toString(),
      });
    }
  });

  const allColleges = Array.from(uniqueCollegesMap.values());

  const filteredColleges = allColleges.filter(college => {
    let type = (college.collegeType || '').toLowerCase();
    let normalized = '';
    if (type.includes('govt') || type.includes('government')) normalized = 'government';
    else if (type.includes('private university') || type.includes('deemed')) normalized = 'deemed';
    else if (type.includes('private')) normalized = 'private';
    else normalized = type;

    const matchesType = normalized === activeTab;
    const matchesState = stateFilter === 'all' || (college.collegeLocation && college.collegeLocation.includes(stateFilter));
    
    return matchesType && matchesState;
  });

  return (
    <div className="min-h-screen bg-slate-50">
      <main className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-6">
          <div>
            <h1 className="text-2xl sm:text-3xl font-bold text-slate-900">My Eligible College List</h1>
            <p className="text-amber-600 flex items-center gap-2 mt-1 text-sm">
              <AlertTriangle className="h-4 w-4" />
              Estimates based on past data.
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
                  <SelectItem key={state} value={state}>{state}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </div>

        <div className="flex gap-2 mb-6">
          {[
            { value: 'government', label: 'Government' },
            { value: 'private', label: 'Private' },
            { value: 'deemed', label: 'Deemed' },
          ].map((tab) => (
            <button
              key={tab.value}
              onClick={() => setActiveTab(tab.value as any)}
              className={`px-5 py-2 rounded-full text-sm font-medium transition-colors ${activeTab === tab.value
                ? 'bg-indigo-600 text-white'
                : 'bg-white text-slate-600 border border-slate-200 hover:bg-slate-50'
                }`}
            >
              {tab.label}
            </button>
          ))}
        </div>

        <p className="text-slate-600 mb-4">Year: {resultData.currentYear || resultData.year || '2024'}</p>

        {filteredColleges.length > 0 ? (
          <div className="space-y-4">
            {filteredColleges.map((college) => (
              <div key={college.id} className="bg-white rounded-xl border border-slate-100 overflow-hidden">
                <div className="flex items-center p-5">
                   <div className="flex-1">
                    <h3 className="font-semibold text-slate-900 text-lg">{college.collegeName}</h3>
                    <p className="text-slate-500 text-sm">{college.collegeLocation}</p>
                  </div>
                  <div className="hidden sm:grid grid-cols-3 gap-8 text-center px-4">
                    <div>
                      <p className="text-xs text-slate-400">Quota</p>
                      <p className="text-sm font-medium">{college.quota?.replace('_', ' ') || 'All India'}</p>
                    </div>
                    <div>
                      <p className="text-xs text-slate-400">Closing Rank</p>
                      <p className="text-sm font-medium">{college.rank.toLocaleString()}</p>
                    </div>
                    <div>
                      <p className="text-xs text-slate-400">Course</p>
                      <p className="text-sm font-medium">{college.courseName}</p>
                    </div>
                  </div>
                  <div className="flex flex-col items-end gap-2 ml-6">
                    <button
                      onClick={() => setExpandedCollege(expandedCollege === college.id ? null : college.id)}
                      className="flex items-center gap-1 text-sm text-indigo-600"
                    >
                      <ChevronDown className={`h-4 w-4 ${expandedCollege === college.id ? 'rotate-180' : ''}`} />
                      Details
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div className="bg-white rounded-xl border border-slate-100 p-12 text-center text-slate-500">
            <Building2 className="h-12 w-12 mx-auto mb-4 opacity-20" />
            No colleges found matching your criteria.
          </div>
        )}

        <div className="mt-8 text-right">
          <Link href="/student/previous-year" className="text-indigo-600 font-medium underline">
             View Previous Year Reference
          </Link>
        </div>
      </main>
      <LogoutModal open={logoutOpen} onOpenChange={setLogoutOpen} />
    </div>
  );
}
