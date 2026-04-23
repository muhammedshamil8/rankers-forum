'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { AdminLayout } from '@/components/layout';
import { useRequireAuth } from '@/lib/hooks';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { 
  Loader2, 
  ArrowRight, 
  ArrowLeft, 
  Search, 
  X,
  Target,
  MapPin,
  Settings2
} from 'lucide-react';
import { useQuery, useMutation } from '@tanstack/react-query';
import { NEET_CATEGORIES, COUNSELLING_TYPES, CURRENT_YEAR } from '@/lib/constants';

export default function AdminRankPredictorPage() {
  const router = useRouter();
  const { isAuthorized } = useRequireAuth(['admin', 'super_admin']);
  
  const [step, setStep] = useState(1);
  const [formData, setFormData] = useState({
    rank: '',
    category: '',
    counsellingType: 'all_india',
    preferredBranch: 'MBBS',
    preference1: '',
    preference2: '',
    preference3: '',
  });

  const [search1, setSearch1] = useState('');
  const [search2, setSearch2] = useState('');
  const [search3, setSearch3] = useState('');

  const { data: locationsData } = useQuery<{ locations: string[] }>({
    queryKey: ['college-locations'],
    queryFn: async () => {
      const resp = await fetch('/api/colleges/locations');
      if (!resp.ok) return { locations: [] };
      return resp.json();
    },
  });
  const availableLocations = locationsData?.locations || [];

  const submitMutation = useMutation({
    mutationFn: async (data: typeof formData) => {
      const response = await fetch('/api/students/profile', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          score: 0,
          rank: parseInt(data.rank),
          yearOfPassing: CURRENT_YEAR,
          category: data.category,
          gender: 'other',
          institution: 'Admin',
          domicileState: '',
          counsellingType: data.counsellingType,
          preferredBranch: data.preferredBranch,
          locationPreference1: data.preference1 === 'none' ? '' : data.preference1,
          locationPreference2: data.preference2 === 'none' ? '' : data.preference2,
          locationPreference3: data.preference3 === 'none' ? '' : data.preference3,
          isProfileComplete: true,
        }),
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || 'Failed to initialize predictor');
      }
      return response.json();
    },
    onSuccess: () => {
      router.push('/admin/rank-predictor/result');
    },
  });

  if (!isAuthorized) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-slate-50">
        <Loader2 className="h-8 w-8 animate-spin text-indigo-600" />
      </div>
    );
  }

  const handleNext = () => {
    if (formData.rank && formData.category) {
      setStep(2);
    }
  };

  const handlePredict = () => {
    submitMutation.mutate(formData);
  };

  return (
    <AdminLayout title="Rank Predictor">
      <div className="max-w-4xl mx-auto space-y-8 py-6">
        {/* Progress Stepper */}
        <div className="flex items-center justify-center gap-4 mb-8">
          <div className="flex items-center gap-2">
            <div className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-bold ${step >= 1 ? 'bg-[#2F129B] text-white' : 'bg-slate-200 text-slate-500'}`}>1</div>
            <span className={`text-sm font-medium ${step >= 1 ? 'text-[#2F129B]' : 'text-slate-500'}`}>Basic Info</span>
          </div>
          <div className="w-12 h-px bg-slate-200" />
          <div className="flex items-center gap-2">
            <div className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-bold ${step >= 2 ? 'bg-[#2F129B] text-white' : 'bg-slate-200 text-slate-500'}`}>2</div>
            <span className={`text-sm font-medium ${step >= 2 ? 'text-[#2F129B]' : 'text-slate-500'}`}>Preferences</span>
          </div>
        </div>

        <div className="bg-white rounded-2xl shadow-sm border border-slate-100 overflow-hidden">
          <div className="p-8">
            {step === 1 ? (
              <div className="space-y-6 animate-in fade-in slide-in-from-right-4 duration-300">
                <div className="flex items-center gap-3 mb-2">
                  <div className="p-2 bg-indigo-50 text-indigo-600 rounded-lg">
                    <Target className="h-5 w-5" />
                  </div>
                  <h2 className="text-xl font-semibold text-slate-900">Rank & Category</h2>
                </div>
                
                <div className="grid md:grid-cols-2 gap-6">
                  <div className="space-y-2">
                    <Label htmlFor="rank" className="text-slate-600">AIR Rank</Label>
                    <Input
                      id="rank"
                      type="number"
                      placeholder="Enter Student Rank"
                      className="h-12 border-slate-200 focus:border-indigo-500"
                      value={formData.rank}
                      onChange={(e) => setFormData({ ...formData, rank: e.target.value })}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label className="text-slate-600">Category</Label>
                    <Select value={formData.category} onValueChange={(val) => setFormData({ ...formData, category: val })}>
                      <SelectTrigger className="h-12 border-slate-200">
                        <SelectValue placeholder="Select Category" />
                      </SelectTrigger>
                      <SelectContent>
                        {NEET_CATEGORIES.map((cat) => (
                          <SelectItem key={cat.value} value={cat.value}>{cat.label}</SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                </div>

                <div className="pt-4 flex justify-end">
                  <Button 
                    onClick={handleNext}
                    disabled={!formData.rank || !formData.category}
                    className="h-12 bg-[#2F129B] hover:bg-[#2F129B]/90 px-8 rounded-xl font-medium"
                  >
                    Next Step
                    <ArrowRight className="ml-2 h-4 w-4" />
                  </Button>
                </div>
              </div>
            ) : (
              <div className="space-y-6 animate-in fade-in slide-in-from-right-4 duration-300">
                <div className="flex items-center gap-3 mb-2">
                  <div className="p-2 bg-indigo-50 text-indigo-600 rounded-lg">
                    <Settings2 className="h-5 w-5" />
                  </div>
                  <h2 className="text-xl font-semibold text-slate-900">Preferences</h2>
                </div>

                <div className="grid md:grid-cols-2 gap-6">
                  <div className="space-y-2">
                    <Label className="text-slate-600">Counselling Type</Label>
                    <Select value={formData.counsellingType} onValueChange={(val) => setFormData({ ...formData, counsellingType: val })}>
                      <SelectTrigger className="h-12 border-slate-200">
                        <SelectValue placeholder="Select Counselling" />
                      </SelectTrigger>
                      <SelectContent>
                        {COUNSELLING_TYPES.map((type) => (
                          <SelectItem key={type.value} value={type.value}>{type.label}</SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="space-y-2">
                    <Label className="text-slate-600">Preferred Branch</Label>
                    <Select value={formData.preferredBranch} onValueChange={(val) => setFormData({ ...formData, preferredBranch: val })}>
                      <SelectTrigger className="h-12 border-slate-200">
                        <SelectValue placeholder="Select Branch" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="MBBS">MBBS</SelectItem>
                        <SelectItem value="BDS">BDS</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>

                <div className="space-y-4">
                  <div className="flex items-center gap-2 mb-1">
                    <MapPin className="h-4 w-4 text-slate-400" />
                    <Label className="text-slate-600 font-medium">Location Preferences</Label>
                  </div>
                  <div className="grid md:grid-cols-3 gap-4">
                    {/* Location Selects (reusing logic from result page) */}
                    {[1, 2, 3].map((i) => {
                      const search = i === 1 ? search1 : i === 2 ? search2 : search3;
                      const setSearch = i === 1 ? setSearch1 : i === 2 ? setSearch2 : setSearch3;
                      const val = i === 1 ? formData.preference1 : i === 2 ? formData.preference2 : formData.preference3;
                      const setVal = (v: string) => setFormData(prev => ({ ...prev, [`preference${i}`]: v }));
                      
                      return (
                        <div key={i} className="space-y-1">
                          <span className="text-[10px] uppercase text-slate-400 font-bold ml-1">Preference {i}</span>
                          <Select value={val} onValueChange={setVal}>
                            <SelectTrigger className="h-11 border-slate-200 rounded-xl">
                              <SelectValue placeholder="All India" />
                            </SelectTrigger>
                            <SelectContent className="max-h-[300px]">
                              <div className="p-2 pb-0 sticky top-0 bg-white z-10">
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
                  </div>
                </div>

                <div className="pt-6 flex items-center justify-between">
                  <Button 
                    variant="outline"
                    onClick={() => setStep(1)}
                    className="h-12 px-6 rounded-xl border-slate-200 text-slate-600"
                  >
                    <ArrowLeft className="mr-2 h-4 w-4" />
                    Back
                  </Button>
                  <Button 
                    onClick={handlePredict}
                    disabled={submitMutation.isPending}
                    className="h-12 bg-linear-to-r from-[#2F129B] to-[#6366F1] px-10 rounded-xl font-medium shadow-md"
                  >
                    {submitMutation.isPending ? (
                      <>
                        <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                        Generating List...
                      </>
                    ) : (
                      <>
                        Show Predicted Colleges
                        <ArrowRight className="ml-2 h-4 w-4" />
                      </>
                    )}
                  </Button>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </AdminLayout>
  );
}
