'use client';

import { useState, useEffect, useRef } from 'react';
import { useRouter } from 'next/navigation';
import { useFormik } from 'formik';
import * as Yup from 'yup';
import { Loader2, AlertTriangle, ArrowRight } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '../../../components/ui/textarea';
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
  score: Yup.number()
    .typeError('Score must be a number')
    .min(0, 'Minimum score is 0')
    .max(720, 'Maximum score is 720')
    .required('Neet Score is required'),
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

export default function StudentInfoPage() {
  const router = useRouter();
  const { user, loading: authLoading, refreshUser } = useAuth();
  const { isAuthorized } = useRequireAuth(['student']);
  const queryClient = useQueryClient();
  const [logoutOpen, setLogoutOpen] = useState(false);

  // Refs for each field to enable scrolling
  const fieldRefs = useRef<{ [key: string]: HTMLDivElement | null }>({});

  const currentYear = new Date().getFullYear();
  const years = [currentYear, currentYear - 1, currentYear - 2];

  // Check if student exists
  const { data: profileData } = useQuery({
    queryKey: ['student-profile'],
    queryFn: async () => {
      const response = await fetch('/api/students/profile');
      if (!response.ok) return null;
      return response.json();
    },
    enabled: !!isAuthorized,
  });

  // Fetch available referral codes
  const { data: referralCodesData } = useQuery<{ codes: { code: string, description: string }[] }>({
    queryKey: ['referral-codes'],
    queryFn: async () => {
      const response = await fetch('/api/referral-codes');
      if (!response.ok) return { codes: [] };
      return response.json();
    },
  });
  const referralCodes = referralCodesData?.codes || [];
  
  const student = profileData?.student;
  const profileIsComplete = !!student && (student.rank > 0 || student.isProfileComplete);

  const submitMutation = useMutation({
    mutationFn: async (data: any) => {
      const profileResponse = await fetch('/api/students/profile', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          score: parseInt(data.score),
          rank: parseInt(data.rank),
          yearOfPassing: parseInt(data.year),
          category: data.category,
          gender: data.gender,
          institution: data.institution || '',
          domicileState: data.domicileState || '',
          referralCode: data.referralCode === 'none' ? '' : data.referralCode || '',
          // Ensure isProfileComplete is set to true on save
          isProfileComplete: true,
          // Maintain existing preferences if they exist, or set safe defaults
          counsellingType: student?.counsellingType || 'all_india',
          preferredBranch: student?.preferredBranch || 'MBBS',
          locationPreference1: student?.locationPreference1 || '',
        }),
      });

      if (!profileResponse.ok) {
        const error = await profileResponse.json();
        throw new Error(error.error || 'Failed to save profile');
      }

      return profileResponse.json();
    },
    onSuccess: async () => {
      await Promise.all([
        refreshUser(),
        queryClient.invalidateQueries({ queryKey: ['student-profile'] })
      ]);
      router.push('/student/result');
    },
  });

  // Formik setup
  const formik = useFormik({
    initialValues: {
      score: student?.score || '',
      rank: student?.rank?.toString() || '',
      institution: student?.institution || '',
      year: student?.yearOfPassing?.toString() || currentYear.toString(),
      domicileState: student?.domicileState || '',
      category: student?.category || '',
      gender: student?.gender || '',
      referralCode: student?.referralCode || 'none',
      confirmAccuracy: profileIsComplete ? true : false,
    },
    enableReinitialize: true,
    validationSchema: basicDetailsSchema,
    validateOnChange: true,
    validateOnBlur: true,
    onSubmit: (values) => {
      submitMutation.mutate(values);
    },
  });

  // Scroll to first error field
  useEffect(() => {
    if (formik.submitCount > 0 && Object.keys(formik.errors).length > 0) {
      const firstErrorField = Object.keys(formik.errors)[0];
      const errorElement = fieldRefs.current[firstErrorField];
      if (errorElement) {
        errorElement.scrollIntoView({ behavior: 'smooth', block: 'center' });
      }
    }
  }, [formik.submitCount]);

  useEffect(() => {
    if (!authLoading && !isAuthorized) {
      router.push('/');
    }
  }, [authLoading, isAuthorized, router]);

  if (authLoading || !isAuthorized) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-slate-50">
        <Loader2 className="h-10 w-10 animate-spin text-indigo-600" />
      </div>
    );
  }

  const isProfileLoading = !profileData;

  return (
    <div className="min-h-screen bg-slate-50 animate-page">
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="mb-8">
          <h1 className="text-2xl sm:text-3xl font-bold text-[#1E1E1E]">Enter Your Details</h1>
          {profileIsComplete ? (
            <div className="mt-3 flex flex-col sm:flex-row sm:items-center justify-between gap-4 p-4 bg-[#E7F0FF] border border-[#B8D4FF] rounded-xl shadow-xs">
              <div className="flex items-start gap-2">
                <svg className="h-5 w-5 text-[#2F129B] mt-0.5" fill="currentColor" viewBox="0 0 20 20">
                  <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2v3a1 1 0 001 1h1a1 1 0 100-2v-3a1 1 0 00-1-1H9z" clipRule="evenodd" />
                </svg>
                <p className="text-sm text-[#2F129B]">
                  Your basic details are saved and <strong>cannot be changed</strong>. You can update your <strong>Course and Location preferences</strong> on the results page.
                </p>
              </div>
              <Button 
                type="button"
                onClick={() => router.push('/student/result')}
                variant="outline"
                className="bg-white border-[#2F129B] cursor-pointer text-[#2F129B] hover:bg-white/90 shrink-0 font-medium"
              >
                View My Results
                <ArrowRight className="ml-2 h-4 w-4" />
              </Button>
            </div>
          ) : (
            <p className="text-amber-600 flex items-center gap-2 mt-2 text-sm font-medium">
              <AlertTriangle className="h-4 w-4" />
              Please enter your details carefully! Once Saved, They Cannot Be Edited Or Updated Later.
            </p>
          )}
        </div>

        <form onSubmit={formik.handleSubmit} className="bg-white rounded-2xl shadow-sm border border-slate-200 p-6 sm:p-8 space-y-10">
          {submitMutation.error && (
            <div className="p-4 text-sm text-red-600 bg-red-50 rounded-lg border border-red-100">
              {submitMutation.error.message}
            </div>
          )}

          <section>
            <h2 className={`text-lg font-semibold text-[#2F129B] mb-8 flex items-center gap-2`}>
              {profileIsComplete && (
                <svg className="h-5 w-5 text-slate-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
                </svg>
              )}
              {profileIsComplete ? "Account Summary (Locked)" : "Basic and Academic Details"}
            </h2>

            <div className="grid md:grid-cols-2 gap-x-8 gap-y-6">
              <div ref={(el) => { fieldRefs.current['score'] = el; }} className="space-y-2">
                <Label htmlFor="score" className="text-slate-700">Neet Score<span className="text-red-500">*</span></Label>
                <Input
                  id="score"
                  type="number"
                placeholder="Enter your Neet score"
                  className={`h-12 border-slate-200 focus:border-indigo-500 ${formik.touched.rank && formik.errors.rank ? 'border-red-500' : ''} ${profileIsComplete ? 'bg-slate-50/50 cursor-not-allowed opacity-100' : ''}`}
                  {...formik.getFieldProps('score')}
                  readOnly={profileIsComplete}
                />
                {formik.touched.score && formik.errors.score && (
                  <p className="text-sm text-red-500 flex items-center gap-1 mt-1 font-medium">
                    <AlertTriangle className="h-3 w-3" />
                    {String(formik.errors.score)}
                  </p>
                )}
              </div>

              <div ref={(el) => { fieldRefs.current['rank'] = el; }} className="space-y-2">
                <Label htmlFor="rank" className="text-slate-700">NEET All India Rank <span className="text-red-500">*</span></Label>
                <Input
                  id="rank"
                  type="text"
                  placeholder="Enter Your Rank"
                  className={`h-12 border-slate-200 focus:border-indigo-500 ${formik.touched.rank && formik.errors.rank ? 'border-red-500' : ''} ${profileIsComplete ? 'bg-slate-50/50 cursor-not-allowed opacity-100' : ''}`}
                  {...formik.getFieldProps('rank')}
                  readOnly={profileIsComplete}
                />
                {formik.touched.rank && formik.errors.rank && (
                  <p className="text-sm text-red-500 flex items-center gap-1 mt-1 font-medium">
                    <AlertTriangle className="h-3 w-3" />
                    {String(formik.errors.rank)}
                  </p>
                )}
              </div>

              <div ref={(el) => { fieldRefs.current['institution'] = el; }} className="space-y-2">
                <Label htmlFor="institution" className="text-slate-700">12th Board Name</Label>
                <Input
                  id="institution"
                  name="institution"
                  placeholder="Enter the 12th Board Name"
                  className={`h-12 border-slate-200 focus:border-indigo-500 ${profileIsComplete ? 'bg-slate-50/50 cursor-not-allowed' : ''}`}
                  value={formik.values.institution}
                  onChange={formik.handleChange}
                  onBlur={formik.handleBlur}
                  disabled={profileIsComplete}
                />
              </div>

              <div ref={(el) => { fieldRefs.current['year'] = el; }} className="space-y-2">
                <Label className="text-slate-700">Passing out year <span className="text-red-500">*</span></Label>
                {profileIsComplete ? (
                  <div className="h-12 w-full rounded-lg border border-slate-200 bg-slate-50/50 px-4 flex items-center text-sm text-slate-600">
                    {formik.values.year}
                  </div>
                ) : (
                  <Select value={formik.values.year} onValueChange={(value) => formik.setFieldValue('year', value)}>
                    <SelectTrigger className={`h-12 border-slate-200 ${formik.touched.year && formik.errors.year ? 'border-red-500' : ''}`}>
                      <SelectValue placeholder="Select Year of Passout" />
                    </SelectTrigger>
                    <SelectContent>
                      {years.map((year) => (
                        <SelectItem key={year} value={year.toString()}>{year}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                )}
              </div>

              <div ref={(el) => { fieldRefs.current['domicileState'] = el; }} className="space-y-2">
                <Label className="text-slate-700">Domicile State</Label>
                {profileIsComplete ? (
                  <div className="h-12 w-full rounded-lg border border-slate-200 bg-slate-50/50 px-4 flex items-center text-sm text-slate-600">
                    {formik.values.domicileState || 'Not Specified'}
                  </div>
                ) : (
                  <Select value={formik.values.domicileState} onValueChange={(value) => formik.setFieldValue('domicileState', value)}>
                    <SelectTrigger className="h-12 border-slate-200">
                      <SelectValue placeholder="Select Your Domicile State" />
                    </SelectTrigger>
                    <SelectContent>
                      {INDIAN_STATES.map((state) => (
                        <SelectItem key={state} value={state}>{state}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                )}
                {!profileIsComplete && <p className="text-[10px] text-slate-500 italic">10 plus years of study (Optional)</p>}
              </div>

              <div ref={(el) => { fieldRefs.current['category'] = el; }} className="space-y-2">
                <Label className="text-slate-700">Category <span className="text-red-500">*</span></Label>
                {profileIsComplete ? (
                  <div className="h-12 w-full rounded-lg border border-slate-200 bg-slate-50/50 px-4 flex items-center text-sm text-slate-600">
                    {NEET_CATEGORIES.find(c => c.value === formik.values.category)?.label || formik.values.category}
                  </div>
                ) : (
                  <Select value={formik.values.category} onValueChange={(value) => formik.setFieldValue('category', value)}>
                    <SelectTrigger className={`h-12 border-slate-200 ${formik.touched.category && formik.errors.category ? 'border-red-500' : ''}`}>
                      <SelectValue placeholder="Select Category" />
                    </SelectTrigger>
                    <SelectContent>
                      {NEET_CATEGORIES.map((cat) => (
                        <SelectItem key={cat.value} value={cat.value}>{cat.label}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                )}
              </div>

              <div ref={(el) => { fieldRefs.current['gender'] = el; }} className="space-y-2">
                <Label className="text-slate-700">Gender <span className="text-red-500">*</span></Label>
                {profileIsComplete ? (
                  <div className="h-12 w-full rounded-lg border border-slate-200 bg-slate-50/50 px-4 flex items-center text-sm text-slate-600">
                    {GENDERS.find(g => g.value === formik.values.gender)?.label || formik.values.gender}
                  </div>
                ) : (
                  <Select value={formik.values.gender} onValueChange={(value) => formik.setFieldValue('gender', value)}>
                    <SelectTrigger className={`h-12 border-slate-200 ${formik.touched.gender && formik.errors.gender ? 'border-red-500' : ''}`}>
                      <SelectValue placeholder="Select Gender" />
                    </SelectTrigger>
                    <SelectContent>
                      {GENDERS.map((gender) => (
                        <SelectItem key={gender.value} value={gender.value}>{gender.label}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                )}
              </div>

              <div ref={(el) => { fieldRefs.current['referralCode'] = el; }} className="space-y-2">
                <Label className="text-slate-700">Referral Code</Label>
                {profileIsComplete ? (
                  <div className="h-12 w-full rounded-lg border border-slate-200 bg-slate-50/50 px-4 flex items-center text-sm text-slate-600">
                    {formik.values.referralCode || 'None'}
                  </div>
                ) : (
                  <Select value={formik.values.referralCode} onValueChange={(value) => formik.setFieldValue('referralCode', value)}>
                    <SelectTrigger className="h-12 border-slate-200">
                      <SelectValue placeholder="Select Referral Code (Optional)" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="none">None</SelectItem>
                      {referralCodes.map((ref) => (
                        <SelectItem key={ref.code} value={ref.code}>{ref.code} {ref.description ? `- ${ref.description}` : ''}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                )}
              </div>
            </div>

            {!profileIsComplete && (
              <div className="mt-10 pt-8 border-t border-slate-100 space-y-4" ref={(el) => { fieldRefs.current['confirmAccuracy'] = el; }}>
                <div className="flex items-start gap-4 p-4 bg-slate-50/50 rounded-xl border border-dashed border-slate-200">
                  <div className="mt-0.5">
                    <Checkbox
                      id="confirmAccuracy"
                      checked={formik.values.confirmAccuracy}
                      onCheckedChange={(checked) => formik.setFieldValue('confirmAccuracy', checked === true)}
                    />
                  </div>
                  <Label htmlFor="confirmAccuracy" className="text-sm text-slate-600 leading-relaxed cursor-pointer select-none font-normal">
                    I confirm that all the information provided is accurate and final. I agree to proceed with the entered details and understand that basic details cannot be modified later. <span className="text-red-500">*</span>
                  </Label>
                </div>
                {formik.touched.confirmAccuracy && formik.errors.confirmAccuracy && (
                  <p className="text-sm text-red-500 flex items-center gap-1 font-medium pl-4">
                    <AlertTriangle className="h-3 w-3" />
                    {String(formik.errors.confirmAccuracy)}
                  </p>
                )}
              </div>
            )}
          </section>

          <div className="flex justify-center pt-8">
            {!profileIsComplete && (
              <Button
                type="submit"
                size="lg"
                className="h-12 sm:h-14 px-12 bg-gradient-to-r from-[#2F129B] to-[#6366F1] rounded-full font-medium text-base hover:shadow-xl transition-all w-full sm:w-auto"
                disabled={submitMutation.isPending}
              >
                {submitMutation.isPending ? (
                  <>
                    <Loader2 className="mr-2 h-5 w-5 animate-spin" />
                    Processing...
                  </>
                ) : (
                  <>
                    View Predicted Colleges
                    <ArrowRight className="ml-2 h-5 w-5" />
                  </>
                )}
              </Button>
            )}
          </div>
        </form>
      </main>

      <LogoutModal open={logoutOpen} onOpenChange={setLogoutOpen} />
    </div>
  );
}
