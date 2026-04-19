'use client';

import { useState, useEffect, useRef } from 'react';
import { useRouter } from 'next/navigation';
import { useFormik } from 'formik';
import * as Yup from 'yup';
import { Loader2, AlertTriangle, ArrowRight } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { Checkbox } from '@/components/ui/checkbox';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { useAuth, useRequireAuth, getRedirectUrl } from '@/lib/hooks';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { Skeleton } from '@/components/ui/skeleton';
import {
  NEET_CATEGORIES,
  QUOTA_TYPES,
  INDIAN_STATES,
  GENDERS,
  COUNSELLING_TYPES,
} from '@/lib/constants';
import { LogoutModal } from '@/components/modals';

// Validation schemas for each step
const basicDetailsSchema = Yup.object({
  marks: Yup.number()
    .typeError('Marks must be a number')
    .min(0, 'Minimum marks is 0')
    .max(720, 'Maximum marks is 720')
    .required('Marks is required'),
  rank: Yup.string()
    .required('NEET All India Rank is required')
    .matches(/^[0-9]+$/, 'Rank must be a valid number'),
  institution: Yup.string(),
  year: Yup.string().required('Passing out year is required'),
  domicileState: Yup.string(),
  category: Yup.string().required('Category is required'),
  gender: Yup.string().required('Gender is required'),
  referralCode: Yup.string(),
  confirmAccuracy: Yup.boolean()
    .oneOf([true], 'Please confirm the information is accurate')
    .required('Please confirm the information is accurate'),
});

const preferencesSchema = Yup.object({
  counsellingType: Yup.string().required('Counselling type is required'),
  preferredBranch: Yup.string().required('Preferred branch is required'),
  preference1: Yup.string().required('1st preference is required'),
  preference2: Yup.string(),
  preference3: Yup.string(),
});

