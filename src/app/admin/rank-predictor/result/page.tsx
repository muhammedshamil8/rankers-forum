'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { AdminLayout } from '@/components/layout';
import { useAuth, useRequireAuth } from '@/lib/hooks';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { 
  Loader2, 
  Search, 
  X, 
  Save, 
  MapPin, 
  Building2, 
  AlertTriangle,
  ArrowLeft,
  Settings2,
  Trophy
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { CollegeType } from '@/types';
import { CURRENT_YEAR } from '@/lib/constants';

interface College {
  id: string;
  collegeName: string;
  courseName: string;
  category: string;
  quota: string;
  state: string;
  closingRank: number;
  rank?: number; // Some APIs might return it as rank
  year: number;
  collegeType: string;
  location?: string;
  fees?: string;
  chance?: string;
  chanceLabel?: string;
}

export default function AdminRankResultPage() {
  const router = useRouter();
  const queryClient = useQueryClient();
  const { isAuthorized } = useRequireAuth(['admin', 'super_admin']);

  const [activeTab, setActiveTab] = useState('government');
  const [stateFilter, setStateFilter] = useState('all');
  const [searchFilter, setSearchFilter] = useState('');
  
  const [prefs, setPrefs] = useState({
    rank: '',
    category: '',
    counsellingType: '',
    preferredBranch: '',
    preference1: 'none',
    preference2: 'none',
    preference3: 'none',
  });

  const [search1, setSearch1] = useState('');
  const [search2, setSearch2] = useState('');
  const [search3, setSearch3] = useState('');
  const [searchState, setSearchState] = useState('');

  const { data: profileData, isLoading: isProfileLoading } = useQuery({
    queryKey: ['student-profile'],
    queryFn: async () => {
      const resp = await fetch('/api/students/profile');
      if (!resp.ok) return null;
      return resp.json();
    },
    enabled: !!isAuthorized,
  });

  useEffect(() => {
    if (profileData?.student) {
      const s = profileData.student;
      setPrefs({
        rank: s.rank?.toString() || '',
        category: s.category || '',
        counsellingType: s.counsellingType || '',
        preferredBranch: s.preferredBranch || '',
        preference1: s.locationPreference1 || 'none',
        preference2: s.locationPreference2 || 'none',
        preference3: s.locationPreference3 || 'none',
      });
    }
  }, [profileData]);

  const { data: resultData, isLoading: isFetchingResults } = useQuery({
    queryKey: ['college-results', profileData?.student?.rank, profileData?.student?.category],
    queryFn: async () => {
      const params = new URLSearchParams({ track: 'false' });
      if (activeTab) params.append('tab', activeTab);
      
      const resp = await fetch(`/api/colleges/eligible?${params}`);
      if (!resp.ok) throw new Error('Failed to fetch results');
      return resp.json();
    },
    enabled: !!profileData?.student && !!isAuthorized,
  });

  const { data: locationsData } = useQuery<{ locations: string[] }>({
    queryKey: ['college-locations'],
    queryFn: async () => {
      const resp = await fetch('/api/colleges/locations');
      if (!resp.ok) return { locations: [] };
      return resp.json();
    },
  });
  const availableLocations = locationsData?.locations || [];

  const updatePrefsMutation = useMutation({
    mutationFn: async (updatedPrefs: typeof prefs) => {
      const resp = await fetch('/api/students/profile', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          rank: parseInt(updatedPrefs.rank),
          category: updatedPrefs.category,
          counsellingType: updatedPrefs.counsellingType,
          preferredBranch: updatedPrefs.preferredBranch,
          locationPreference1: updatedPrefs.preference1 === 'none' ? '' : updatedPrefs.preference1,
          locationPreference2: updatedPrefs.preference2 === 'none' ? '' : updatedPrefs.preference2,
          locationPreference3: updatedPrefs.preference3 === 'none' ? '' : updatedPrefs.preference3,
          isProfileComplete: true,
          // Defaults for mandatory fields
          score: profileData?.student?.score || 0,
          yearOfPassing: profileData?.student?.yearOfPassing || CURRENT_YEAR,
          gender: profileData?.student?.gender || 'other',
          institution: profileData?.student?.institution || 'Admin',
        }),
      });
      if (!resp.ok) throw new Error('Update failed');
      return resp.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['student-profile'] });
      queryClient.invalidateQueries({ queryKey: ['college-results'] });
    },
  });

  if (!isAuthorized || isProfileLoading) {
    return (
      <AdminLayout title="Predictor Results">
        <div className="flex flex-col items-center justify-center min-h-[400px]">
          <Loader2 className="h-8 w-8 animate-spin text-indigo-600 mb-4" />
          <p className="text-slate-500">Loading your predictions...</p>
        </div>
      </AdminLayout>
    );
  }

  const colleges: College[] = resultData?.colleges || [];
  const otherColleges: College[] = resultData?.otherColleges || [];
  const displayColleges = colleges.concat(otherColleges);

  const filteredColleges = displayColleges.filter(c => {
    const matchesState = stateFilter === 'all' || c.state === stateFilter;
    const matchesSearch = c.collegeName.toLowerCase().includes(searchFilter.toLowerCase()) || 
                         c.state.toLowerCase().includes(searchFilter.toLowerCase());
    return matchesState && matchesSearch;
  });

  const tabs = [
    { label: 'Government', value: 'government' },
    { label: 'Private', value: 'private' },
    { label: 'Deemed', value: 'deemed' },
  ];

  return (
    <AdminLayout 
      title="Predictor Results"
      actions={
        <Button variant="outline" onClick={() => router.push('/admin/rank-predictor')} className="rounded-xl border-slate-200">
          <ArrowLeft className="mr-2 h-4 w-4" />
          Change Rank
        </Button>
      }
    >
      <div className="space-y-6">
        {/* Current Search Banner */}
        <div className="bg-[#2F129B] rounded-2xl p-6 text-white shadow-lg overflow-hidden relative">
          <div className="absolute right-0 top-0 h-full w-1/3 bg-linear-to-l from-white/10 to-transparent pointer-events-none" />
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-6 relative z-10">
            <div className="flex items-center gap-4">
              <div className="w-14 h-14 bg-white/20 rounded-2xl flex items-center justify-center backdrop-blur-sm border border-white/30">
                <Trophy className="h-7 w-7 text-white" />
              </div>
              <div>
                <p className="text-white/70 text-sm font-medium uppercase tracking-wider">Predicting for Rank</p>
                <p className="text-3xl font-bold">{profileData?.student?.rank?.toLocaleString() || 'N/A'}</p>
              </div>
            </div>
            
            <div className="flex flex-wrap gap-3">
              <div className="px-4 py-2 bg-white/10 border border-white/20 rounded-xl backdrop-blur-sm">
                <p className="text-[10px] text-white/60 uppercase">Category</p>
                <p className="text-sm font-bold">{profileData?.student?.category?.toUpperCase() || 'N/A'}</p>
              </div>
              <div className="px-4 py-2 bg-white/10 border border-white/20 rounded-xl backdrop-blur-sm">
                <p className="text-[10px] text-white/60 uppercase">Course</p>
                <p className="text-sm font-bold">{profileData?.student?.preferredBranch || 'MBBS'}</p>
              </div>
              <div className="px-4 py-2 bg-white/10 border border-white/20 rounded-xl backdrop-blur-sm">
                <p className="text-[10px] text-white/60 uppercase">Type</p>
                <p className="text-sm font-bold">{profileData?.student?.counsellingType === 'all_india' ? 'All India' : 'State'}</p>
              </div>
            </div>
          </div>
        </div>

        {/* Preference Editor & Results */}
        <div className="grid lg:grid-cols-3 gap-6">
          {/* Quick Pref Sidebar */}
          <div className="lg:col-span-1">
            <div className="bg-white rounded-2xl border border-slate-100 shadow-sm p-6 sticky top-24">
              <div className="flex items-center gap-2 mb-6">
                <Settings2 className="h-5 w-5 text-indigo-600" />
                <h2 className="font-semibold text-slate-800 tracking-tight">Quick Preferences</h2>
              </div>
              
              <div className="space-y-5">
                {[1, 2, 3].map(i => {
                  const search = i === 1 ? search1 : i === 2 ? search2 : search3;
                  const setSearch = i === 1 ? setSearch1 : i === 2 ? setSearch2 : setSearch3;
                  const val = i === 1 ? prefs.preference1 : i === 2 ? prefs.preference2 : prefs.preference3;
                  const setVal = (v: string) => setPrefs(prev => ({ ...prev, [`preference${i}`]: v }));
                  
                  return (
                    <div key={i} className="space-y-2">
                      <Label className="text-xs text-slate-500 ml-1">Preference {i}</Label>
                      <Select value={val} onValueChange={setVal}>
                        <SelectTrigger className="h-11 border-slate-100 bg-slate-50 rounded-xl text-sm">
                          <SelectValue placeholder="All India" />
                        </SelectTrigger>
                        <SelectContent className="max-h-[300px]">
                          <div className="p-2 pb-0">
                            <div className="relative">
                              <Search className="absolute left-2 top-2.5 h-4 w-4 text-slate-400" />
                              <Input 
                                placeholder="Search location..." 
                                value={search}
                                onChange={(e) => setSearch(e.target.value)}
                                className="pl-8 h-9 text-sm"
                              />
                            </div>
                          </div>
                          <SelectItem value="none">All India</SelectItem>
                          {availableLocations.filter(loc => loc.toLowerCase().includes(search.toLowerCase())).map(loc => (
                            <SelectItem key={loc} value={loc}>{loc}</SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>
                  );
                })}

                <Button 
                  className="w-full bg-[#2F129B] hover:bg-[#2F129B]/90 h-11 rounded-xl shadow-sm"
                  onClick={() => updatePrefsMutation.mutate(prefs)}
                  disabled={updatePrefsMutation.isPending}
                >
                  {updatePrefsMutation.isPending ? (
                    <Loader2 className="h-4 w-4 animate-spin" />
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

          {/* Results List */}
          <div className="lg:col-span-2 space-y-6">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
              <div className="flex p-1 bg-slate-100 rounded-xl gap-1 overflow-x-auto no-scrollbar">
                {tabs.map(tab => (
                  <button
                    key={tab.value}
                    onClick={() => setActiveTab(tab.value)}
                    className={`px-5 py-2 rounded-lg text-xs font-semibold whitespace-nowrap transition-all ${
                      activeTab === tab.value 
                      ? 'bg-white text-[#2F129B] shadow-sm' 
                      : 'text-slate-500 hover:text-slate-700'
                    }`}
                  >
                    {tab.label}
                  </button>
                ))}
              </div>

              <div className="relative w-full sm:w-64">
                <Search className="absolute left-3 top-2.5 h-4 w-4 text-slate-400" />
                <Input 
                  placeholder="Filter results..." 
                  value={searchFilter}
                  onChange={(e) => setSearchFilter(e.target.value)}
                  className="pl-9 h-10 border-slate-200 bg-white rounded-xl text-sm"
                />
              </div>
            </div>

            {filteredColleges.length > 0 ? (
              <div className="space-y-4">
                {filteredColleges.map((college) => (
                  <div key={college.id} className="bg-white rounded-2xl border border-slate-100 p-5 shadow-xs hover:shadow-md transition-all group">
                    <div className="flex flex-col md:flex-row justify-between gap-4">
                      <div className="space-y-2">
                        <div className="flex items-center gap-2">
                          <Building2 className="h-4 w-4 text-indigo-600" />
                          <h3 className="font-bold text-slate-800 leading-tight group-hover:text-indigo-600 transition-colors">
                            {college.collegeName}
                          </h3>
                        </div>
                        <div className="flex flex-wrap gap-y-2 gap-x-4 text-sm text-slate-500">
                          <span className="flex items-center gap-1.5">
                            <MapPin className="h-3.5 w-3.5" />
                            {college.state}
                          </span>
                          <span className="bg-slate-50 text-slate-600 px-2.5 py-0.5 rounded-full text-xs font-semibold border border-slate-100">
                            {college.courseName}
                          </span>
                          <span className="bg-indigo-50 text-indigo-700 px-2.5 py-0.5 rounded-full text-xs font-semibold border border-indigo-100">
                            {college.collegeType.charAt(0).toUpperCase() + college.collegeType.slice(1)}
                          </span>
                          <span className="bg-slate-100 text-slate-700 px-2.5 py-0.5 rounded-full text-xs font-bold border border-slate-200">
                             Category: {college.category}
                          </span>
                          <span className="bg-slate-100 text-slate-700 px-2.5 py-0.5 rounded-full text-xs font-bold border border-slate-200">
                             Quota: {college.quota}
                          </span>
                        </div>
                        
                        {college.chanceLabel && (
                          <div className="mt-2">
                             <span className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-lg text-xs font-bold border ${
                               college.chance === 'high' 
                               ? 'bg-green-50 text-green-700 border-green-100' 
                               : college.chance === 'moderate'
                               ? 'bg-amber-50 text-amber-700 border-amber-100'
                               : 'bg-orange-50 text-orange-700 border-orange-100'
                             }`}>
                               <div className={`w-1.5 h-1.5 rounded-full ${
                                 college.chance === 'high' ? 'bg-green-500' : college.chance === 'moderate' ? 'bg-amber-500' : 'bg-orange-500'
                               }`} />
                               {college.chanceLabel}
                             </span>
                          </div>
                        )}
                      </div>
                      
                      <div className="flex flex-row md:flex-col items-center md:items-end justify-between md:justify-center border-t md:border-t-0 md:border-l border-slate-50 pt-4 md:pt-0 md:pl-6 min-w-[120px]">
                        <p className="text-[10px] text-slate-400 font-bold uppercase md:mb-1">Closing Rank</p>
                        <p className="text-xl font-black text-[#2F129B] tabular-nums">
                          {(college.closingRank || (college as any).rank)?.toLocaleString() || 'N/A'}
                        </p>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="bg-white rounded-2xl border border-dashed border-slate-200 p-16 flex flex-col items-center text-center">
                <div className="w-16 h-16 bg-slate-50 rounded-full flex items-center justify-center mb-4">
                  <AlertTriangle className="h-8 w-8 text-slate-300" />
                </div>
                <p className="text-slate-500 font-medium">No colleges found matching your criteria.</p>
                <p className="text-slate-400 text-sm mt-1">Try adjusting your rank or changing the filters.</p>
              </div>
            )}
          </div>
        </div>
      </div>
    </AdminLayout>
  );
}
