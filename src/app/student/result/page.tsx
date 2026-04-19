'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import Image from 'next/image';
import {
  Loader2,
  AlertTriangle,
  Building2,
  Settings,
  ChevronDown,
  ChevronUp,
  Save,
  ArrowRight
} from 'lucide-react';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { Skeleton } from '@/components/ui/skeleton';
import { Badge } from '@/components/ui/badge';
import { useAuth, useRequireAuth } from '@/lib/hooks';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { INDIAN_STATES, COUNSELLING_TYPES } from '@/lib/constants';
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

/**
 * Robust college type normalizer — handles all variants from DB
 */
function normalizeCollegeType(raw: string): 'government' | 'private' | 'deemed' | string {
  const t = (raw || '').toLowerCase().trim();
  if (t.includes('govt') || t.includes('government')) return 'government';
  if (t.includes('private university') || t.includes('deemed')) return 'deemed';
  if (t.includes('private')) return 'private';
  return t;
}

export default function StudentResultPage() {
  const router = useRouter();
  const { loading: authLoading } = useAuth();
  const { isAuthorized } = useRequireAuth(['student']);

  const [logoutOpen, setLogoutOpen] = useState(false);
  const [activeTab, setActiveTab] = useState('government');
  const [stateFilter, setStateFilter] = useState('all');
  const [resultData, setResultData] = useState<ResultData | null>(null);
  const [expandedCollege, setExpandedCollege] = useState<string | null>(null);
  const [showPreferences, setShowPreferences] = useState(true);
  const [hasInitializedPreferences, setHasInitializedPreferences] = useState(true);
  const [apiError, setApiError] = useState<string | null>(null);
  
  const queryClient = useQueryClient();

  // Preferences local state
  const [prefs, setPrefs] = useState({
    counsellingType: '',
    preferredBranch: '',
    preference1: '',
    preference2: 'none',
    preference3: 'none',
  });

  // 1. Try to get data from sessionStorage first
  useEffect(() => {
    const stored = sessionStorage.getItem('collegeResult');
    if (stored) {
      try {
        const parsed = JSON.parse(stored);
        if (parsed && ((parsed.colleges && parsed.colleges.length > 0) || (parsed.otherColleges && parsed.otherColleges.length > 0))) {
          setResultData(parsed);
        } else {
          sessionStorage.removeItem('collegeResult');
        }
      } catch {
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

  // Sync preferences from profile
  useEffect(() => {
    if (profileData?.student) {
      const { counsellingType, preferredBranch, locationPreference1, locationPreference2, locationPreference3 } = profileData.student;
      setPrefs({
        counsellingType: counsellingType || '',
        preferredBranch: preferredBranch || '',
        preference1: locationPreference1 || '',
        preference2: locationPreference2 || 'none',
        preference3: locationPreference3 || 'none',
      });

      // Logic: If no preferences saved (new user), start with panel OPEN (Problem FIX)
      if (!hasInitializedPreferences) {
        if (!counsellingType && !locationPreference1) {
          setShowPreferences(true);
        } else {
          setShowPreferences(false);
        }
        setHasInitializedPreferences(true);
      }
    }
  }, [profileData, hasInitializedPreferences]);

  // Fetch available locations
  const { data: locationsData, isLoading: locationsLoading } = useQuery<{ locations: string[] }>({
    queryKey: ['locations'],
    queryFn: async () => {
      const response = await fetch('/api/colleges/locations');
      if (!response.ok) throw new Error('Failed to fetch locations');
      return response.json();
    },
  });
  const locations = locationsData?.locations || [];

  // Branch options
  const branches = ['MBBS', 'BDS'];

  // Update preferences mutation
  const updatePrefsMutation = useMutation({
    mutationFn: async (updatedPrefs: typeof prefs) => {
      const resp = await fetch('/api/students/profile', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          // Preserve existing academic info from profileData
          marks: profileData?.student?.marks,
          rank: profileData?.student?.rank,
          yearOfPassing: profileData?.student?.yearOfPassing,
          category: profileData?.student?.category,
          gender: profileData?.student?.gender,
          institution: profileData?.student?.institution,
          domicileState: profileData?.student?.domicileState,
          referralCode: profileData?.student?.referralCode,
          // Update values
          counsellingType: updatedPrefs.counsellingType,
          preferredBranch: updatedPrefs.preferredBranch,
          locationPreference1: updatedPrefs.preference1,
          locationPreference2: updatedPrefs.preference2 === 'none' ? '' : updatedPrefs.preference2,
          locationPreference3: updatedPrefs.preference3 === 'none' ? '' : updatedPrefs.preference3,
          isProfileComplete: true,
        }),
      });
      if (!resp.ok) throw new Error('Failed to update preferences');
      return resp.json();
    },
    onSuccess: async () => {
      // Invalidate both profile and colleges to trigger total re-fetch
      await Promise.all([
        queryClient.invalidateQueries({ queryKey: ['student-profile'] }),
        queryClient.invalidateQueries({ queryKey: ['eligible-colleges-direct'] })
      ]);
      // Close preferences panel smoothly
      setShowPreferences(false);
    },
    onError: (error) => {
      setApiError(error instanceof Error ? error.message : 'Failed to update preferences');
    }
  });

  const counsellingType = profileData?.student?.counsellingType || 'all_india';

  // Determine tabs based on counselling type (Problem 15)
  const getTabs = () => {
    if (counsellingType === 'state') {
      return [
        { value: 'government', label: 'Govt' },
        { value: 'private', label: 'Private' },
        { value: 'management', label: 'Management' },
        { value: 'nri', label: 'NRI' },
      ];
    } else if (counsellingType === 'deemed') {
      return [
        { value: 'aiq', label: 'All India Quota' },
        { value: 'paid', label: 'Deemed/paid seats' },
        { value: 'nri', label: 'NRI' },
      ];
    } else {
      // All India Counselling (Default)
      return [
        { value: 'government', label: 'Government' },
        { value: 'private', label: 'Private' },
        { value: 'deemed', label: 'Deemed' },
        { value: 'nri', label: 'NRI' },
      ];
    }
  };

  const tabs = getTabs();

  // Set initial tab if current one isn't in new tabs list
  useEffect(() => {
    if (tabs.length > 0 && !tabs.find(t => t.value === activeTab)) {
      setActiveTab(tabs[0].value);
    }
  }, [counsellingType, tabs, activeTab]);

  // Normalize seat type for filtering
  const normalizeSeatType = (quota: string, collegeType: string): string => {
    const q = (quota || '').toLowerCase();
    const t = (collegeType || '').toLowerCase();
    
    if (q.includes('nri')) return 'nri';
    if (q.includes('mgmt') || q.includes('management') || q.includes('mng')) return 'management';
    if (q.includes('paid') || (t.includes('deemed') && q.includes('deemed'))) return 'paid';
    if (q.includes('aiq') || q.includes('all india')) return 'aiq';
    if (q.includes('govt') || t.includes('government')) return 'government';
    if (q.includes('priv') || t.includes('private')) return 'private';
    if (t.includes('deemed')) return 'paid';
    
    return t || 'government';
  };

  // 3. Fetch results if not in session
  const { 
    data: fetchedResults, 
    isLoading: isFetchingResults, 
    refetch: refetchColleges,
    error: queryError
  } = useQuery<ResultData>({
    queryKey: ['eligible-colleges-direct', profileData?.student?.domicileState, profileData?.student?.preferredBranch, profileData?.student?.counsellingType],
    queryFn: async () => {
      setApiError(null);
      if (!profileData?.student) throw new Error('Student profile not found');
      
      const params = new URLSearchParams({
        domicileState: profileData.student.domicileState || '',
        track: 'true', // Increment checks on first view or change
      });
      const resp = await fetch(`/api/colleges/eligible?${params}`);
      if (resp.status === 403) {
        throw new Error('Maximum college checks reached (10/10). Please contact support to increase your limit.');
      }
      if (!resp.ok) throw new Error('Failed to retrieve college predictions.');
      return resp.json();
    },
    enabled: !!isAuthorized && !!profileData?.student,
    staleTime: 60000,
  });

  // Handle Query Errors (v5 replacement for onError)
  useEffect(() => {
    if (queryError instanceof Error) {
      setApiError(queryError.message);
    }
  }, [queryError]);

  useEffect(() => {
    if (fetchedResults) {
      setResultData(fetchedResults);
      // Scroll to top of list area when results update
      const listElement = document.getElementById('college-list-top');
      if (listElement) {
        listElement.scrollIntoView({ behavior: 'smooth', block: 'start' });
      }
    }
  }, [fetchedResults]);

  const isBusy = authLoading || (isAuthorized && !resultData && (isProfileLoading || isFetchingResults));

  // Redirect if absolutely no profile found (not just loading)
  useEffect(() => {
    if (!isBusy && isAuthorized && !profileData?.student && !isProfileLoading) {
      const timer = setTimeout(() => {
        router.push('/student/info');
      }, 3000);
      return () => clearTimeout(timer);
    }
  }, [isBusy, isAuthorized, profileData, isProfileLoading, router]);

  if (isBusy) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-white">
        <Loader2 className="h-8 w-8 animate-spin text-indigo-600" />
      </div>
    );
  }

  if (!resultData && !apiError) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-white">
        <div className="text-center">
          <Loader2 className="h-8 w-8 animate-spin text-indigo-600 mx-auto" />
          <p className="mt-4 text-slate-500 font-medium">Retrieving your predictions...</p>
        </div>
      </div>
    );
  }

  // Deduplicate and merge colleges
  const uniqueCollegesMap = new Map();
  const rawColleges = resultData ? [...(resultData.colleges || []), ...(resultData.otherColleges || [])] : [];
  
  rawColleges.forEach((c: any) => {
    if (!uniqueCollegesMap.has(c.id)) {
      uniqueCollegesMap.set(c.id, {
        ...c,
        rank: Number(c.rank || c.closingRank || 0),
        courseName: (c.courseName || c.branch || '').toString(),
      });
    }
  });

  const allColleges = Array.from(uniqueCollegesMap.values()) as College[];

  const filteredColleges = allColleges.filter(college => {
    const normalized = normalizeSeatType(college.quota || '', college.collegeType);
    const matchesType = normalized === activeTab;
    const matchesState = stateFilter === 'all' || (college.collegeLocation && college.collegeLocation.includes(stateFilter));
    return matchesType && matchesState;
  });

  const displayYear = resultData?.currentYear || resultData?.year || new Date().getFullYear();

  // Problem 16: User-friendly category mapping
  const formatCategory = (cat: string): string => {
    if (!cat) return 'N/A';
    const c = cat.toUpperCase();
    const mappings: Record<string, string> = {
      'GM': 'General Merit',
      'GMH': 'General Merit (Hyd-Kar)',
      'OPN': 'Open',
      'SC': 'Scheduled Caste',
      'ST': 'Scheduled Tribe',
      'OBC': 'Other Backward Class',
      'EWS': 'Economically Weaker Section',
      'AIQ': 'All India Quota',
      'MNG': 'Management',
      'NRI': 'Non-Resident Indian'
    };
    return mappings[c] || c;
  };

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

  return (
    <div className="min-h-screen bg-white animate-page">
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Title and Filters */}
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-6">
          <div>
            <h1 className="text-2xl sm:text-[26px] font-medium text-slate-900">My Eligible College List</h1>
            <p className="text-amber-600 flex items-center gap-2 mt-1 text-xs">
              <AlertTriangle className="h-4 w-4" />
              The college list is generated using historical counselling data and is for reference purpose only.
            </p>
          </div>

          <div className="flex items-center gap-2">
            <span className="text-sm text-slate-600">State</span>
            <Select value={stateFilter} onValueChange={setStateFilter} >
              <SelectTrigger className="w-48 cursor-pointer">
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

        {apiError && (
          <div className="mb-6 p-4 bg-red-50 border border-red-200 rounded-xl flex items-start gap-3">
            <AlertTriangle className="h-5 w-5 text-red-500 shrink-0 mt-0.5" />
            <div>
              <p className="text-sm font-semibold text-red-800">Prediction Limit Reached</p>
              <p className="text-xs text-red-600 mt-1">{apiError}</p>
            </div>
          </div>
        )}

        {/* Dynamic Preferences Form (Problem 12) */}
        <div className="mb-8 overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm transition-all duration-300">
          <button 
            onClick={() => setShowPreferences(!showPreferences)}
            className="flex w-full items-center justify-between p-4 px-6 text-left hover:bg-slate-50 transition-colors cursor-pointer z-10 relative"
          >
            <div className="flex items-center gap-3">
              <div className="bg-indigo-50 p-2 rounded-lg text-indigo-600">
                <Settings className="h-5 w-5" />
              </div>
              <div>
                <h2 className="text-base font-semibold text-slate-800 font-outfit">Course and Location Preferences</h2>
                <p className="text-xs text-slate-500">Update these to change your college predictions</p>
              </div>
            </div>
            <div className={`transition-transform duration-300 ${showPreferences ? 'rotate-180' : ''}`}>
              <ChevronDown className="h-5 w-5 text-slate-400" />
            </div>
          </button>

          <div 
            className={`grid transition-all duration-500 ease-in-out ${showPreferences ? 'grid-rows-[1fr] opacity-100' : 'grid-rows-[0fr] opacity-0'}`}
          >
            <div className="overflow-hidden">
              <div className="p-6 px-8 border-t border-slate-100 bg-white space-y-6">
                <div className="grid sm:grid-cols-2 gap-6">
                  {/* Counselling Type */}
                  <div className="space-y-2">
                    <Label className="text-slate-700">Counselling Type</Label>
                    <Select 
                      value={prefs.counsellingType} 
                      onValueChange={(val) => setPrefs(prev => ({ ...prev, counsellingType: val }))}
                    >
                      <SelectTrigger className="h-12 border-slate-200 rounded-xl focus:ring-indigo-500">
                        <SelectValue placeholder="Select Counselling Type" />
                      </SelectTrigger>
                      <SelectContent>
                        {COUNSELLING_TYPES.map((type) => (
                          <SelectItem key={type.value} value={type.value}>{type.label}</SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>

                  {/* Branch */}
                  <div className="space-y-2">
                    <Label className="text-slate-700">Preferred Branch</Label>
                    <Select 
                      value={prefs.preferredBranch} 
                      onValueChange={(val) => setPrefs(prev => ({ ...prev, preferredBranch: val }))}
                    >
                      <SelectTrigger className="h-12 border-slate-200 rounded-xl focus:ring-indigo-500">
                        <SelectValue placeholder="Select Branch" />
                      </SelectTrigger>
                      <SelectContent>
                        {branches.map(b => (
                          <SelectItem key={b} value={b}>{b}</SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                </div>

                {/* Locations */}
                <div className="space-y-3">
                  <Label className="text-slate-700">Interested Study Locations</Label>
                  <div className="grid sm:grid-cols-3 gap-4">
                    <Select value={prefs.preference1} onValueChange={(val) => setPrefs(prev => ({ ...prev, preference1: val }))}>
                      <SelectTrigger className="h-12 border-slate-200 rounded-xl focus:ring-indigo-500">
                        <SelectValue placeholder="1st Preference" />
                      </SelectTrigger>
                      <SelectContent>
                        {locations.map(loc => (
                          <SelectItem key={loc} value={loc}>{loc}</SelectItem>
                        ))}
                      </SelectContent>
                    </Select>

                    <Select value={prefs.preference2} onValueChange={(val) => setPrefs(prev => ({ ...prev, preference2: val }))}>
                      <SelectTrigger className="h-12 border-slate-200 rounded-xl focus:ring-indigo-500">
                        <SelectValue placeholder="2nd Preference" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="none">Not Specified</SelectItem>
                        {locations.map(loc => (
                          <SelectItem key={loc} value={loc}>{loc}</SelectItem>
                        ))}
                      </SelectContent>
                    </Select>

                    <Select value={prefs.preference3} onValueChange={(val) => setPrefs(prev => ({ ...prev, preference3: val }))}>
                      <SelectTrigger className="h-12 border-slate-200 rounded-xl focus:ring-indigo-500">
                        <SelectValue placeholder="3rd Preference" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="none">Not Specified</SelectItem>
                        {locations.map(loc => (
                          <SelectItem key={loc} value={loc}>{loc}</SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                </div>

                {/* Action Button */}
                <div className="flex justify-end pt-2">
                  <Button 
                    onClick={() => updatePrefsMutation.mutate(prefs)}
                    disabled={updatePrefsMutation.isPending}
                    className="h-12 bg-linear-to-r from-[#2F129B] to-[#6366F1] rounded-xl px-8 shadow-md hover:shadow-lg transition-all"
                  >
                    {updatePrefsMutation.isPending ? (
                      <>
                        <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                        Updating Predictions...
                      </>
                    ) : (
                      <>
                        <Save className="mr-2 h-4 w-4" />
                        Update Predictions
                      </>
                    )}
                  </Button>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Tabs — dynamic and responsive */}
        <div id="college-list-top" className="flex items-center justify-between gap-4 mb-6">
          <div className="flex border w-full sm:w-fit overflow-x-auto no-scrollbar rounded-[8px] p-1 gap-2">
            {tabs.map((tab) => (
              <button
                key={tab.value}
                onClick={() => setActiveTab(tab.value)}
                className={`px-4 py-2 rounded-[8px] cursor-pointer text-xs md:text-sm font-medium transition-colors whitespace-nowrap ${
                  activeTab === tab.value
                    ? 'bg-linear-to-r from-[#2F129B] to-[#3B82F6] text-white'
                    : 'text-slate-600 hover:bg-slate-50'
                }`}
              >
                {tab.label}
              </button>
            ))}
          </div>

          <div className="hidden md:flex items-center gap-2 px-4 py-2 bg-slate-50 border border-slate-100 rounded-lg shrink-0">
            <span className="text-xs text-slate-400 font-medium uppercase tracking-wider">Viewing Results For:</span>
            <span className="text-sm font-semibold text-indigo-600 bg-indigo-50 px-2 py-1 rounded">
              {profileData?.student?.preferredBranch || 'All'}
            </span>
          </div>
        </div>

        {/* Background loading pulse */}
        {isFetchingResults && resultData && (
          <div className="mb-4 flex items-center gap-2 text-indigo-600 animate-pulse">
            <Loader2 className="h-4 w-4 animate-spin" />
            <span className="text-xs font-medium">Refreshing predictions...</span>
          </div>
        )}

        {/* Year label */}
        <p className="text-slate-600 text-sm mb-6">
          Current Year Predictions — <span className="font-medium">{displayYear}</span>
        </p>

        {/* College List */}
        {filteredColleges.length > 0 ? (
          <div className="space-y-4">
            {filteredColleges.map((college) => (
              <div
                key={college.id}
                className="bg-[#F9FAFB] rounded-xl border border-[#9FA6B2]/60 overflow-hidden"
              >
                <div className="grid gap-y-4 lg:grid-cols-2 p-3 md:p-5">

                  {/* College Info */}
                  <div className="flex-1 flex justify-between h-full">
                    <div className="flex flex-col justify-center">
                      <h3 className="font-semibold text-[#4B5563] text-sm">{college.collegeName?.replace(/,,/g, ',')}</h3>
                      <p className="text-[#4B5563] text-sm">{college.collegeLocation?.replace(/,,/g, ',')}</p>
                    </div>
                    {/* Actions — mobile */}
                    <div className="md:hidden flex flex-col items-center gap-2 ml-6">
                      {getChanceBadge(college.chance)}
                    </div>
                  </div>

                  <div className="flex items-center h-full justify-between">
                    {/* Details Grid */}
                    <div className="h-full grid grid-cols-4 gap-1 md:gap-3 text-center flex-1">
                      <div className="bg-[#E7EAEE] rounded-lg p-1 md:p-2 px-3 h-full">
                        <p className="text-[10px] md:text-xs text-slate-400 mb-1">allotted category</p>
                        <p className="text-[12px] md:text-sm font-medium text-slate-700">{formatCategory(college.category || '')}</p>
                      </div>
                      <div className="bg-[#E7EAEE] rounded-lg p-1 md:p-2 px-3 h-full">
                        <p className="text-[10px] md:text-xs text-slate-400 mb-1">Quota</p>
                        <p className="text-[12px] md:text-sm font-medium text-slate-700">
                          {college.quota === 'all_india' ? 'All India' : (college.quota || '').replace('_', ' ') || 'All India'}
                        </p>
                      </div>
                      <div className="bg-[#E7EAEE] rounded-lg p-1 md:p-2 px-3 h-full">
                        <p className="text-[10px] md:text-xs text-slate-400 mb-1">Closing Rank</p>
                        <p className="text-[12px] md:text-sm font-medium text-slate-700">{college.rank?.toLocaleString() || 'N/A'}</p>
                      </div>
                      <div className="bg-[#E7EAEE] rounded-lg p-1 md:p-2 px-3 h-full">
                        <p className="text-[10px] md:text-xs text-slate-400 mb-1">Course</p>
                        <p className="text-[12px] md:text-sm font-medium text-slate-700">{(college.courseName || '').toUpperCase()}</p>
                      </div>
                    </div>

                    {/* Actions — desktop */}
                    <div className="hidden md:flex flex-col items-center gap-2 ml-6">
                      {getChanceBadge(college.chance)}
                    </div>
                  </div>
                </div>

                {/* Expanded Details - optional for future details if needed */}
                {expandedCollege === college.id && (
                  <div className="border-t border-slate-100 p-5 bg-slate-50">
                    <div className="grid sm:grid-cols-4 gap-4 text-sm">
                      <div>
                        <p className="text-slate-500">allotted category</p>
                        <p className="font-medium">{formatCategory(college.category || '')}</p>
                      </div>
                      <div>
                        <p className="text-slate-500">Chance</p>
                        <p className="font-medium capitalize">{college.chance || 'N/A'}</p>
                      </div>
                      <div>
                        <p className="text-slate-500">Closing Rank</p>
                        <p className="font-medium">{college.rank?.toLocaleString() || 'N/A'}</p>
                      </div>
                      <div>
                        <p className="text-slate-500">Quota</p>
                        <p className="font-medium">
                          {college.quota === 'all_india' ? 'All India' : (college.quota || '').replace('_', ' ') || 'All India'}
                        </p>
                      </div>
                    </div>
                  </div>
                )}
              </div>
            ))}
          </div>
        ) : (
          <div className="bg-white rounded-xl border border-slate-100 p-12 text-center">
            <Building2 className="h-12 w-12 text-slate-300 mx-auto mb-4" />
            <p className="text-slate-500">No colleges found matching your criteria.</p>
            <p className="text-slate-400 text-sm mt-1">Try switching tabs or removing the state filter.</p>
          </div>
        )}

        {/* Back Link */}
        <div className="mt-8 flex items-center justify-between">
          <button
            onClick={() => router.push('/student/info')}
            className="text-indigo-600 hover:text-indigo-700 font-medium text-sm"
          >
            ← Back to My Info
          </button>
          <Link href="/student/previous-year" className="text-indigo-600 font-medium text-sm underline">
            View Previous Year Reference
          </Link>
        </div>
      </main>

      <LogoutModal open={logoutOpen} onOpenChange={setLogoutOpen} />
    </div>
  );
}