export default function StudentInfoPage() {
  const router = useRouter();
  const { user, loading: authLoading, refreshUser } = useAuth();
  const { isAuthorized } = useRequireAuth(['student']);
  const queryClient = useQueryClient();
  const [logoutOpen, setLogoutOpen] = useState(false);
  const [currentStep, setCurrentStep] = useState(1);

  // Refs for each field to enable scrolling
  const fieldRefs = useRef<{ [key: string]: HTMLDivElement | null }>({});

  const currentYear = new Date().getFullYear();
  const years = [currentYear, currentYear - 1, currentYear - 2];

  // Check if student has already used their checks
  const { data: profileData } = useQuery({
    queryKey: ['student-profile'],
    queryFn: async () => {
      const response = await fetch('/api/students/profile');
      if (!response.ok) return null;
      return response.json();
    },
    enabled: !!isAuthorized,
  });

  // Fetch available locations from API
  const { data: locationsData, isLoading: locationsLoading } = useQuery<{ locations: string[] }>({
    queryKey: ['locations'],
    queryFn: async () => {
      const response = await fetch('/api/colleges/locations');
      if (!response.ok) throw new Error('Failed to fetch locations');
      return response.json();
    },
  });
  const locations = locationsData?.locations || [];

  // Fetch available courses from API
  const { data: coursesData, isLoading: coursesLoading } = useQuery<{ courses: string[] }>({
    queryKey: ['courses'],
    queryFn: async () => {
      const response = await fetch('/api/colleges/courses');
      if (!response.ok) throw new Error('Failed to fetch courses');
      return response.json();
    },
  });
  
  // Problem 5: Fetch referral codes
  const { data: referralCodesData } = useQuery<{ codes: { code: string, description: string }[] }>({
    queryKey: ['referral-codes'],
    queryFn: async () => {
      const response = await fetch('/api/referral-codes');
      if (!response.ok) return { codes: [] };
      return response.json();
    },
  });
  const referralCodes = referralCodesData?.codes || [];
  
  // Problem 9: Static branch options
  const courses = ['MBBS', 'BDS'];
  
  const student = profileData?.student;
  const profileIsComplete = !!student && (student.rank > 0 || student.isProfileComplete);

  // Set initial step based on profile completion
  useEffect(() => {
    if (profileIsComplete) {
      setCurrentStep(2);
    }
  }, [profileIsComplete]);

  const submitMutation = useMutation({
    mutationFn: async (data: any) => {
      // First save profile
      const profileResponse = await fetch('/api/students/profile', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          marks: parseInt(data.marks),
          rank: parseInt(data.rank),
          yearOfPassing: parseInt(data.year),
          category: data.category,
          gender: data.gender,
          institution: data.institution || '',
          domicileState: data.domicileState || '',
          counsellingType: data.counsellingType,
          preferredBranch: data.preferredBranch,
          locationPreference1: data.preference1,
          locationPreference2: data.preference2 === 'none' ? '' : data.preference2,
          locationPreference3: data.preference3 === 'none' ? '' : data.preference3,
          referralCode: data.referralCode === 'none' ? '' : data.referralCode || '',
          // Ensure isProfileComplete is set to true on first save
          isProfileComplete: true,
        }),
      });

      if (!profileResponse.ok) {
        const error = await profileResponse.json();
        throw new Error(error.error || 'Failed to save profile');
      }

      // Then get eligible colleges — track=true increments checksUsed and creates lead
      // Problem 12: results are only viewed after specifically requesting them
      const params = new URLSearchParams({
        domicileState: data.domicileState,
        track: 'true',
      });

      const collegesResponse = await fetch(`/api/colleges/eligible?${params}`);
      if (!collegesResponse.ok) {
        const error = await collegesResponse.json();
        throw new Error(error.error || 'Failed to get colleges');
      }

      return collegesResponse.json();
    },
    onSuccess: async (data) => {
      // Refresh auth state and invalidate profile query
      await Promise.all([
        refreshUser(),
        queryClient.invalidateQueries({ queryKey: ['student-profile'] })
      ]);

      // Store result in sessionStorage and redirect
      sessionStorage.setItem('collegeResult', JSON.stringify(data));
      router.push('/student/result');
    },
  });

  // Problem 1: Handle redirection explicitly after login/register
  const handleAuthSuccess = () => {
    if (user) {
      router.push(getRedirectUrl(user));
    } else {
      // If user is not yet available in the hook, wait or refresh
       refreshUser().then((updatedUser) => {
        if (updatedUser) {
          router.push(getRedirectUrl(updatedUser));
        }
      });
    }
  };

  // Helper to get labels for values
  const getCategoryLabel = (value: string) => NEET_CATEGORIES.find(c => c.value === value)?.label || value;
  const getGenderLabel = (value: string) => GENDERS.find(g => g.value === value)?.label || value;
  const getCounsellingLabel = (value: string) => COUNSELLING_TYPES.find(c => c.value === value)?.label || value;

  // Formik setup
  const formik = useFormik({
    initialValues: {
      marks: student?.marks || '',
      rank: student?.rank?.toString() || '',
      institution: student?.institution || '',
      year: student?.yearOfPassing?.toString() || currentYear.toString(),
      domicileState: student?.domicileState || '',
      category: student?.category || '',
      gender: student?.gender || '',
      counsellingType: student?.counsellingType || '',
      preferredBranch: student?.preferredBranch || '',
      preference1: student?.locationPreference1 || '',
      preference2: student?.locationPreference2 && student.locationPreference2 !== '' ? student.locationPreference2 : 'none',
      preference3: student?.locationPreference3 && student.locationPreference3 !== '' ? student.locationPreference3 : 'none',
      referralCode: student?.referralCode || 'none',
      confirmAccuracy: profileIsComplete ? true : false,
    },
    enableReinitialize: true, // re-populate when profileData loads
    validationSchema: currentStep === 1 ? basicDetailsSchema : preferencesSchema,
    validateOnChange: true,
    validateOnBlur: true,
    onSubmit: async (values) => {
      if (currentStep === 1) {
        // Validation for step 1 is handled by validationSchema
        // Move to step 2 as per Problem 12: results trigger preferences collection
        setCurrentStep(2);
        // Scroll to top to see preferences
        window.scrollTo({ top: 0, behavior: 'smooth' });
      } else {
        submitMutation.mutate(values);
      }
    },
  });

  // Scroll to first error field on form submission
  useEffect(() => {
    if (formik.submitCount > 0 && Object.keys(formik.errors).length > 0) {
      const firstErrorField = Object.keys(formik.errors)[0];
      const errorElement = fieldRefs.current[firstErrorField];

      if (errorElement) {
        errorElement.scrollIntoView({
          behavior: 'smooth',
          block: 'center'
        });
      }
    }
    // Only trigger on submitCount change, not on errors change
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [formik.submitCount]);

  useEffect(() => {
    if (!authLoading && !isAuthorized) {
      router.push('/');
    }
  }, [authLoading, isAuthorized, router]);

  if (authLoading || !isAuthorized) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-slate-50">
        <div className="flex flex-col items-center gap-4">
          <Loader2 className="h-10 w-10 animate-spin text-indigo-600" />
          <p className="text-slate-500 animate-pulse">Authenticating...</p>
        </div>
      </div>
    );
  }

  const isProfileLoading = !profileData;

  const checksRemaining = 2 - (student?.checksUsed || 0);

  return (
    <div className="min-h-screen bg-slate-50">
      {/* Main Content */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="mb-8">
          <h1 className="text-2xl sm:text-3xl font-bold text-[#1E1E1E]">Enter Your Details</h1>
          {profileIsComplete ? (
            <div className="mt-3 flex flex-col sm:flex-row sm:items-center justify-between gap-4 p-4 bg-[#E7F0FF] border border-[#B8D4FF] rounded-xl">
              <div className="flex items-start gap-2">
                <svg className="h-5 w-5 text-[#2F129B] mt-0.5 flex-shrink-0" fill="currentColor" viewBox="0 0 20 20">
                  <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2v3a1 1 0 001 1h1a1 1 0 100-2v-3a1 1 0 00-1-1H9z" clipRule="evenodd" />
                </svg>
                <p className="text-sm text-[#2F129B]">
                  Your basic details are saved and <strong>cannot be changed</strong>. You can still modify your <strong>Course and Location preferences</strong> below, or jump straight to your results.
                </p>
              </div>
              <Button 
                type="button"
                onClick={() => router.push('/student/result')}
                variant="outline"
                className="bg-white border-[#2F129B] text-[#2F129B] hover:bg-indigo-50 shrink-0"
              >
                View My Results
                <ArrowRight className="ml-2 h-4 w-4" />
              </Button>
            </div>
          ) : (
            <p className="text-amber-600 flex items-center gap-2 mt-2 text-sm">
              <AlertTriangle className="h-4 w-4" />
              Please enter your details carefully! Once Saved, They Cannot Be Edited Or Updated Later.
            </p>
          )}
        </div>

        <form onSubmit={formik.handleSubmit} className="space-y-10">
          {submitMutation.error && (
            <div className="p-4 text-sm text-red-600 bg-red-50 rounded-lg border border-red-100">
              {submitMutation.error.message}
            </div>
          )}

          {/* Stepper Indicator - Always show for context */}
          <div className="flex items-center gap-4 mb-8">
            <div className={`flex items-center justify-center w-10 h-10 rounded-full border-2 transition-all cursor-pointer ${currentStep === 1 ? 'bg-[#2F129B] border-[#2F129B] text-white' : 'border-[#2F129B] text-[#2F129B]'}`} onClick={() => setCurrentStep(1)}>1</div>
            <div className="h-[2px] w-12 bg-slate-200"></div>
            <div className={`flex items-center justify-center w-10 h-10 rounded-full border-2 transition-all cursor-pointer ${currentStep === 2 ? 'bg-[#2F129B] border-[#2F129B] text-white' : 'border-slate-300 text-slate-400'}`} onClick={() => { if (profileIsComplete || formik.isValid) setCurrentStep(2); }}>2</div>
          </div>

          {currentStep === 1 && (
            /* Step 1: Basic and Academic Details */
            <section>
            <div className="flex items-center justify-between mb-6">
              <h2 className={`text-lg font-medium text-[#2F129B] ${profileIsComplete ? 'flex items-center gap-2' : ''}`}>
                {profileIsComplete ? (
                  <>
                    <svg className="h-5 w-5 text-slate-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
                    </svg>
                    Basic and Academic Details (Locked)
                  </>
                ) : (
                  "Basic and Academic Details"
                )}
              </h2>
            </div>

            <div className="grid md:grid-cols-2 gap-4">
              {/* Marks Field - Problem 4: Textarea required */}
              <div
                className="space-y-2 transition-all duration-200 rounded-lg p-2 -m-2"
                ref={(el) => { fieldRefs.current['marks'] = el; }}
              >
                <Label>Marks <span className="text-red-500">*</span></Label>
                {isProfileLoading ? (
                  <Skeleton className="h-12 w-full" />
                ) : profileIsComplete ? (
                  <div className="min-h-[80px] w-full rounded-md border border-slate-200 bg-slate-50 px-3 py-2 text-sm text-slate-700 cursor-not-allowed">
                    {formik.values.marks}
                  </div>
                ) : (
                  <Textarea
                    name="marks"
                    placeholder="Enter your marks"
                    className={`min-h-[80px] resize-none ${formik.touched.marks && formik.errors.marks ? 'border-red-500' : ''}`}
                    {...formik.getFieldProps('marks')}
                  />
                )}
                {formik.touched.marks && formik.errors.marks && (
                  <p className="text-sm text-red-500 flex items-center gap-1">
                    <AlertTriangle className="h-3 w-3" />
                    {String(formik.errors.marks)}
                  </p>
                )}
              </div>

              {/* Rank Field - Problem 3 */}
              <div
                className="space-y-2 transition-all duration-200 rounded-lg p-2 -m-2"
                ref={(el) => { fieldRefs.current['rank'] = el; }}
              >
                <Label htmlFor="rank">NEET All India Rank <span className="text-red-500">*</span></Label>
                {isProfileLoading ? (
                  <Skeleton className="h-12 w-full" />
                ) : (
                  <Input
                    id="rank"
                    type="text"
                    placeholder="Enter Your Rank"
                    className={`h-12 ${formik.touched.rank && formik.errors.rank ? 'border-red-500 focus-visible:ring-red-500' : ''} ${profileIsComplete ? 'bg-slate-50 cursor-not-allowed opacity-100 font-medium' : ''}`}
                    {...formik.getFieldProps('rank')}
                    readOnly={profileIsComplete}
                  />
                )}
                {formik.touched.rank && formik.errors.rank && (
                  <p className="text-sm text-red-500 flex items-center gap-1">
                    <AlertTriangle className="h-3 w-3" />
                    {String(formik.errors.rank)}
                  </p>
                )}
              </div>

              {/* Institution Field - Problem 6 */}
              <div
                className="space-y-2 transition-all duration-200 rounded-lg p-2 -m-2"
                ref={(el) => { fieldRefs.current['institution'] = el; }}
              >
                <Label htmlFor="institution">12th Board Name</Label>
                {isProfileLoading ? (
                  <Skeleton className="h-12 w-full" />
                ) : (
                  <Input
                    id="institution"
                    name="institution"
                    placeholder="Enter the 12th Board Name"
                    className={`h-12 ${profileIsComplete ? 'bg-slate-50 cursor-not-allowed opacity-70' : ''}`}
                    value={formik.values.institution}
                    onChange={formik.handleChange}
                    onBlur={formik.handleBlur}
                    disabled={profileIsComplete}
                  />
                )}
              </div>

              {/* Year Field */}
              <div
                className="space-y-2 transition-all duration-200 rounded-lg p-2 -m-2"
                ref={(el) => { fieldRefs.current['year'] = el; }}
              >
                <Label>Passing out year <span className="text-red-500">*</span></Label>
                {isProfileLoading ? (
                  <Skeleton className="h-12 w-full" />
                ) : profileIsComplete ? (
                  <Input
                    value={formik.values.year}
                    readOnly
                    className="h-12 bg-slate-50 cursor-not-allowed opacity-100 font-medium border-slate-200"
                  />
                ) : (
                  <Select
                    value={formik.values.year}
                    onValueChange={(value) => formik.setFieldValue('year', value)}
                  >
                    <SelectTrigger className={`h-12 ${formik.touched.year && formik.errors.year ? 'border-red-500' : ''}`}>
                      <SelectValue placeholder="Select Year of Passout" />
                    </SelectTrigger>
                    <SelectContent>
                      {years.map((year) => (
                        <SelectItem key={year} value={year.toString()}>
                          {year}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                )}
                {formik.touched.year && formik.errors.year && (
                  <p className="text-sm text-red-500 flex items-center gap-1">
                    <AlertTriangle className="h-3 w-3" />
                    {String(formik.errors.year)}
                  </p>
                )}
              </div>

              {/* Domicile State Field - Problem 7 */}
              <div
                className="space-y-2 transition-all duration-200 rounded-lg p-2 -m-2"
                ref={(el) => { fieldRefs.current['domicileState'] = el; }}
              >
                <Label>Domicile State</Label>
                {isProfileLoading ? (
                  <Skeleton className="h-12 w-full" />
                ) : profileIsComplete ? (
                  <Input
                    value={formik.values.domicileState}
                    readOnly
                    className="h-12 bg-slate-50 cursor-not-allowed opacity-100 font-medium border-slate-200"
                  />
                ) : (
                  <Select
                    value={formik.values.domicileState}
                    onValueChange={(value) => formik.setFieldValue('domicileState', value)}
                  >
                    <SelectTrigger className={`h-12 ${formik.touched.domicileState && formik.errors.domicileState ? 'border-red-500' : ''}`}>
                      <SelectValue placeholder="Select Your Domicile State" />
                    </SelectTrigger>
                    <SelectContent>
                      {INDIAN_STATES.map((state) => (
                        <SelectItem key={state} value={state}>
                          {state}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                )}
                {!profileIsComplete && (
                   <p className="text-xs text-slate-500 italic">10 plus years of study (Optional)</p>
                )}
                {formik.touched.domicileState && formik.errors.domicileState && (
                  <p className="text-sm text-red-500 flex items-center gap-1">
                    <AlertTriangle className="h-3 w-3" />
                    {String(formik.errors.domicileState)}
                  </p>
                )}
              </div>

              {/* Category Field */}
              <div
                className="space-y-2 transition-all duration-200 rounded-lg p-2 -m-2"
                ref={(el) => { fieldRefs.current['category'] = el; }}
              >
                <Label>Category <span className="text-red-500">*</span></Label>
                {isProfileLoading ? (
                  <Skeleton className="h-12 w-full" />
                ) : profileIsComplete ? (
                  <Input
                    value={getCategoryLabel(formik.values.category)}
                    readOnly
                    className="h-12 bg-slate-50 cursor-not-allowed opacity-100 font-medium border-slate-200"
                  />
                ) : (
                  <Select
                    value={formik.values.category}
                    onValueChange={(value) => formik.setFieldValue('category', value)}
                  >
                    <SelectTrigger className={`h-12 ${formik.touched.category && formik.errors.category ? 'border-red-500' : ''}`}>
                      <SelectValue placeholder="Select Category" />
                    </SelectTrigger>
                    <SelectContent>
                      {NEET_CATEGORIES.map((cat) => (
                        <SelectItem key={cat.value} value={cat.value}>
                          {cat.label}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                )}
                {formik.touched.category && formik.errors.category && (
                  <p className="text-sm text-red-500 flex items-center gap-1">
                    <AlertTriangle className="h-3 w-3" />
                    {String(formik.errors.category)}
                  </p>
                )}
              </div>

              {/* Gender Field */}
              <div
                className="space-y-2 transition-all duration-200 rounded-lg p-2 -m-2"
                ref={(el) => { fieldRefs.current['gender'] = el; }}
              >
                <Label>Gender <span className="text-red-500">*</span></Label>
                {isProfileLoading ? (
                  <Skeleton className="h-12 w-full" />
                ) : profileIsComplete ? (
                  <Input
                    value={getGenderLabel(formik.values.gender)}
                    readOnly
                    className="h-12 bg-slate-50 cursor-not-allowed opacity-100 font-medium border-slate-200"
                  />
                ) : (
                  <Select
                    value={formik.values.gender}
                    onValueChange={(value) => formik.setFieldValue('gender', value)}
                  >
                    <SelectTrigger className={`h-12 ${formik.touched.gender && formik.errors.gender ? 'border-red-500' : ''}`}>
                      <SelectValue placeholder="Select Gender" />
                    </SelectTrigger>
                    <SelectContent>
                      {GENDERS.map((gender) => (
                        <SelectItem key={gender.value} value={gender.value}>
                          {gender.label}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                )}
                {formik.touched.gender && formik.errors.gender && (
                  <p className="text-sm text-red-500 flex items-center gap-1">
                    <AlertTriangle className="h-3 w-3" />
                    {String(formik.errors.gender)}
                  </p>
                )}
              </div>

              {/* Referral Code Field - Problem 5 */}
              <div
                className="space-y-2 transition-all duration-200 rounded-lg p-2 -m-2"
                ref={(el) => { fieldRefs.current['referralCode'] = el; }}
              >
                <Label>Referral Code</Label>
                {isProfileLoading ? (
                  <Skeleton className="h-12 w-full" />
                ) : profileIsComplete ? (
                  <Input
                    value={formik.values.referralCode || 'None'}
                    readOnly
                    className="h-12 bg-slate-50 cursor-not-allowed opacity-100 font-medium border-slate-200"
                  />
                ) : (
                  <Select
                    value={formik.values.referralCode}
                    onValueChange={(value) => formik.setFieldValue('referralCode', value)}
                  >
                    <SelectTrigger className="h-12">
                      <SelectValue placeholder="Select Referral Code (Optional)" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="none">None</SelectItem>
                      {referralCodes.map((ref) => (
                        <SelectItem key={ref.code} value={ref.code}>
                          {ref.code} {ref.description ? `- ${ref.description}` : ''}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                )}
              </div>
            </div>

            {!profileIsComplete && (
              <div
                className="mt-8 space-y-2 transition-all duration-200 rounded-lg p-2 -m-2"
                ref={(el) => { fieldRefs.current['confirmAccuracy'] = el; }}
              >
                <div className="flex items-start gap-3">
                  <Checkbox
                    id="confirmAccuracy"
                    checked={formik.values.confirmAccuracy}
                    onCheckedChange={(checked) => formik.setFieldValue('confirmAccuracy', checked === true)}
                  />
                  <Label htmlFor="confirmAccuracy" className="text-sm text-slate-600 leading-relaxed cursor-pointer">
                    I confirm that all the information provided is accurate and final. I agree to proceed with the entered details. <span className="text-red-500">*</span>
                  </Label>
                </div>
                {formik.touched.confirmAccuracy && formik.errors.confirmAccuracy && (
                  <p className="text-sm text-red-500 flex items-center gap-1 ml-8">
                    <AlertTriangle className="h-3 w-3" />
                    {String(formik.errors.confirmAccuracy)}
                  </p>
                )}
              </div>
            )}
          </section>
          )}

          {currentStep === 2 && (
          /* Step 2: Course and Location Preference */
          <section>
            <h2 className="text-lg font-semibold text-[#2F129B] mb-6">
              {profileIsComplete ? "Update Your Preferences" : "Course and Location Preference"}
            </h2>

            <div className="grid md:grid-cols-2 gap-6">
              {/* Counselling Type Field */}
              <div
                className="space-y-2 transition-all duration-200 rounded-lg p-2 -m-2"
                ref={(el) => { fieldRefs.current['counsellingType'] = el; }}
              >
                <Label>Counselling Type <span className="text-red-500">*</span></Label>
                {isProfileLoading ? (
                  <Skeleton className="h-12 w-full" />
                ) : (
                  <Select
                    value={formik.values.counsellingType}
                    onValueChange={(value) => formik.setFieldValue('counsellingType', value)}
                  >
                    <SelectTrigger className={`h-12 ${formik.touched.counsellingType && formik.errors.counsellingType ? 'border-red-500' : ''}`}>
                      <SelectValue placeholder="Select Counselling Type" />
                    </SelectTrigger>
                    <SelectContent>
                      {QUOTA_TYPES.map((quota) => (
                        <SelectItem key={quota.value} value={quota.value}>
                          {quota.label}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                )}
                {formik.touched.counsellingType && formik.errors.counsellingType && (
                  <p className="text-sm text-red-500 flex items-center gap-1">
                    <AlertTriangle className="h-3 w-3" />
                    {String(formik.errors.counsellingType)}
                  </p>
                )}
              </div>

              {/* Preferred Branch Field */}
              <div
                className="space-y-2 transition-all duration-200 rounded-lg p-2 -m-2"
                ref={(el) => { fieldRefs.current['preferredBranch'] = el; }}
              >
                <Label>Preferred Branch <span className="text-red-500">*</span></Label>
                {isProfileLoading ? (
                  <Skeleton className="h-12 w-full" />
                ) : (
                  <Select
                    value={formik.values.preferredBranch}
                    onValueChange={(value) => formik.setFieldValue("preferredBranch", value)}
                  >
                    <SelectTrigger className={`h-12 ${formik.touched.preferredBranch && formik.errors.preferredBranch ? "border-red-500" : ""}`}>
                      <SelectValue placeholder="Select Your Preferred Branch" />
                    </SelectTrigger>
                    <SelectContent>
                      {coursesLoading ? (
                        <SelectItem value="loading" disabled>Loading...</SelectItem>
                      ) : courses.length > 0 ? (
                        courses.map((course) => (
                          <SelectItem key={course} value={course}>
                            {course}
                          </SelectItem>
                        ))
                      ) : (
                        <SelectItem value="no-courses" disabled>No courses available</SelectItem>
                      )}
                    </SelectContent>
                  </Select>
                )}
                {formik.touched.preferredBranch && formik.errors.preferredBranch && (
                  <p className="text-sm text-red-500 flex items-center gap-1">
                    <AlertTriangle className="h-3 w-3" />
                    {String(formik.errors.preferredBranch)}
                  </p>
                )}
              </div>
            </div>

            <div className="mt-6">
              <Label className="mb-3 block">
                Interested Study Location ( 1st preference is mandatory )
              </Label>
              <div className="grid md:grid-cols-3 gap-4">
                {/* Preference 1 */}
                <div
                  className="space-y-2 transition-all duration-200 rounded-lg p-2 -m-2"
                  ref={(el) => { fieldRefs.current['preference1'] = el; }}
                >
                  {isProfileLoading ? (
                    <Skeleton className="h-12 w-full" />
                  ) : (
                    <Select
                      value={formik.values.preference1}
                      onValueChange={(value) => formik.setFieldValue('preference1', value)}
                    >
                      <SelectTrigger className={`h-12 ${formik.touched.preference1 && formik.errors.preference1 ? 'border-red-500' : ''}`}>
                        <SelectValue placeholder="1st Preference *" />
                      </SelectTrigger>
                      <SelectContent>
                        {locationsLoading ? (
                          <SelectItem value="loading" disabled>Loading...</SelectItem>
                        ) : locations.length > 0 ? (
                          locations.map((location) => (
                            <SelectItem key={location} value={location}>
                              {location}
                            </SelectItem>
                          ))
                        ) : (
                          <SelectItem value="no-locations" disabled>No locations available</SelectItem>
                        )}
                      </SelectContent>
                    </Select>
                  )}
                  {formik.touched.preference1 && formik.errors.preference1 && (
                    <p className="text-sm text-red-500 flex items-center gap-1">
                      <AlertTriangle className="h-3 w-3" />
                      {String(formik.errors.preference1)}
                    </p>
                  )}
                </div>

                <div className="space-y-2">
                  {isProfileLoading ? (
                    <Skeleton className="h-12 w-full" />
                  ) : (
                    <Select
                      value={formik.values.preference2}
                      onValueChange={(value) => formik.setFieldValue('preference2', value)}
                    >
                      <SelectTrigger className="h-12">
                        <SelectValue placeholder="2nd Preference (Optional)" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="none">Not Specified</SelectItem>
                        {locationsLoading ? (
                          <SelectItem value="loading" disabled>Loading...</SelectItem>
                        ) : locations.length > 0 ? (
                          locations.map((location) => (
                            <SelectItem key={location} value={location}>
                              {location}
                            </SelectItem>
                          ))
                        ) : (
                          <SelectItem value="no-locations" disabled>No locations available</SelectItem>
                        )}
                      </SelectContent>
                    </Select>
                  )}
                </div>

                {/* Preference 3 */}
                <div className="space-y-2">
                  {isProfileLoading ? (
                    <Skeleton className="h-12 w-full" />
                  ) : (
                    <Select
                      value={formik.values.preference3}
                      onValueChange={(value) => formik.setFieldValue('preference3', value)}
                    >
                      <SelectTrigger className="h-12">
                        <SelectValue placeholder="3rd Preference (Optional)" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="none">Not Specified</SelectItem>
                        {locationsLoading ? (
                          <SelectItem value="loading" disabled>Loading...</SelectItem>
                        ) : locations.length > 0 ? (
                          locations.map((location) => (
                            <SelectItem key={location} value={location}>
                              {location}
                            </SelectItem>
                          ))
                        ) : (
                          <SelectItem value="no-locations" disabled>No locations available</SelectItem>
                        )}
                      </SelectContent>
                    </Select>
                  )}
                </div>
              </div>
            </div>
          </section>
          )}

          {/* Navigation Buttons */}
          <div className="flex justify-center gap-4 pt-4">
            {currentStep === 2 && (
               <Button
                type="button"
                variant="outline"
                size="lg"
                className="h-14 px-8 rounded-full font-normal text-base"
                onClick={() => {
                  setCurrentStep(1);
                  window.scrollTo({ top: 0, behavior: 'smooth' });
                }}
              >
                Back
              </Button>
            )}

            <Button
              type="submit"
              size="lg"
              className="h-14 px-12 bg-gradient-to-r from-[#2F129B] to-[#6366F1] rounded-full font-normal text-base hover:shadow-lg transition-all"
              disabled={submitMutation.isPending || (currentStep === 2 && checksRemaining <= 0)}
            >
              {submitMutation.isPending ? (
                <>
                  <Loader2 className="mr-2 h-5 w-5 animate-spin" />
                  Processing...
                </>
              ) : currentStep === 1 ? (
                <>
                  View My Results
                  <ArrowRight className="ml-2 h-5 w-5" />
                </>
              ) : (
                <>
                  {profileIsComplete ? "Update and View Results" : "Get My Results"}
                  <ArrowRight className="ml-2 h-5 w-5" />
                </>
              )}
            </Button>
          </div>

          {!profileIsComplete && checksRemaining <= 0 && (
            <p className="text-center text-amber-600 text-sm">
              You have used all your free checks. Contact support for more.
            </p>
          )}
        </form>
      </main>

      <LogoutModal open={logoutOpen} onOpenChange={setLogoutOpen} />
    </div>
  );
}
