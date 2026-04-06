'use client';

import { useState, useEffect, useRef } from 'react';
import { useRouter } from 'next/navigation';
import { useFormik } from 'formik';
import * as Yup from 'yup';
import { Loader2, AlertTriangle, ArrowRight } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Checkbox } from '@/components/ui/checkbox';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { useAuth, useRequireAuth } from '@/lib/hooks';
import { useMutation, useQuery } from '@tanstack/react-query';
import {
  NEET_CATEGORIES,
  QUOTA_TYPES,
  INDIAN_STATES,
  GENDERS,
} from '@/lib/constants';
import { LogoutModal } from '@/components/modals';

// Validation schema using Yup
const studentInfoSchema = Yup.object({
  rank: Yup.string()
    .required('Rank is required')
    .matches(/^[0-9]+$/, 'Rank must be a valid number'),
  institution: Yup.string(),
  year: Yup.string().required('Year is required'),
  domicileState: Yup.string().required('Domicile state is required'),
  category: Yup.string().required('Category is required'),
  gender: Yup.string().required('Gender is required'),
  counsellingType: Yup.string().required('Counselling type is required'),
  preferredBranch: Yup.string().required('Preferred branch is required'),
  preference1: Yup.string().required('1st preference is required'),
  preference2: Yup.string(),
  preference3: Yup.string(),
  confirmAccuracy: Yup.boolean()
    .oneOf([true], 'Please confirm the information is accurate')
    .required('Please confirm the information is accurate'),
});

export default function StudentInfoPage() {
  const router = useRouter();
  const { user, loading: authLoading } = useAuth();
  const { isAuthorized } = useRequireAuth(['student']);
  const [logoutOpen, setLogoutOpen] = useState(false);

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
  const courses = coursesData?.courses || [];
  const student = profileData?.student;
  const profileIsComplete = !!student && (student.rank > 0 || student.isProfileComplete);

  const submitMutation = useMutation({
    mutationFn: async (data: any) => {
      // First save profile
      const profileResponse = await fetch('/api/students/profile', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          rank: parseInt(data.rank),
          yearOfPassing: parseInt(data.year),
          category: data.category,
          gender: data.gender,
          institution: data.institution || '',
          domicileState: data.domicileState,
          counsellingType: data.counsellingType,
          preferredBranch: data.preferredBranch,
          locationPreference1: data.preference1,
          locationPreference2: data.preference2,
          locationPreference3: data.preference3,
        }),
      });

      if (!profileResponse.ok) {
        const error = await profileResponse.json();
        throw new Error(error.error || 'Failed to save profile');
      }

      // Then get eligible colleges — track=true increments checksUsed and creates lead
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
    onSuccess: (data) => {
      // Store result in sessionStorage and redirect
      sessionStorage.setItem('collegeResult', JSON.stringify(data));
      router.push('/student/result');
    },
  });

  // Formik setup
  const formik = useFormik({
    initialValues: {
      rank: student?.rank?.toString() || '',
      institution: student?.institution || '',
      year: student?.yearOfPassing?.toString() || currentYear.toString(),
      domicileState: student?.domicileState || '',
      category: student?.category || '',
      gender: student?.gender || '',
      counsellingType: student?.counsellingType || '',
      preferredBranch: student?.preferredBranch || '',
      preference1: student?.locationPreference1 || '',
      preference2: student?.locationPreference2 || '',
      preference3: student?.locationPreference3 || '',
      confirmAccuracy: profileIsComplete ? true : false,
    },
    enableReinitialize: true, // re-populate when profileData loads
    validationSchema: studentInfoSchema,
    validateOnChange: true,
    validateOnBlur: true,
    onSubmit: (values) => {
      submitMutation.mutate(values);
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

  if (authLoading || !isAuthorized || !profileData) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-slate-50">
        <Loader2 className="h-8 w-8 animate-spin text-indigo-600" />
      </div>
    );
  }

  const checksRemaining = 2 - (student?.checksUsed || 0);

  return (
    <div className="min-h-screen bg-slate-50">
      {/* Main Content */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="mb-8">
          <h1 className="text-2xl sm:text-3xl font-bold text-[#1E1E1E]">Enter Your Details</h1>
          {profileIsComplete ? (
            <div className="mt-3 flex items-start gap-2 p-3 bg-blue-50 border border-blue-200 rounded-lg">
              <svg className="h-5 w-5 text-blue-500 mt-0.5 flex-shrink-0" fill="currentColor" viewBox="0 0 20 20">
                <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2v3a1 1 0 001 1h1a1 1 0 100-2v-3a1 1 0 00-1-1H9z" clipRule="evenodd" />
              </svg>
              <p className="text-sm text-blue-700">
                Your details have been saved and <strong>cannot be changed</strong>. View your college predictions below.
              </p>
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

          {/* Basic and Academic Details */}
          <section>
            <h2 className="text-lg font-medium text-[#2F129B] mb-6">Basic and Academic Details</h2>

            <div className="grid md:grid-cols-2 gap-4">
              {/* Rank Field */}
              <div
                className="space-y-2 transition-all duration-200 rounded-lg p-2 -m-2"
                ref={(el) => { fieldRefs.current['rank'] = el; }}
              >
                <Label htmlFor="rank">Rank <span className="text-red-500">*</span></Label>
                <Input
                  id="rank"
                  name="rank"
                  type="number"
                  placeholder="Enter Your Rank"
                  className={`h-12 ${formik.touched.rank && formik.errors.rank ? 'border-red-500 focus-visible:ring-red-500' : ''} ${profileIsComplete ? 'bg-slate-50 cursor-not-allowed opacity-70' : ''}`}
                  value={formik.values.rank}
                  onChange={formik.handleChange}
                  onBlur={formik.handleBlur}
                  disabled={profileIsComplete}
                />
                {formik.touched.rank && formik.errors.rank && (
                  <p className="text-sm text-red-500 flex items-center gap-1">
                    <AlertTriangle className="h-3 w-3" />
                    {String(formik.errors.rank)}
                  </p>
                )}
              </div>

              {/* Institution Field */}
              <div
                className="space-y-2 transition-all duration-200 rounded-lg p-2 -m-2"
                ref={(el) => { fieldRefs.current['institution'] = el; }}
              >
                <Label htmlFor="institution">Institution</Label>
                <Input
                  id="institution"
                  name="institution"
                  placeholder="Enter the Institution"
                  className={`h-12 ${profileIsComplete ? 'bg-slate-50 cursor-not-allowed opacity-70' : ''}`}
                  value={formik.values.institution}
                  onChange={formik.handleChange}
                  onBlur={formik.handleBlur}
                  disabled={profileIsComplete}
                />
              </div>

              {/* Year Field */}
              <div
                className="space-y-2 transition-all duration-200 rounded-lg p-2 -m-2"
                ref={(el) => { fieldRefs.current['year'] = el; }}
              >
                <Label>Year <span className="text-red-500">*</span></Label>
                <Select
                  value={formik.values.year}
                  onValueChange={(value) => formik.setFieldValue('year', value)}
                  disabled={profileIsComplete}
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
                {formik.touched.year && formik.errors.year && (
                  <p className="text-sm text-red-500 flex items-center gap-1">
                    <AlertTriangle className="h-3 w-3" />
                    {String(formik.errors.year)}
                  </p>
                )}
              </div>

              {/* Domicile State Field */}
              <div
                className="space-y-2 transition-all duration-200 rounded-lg p-2 -m-2"
                ref={(el) => { fieldRefs.current['domicileState'] = el; }}
              >
                <Label>Domicile State <span className="text-red-500">*</span></Label>
                <Select
                  value={formik.values.domicileState}
                  onValueChange={(value) => formik.setFieldValue('domicileState', value)}
                  disabled={profileIsComplete}
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
                <Select
                  value={formik.values.category}
                  onValueChange={(value) => formik.setFieldValue('category', value)}
                  disabled={profileIsComplete}
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
                <Select
                  value={formik.values.gender}
                  onValueChange={(value) => formik.setFieldValue('gender', value)}
                  disabled={profileIsComplete}
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
                {formik.touched.gender && formik.errors.gender && (
                  <p className="text-sm text-red-500 flex items-center gap-1">
                    <AlertTriangle className="h-3 w-3" />
                    {String(formik.errors.gender)}
                  </p>
                )}
              </div>
            </div>
          </section>

          {/* Course and Location Preference */}
          <section>
            <h2 className="text-lg font-semibold text-[#2F129B] mb-6">Course and Location Preference</h2>

            <div className="grid md:grid-cols-2 gap-6">
              {/* Counselling Type Field */}
              <div
                className="space-y-2 transition-all duration-200 rounded-lg p-2 -m-2"
                ref={(el) => { fieldRefs.current['counsellingType'] = el; }}
              >
                <Label>Counselling Type <span className="text-red-500">*</span></Label>
                <Select
                  value={formik.values.counsellingType}
                  onValueChange={(value) => formik.setFieldValue('counsellingType', value)}
                  disabled={profileIsComplete}
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
                <Select
                  value={formik.values.preferredBranch}
                  onValueChange={(value) => formik.setFieldValue('preferredBranch', value)}
                  disabled={profileIsComplete}
                >
                  <SelectTrigger className={`h-12 ${formik.touched.preferredBranch && formik.errors.preferredBranch ? 'border-red-500' : ''}`}>
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
                Interested Study Location ( Select 3 locations according to your preference )
              </Label>
              <div className="grid md:grid-cols-3 gap-4">
                {/* Preference 1 */}
                <div
                  className="space-y-2 transition-all duration-200 rounded-lg p-2 -m-2"
                  ref={(el) => { fieldRefs.current['preference1'] = el; }}
                >
                  <Select
                    value={formik.values.preference1}
                    onValueChange={(value) => formik.setFieldValue('preference1', value)}
                    disabled={profileIsComplete}
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
                  {formik.touched.preference1 && formik.errors.preference1 && (
                    <p className="text-sm text-red-500 flex items-center gap-1">
                      <AlertTriangle className="h-3 w-3" />
                      {String(formik.errors.preference1)}
                    </p>
                  )}
                </div>

                {/* Preference 2 */}
                <div className="space-y-2">
                  <Select
                    value={formik.values.preference2}
                    onValueChange={(value) => formik.setFieldValue('preference2', value)}
                    disabled={profileIsComplete}
                  >
                    <SelectTrigger className="h-12">
                      <SelectValue placeholder="2nd Preference" />
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
                </div>

                {/* Preference 3 */}
                <div className="space-y-2">
                  <Select
                    value={formik.values.preference3}
                    onValueChange={(value) => formik.setFieldValue('preference3', value)}
                    disabled={profileIsComplete}
                  >
                    <SelectTrigger className="h-12">
                      <SelectValue placeholder="3rd Preference" />
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
                </div>
              </div>
            </div>
          </section>

          {!profileIsComplete && (
            <div
              className="space-y-2 transition-all duration-200 rounded-lg p-2 -m-2"
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

          {/* Submit / View Results Button */}
          <div className="flex justify-center pt-4">
            {profileIsComplete ? (
              <Button
                type="button"
                size="lg"
                className="h-14 px-12 bg-gradient-to-r from-[#2F129B] to-[#6366F1] rounded-full font-normal text-base hover:shadow-lg transition-all"
                onClick={() => router.push('/student/result')}
              >
                View My Results
                <ArrowRight className="ml-2 h-5 w-5" />
              </Button>
            ) : (
              <Button
                type="submit"
                size="lg"
                className="h-14 px-12 bg-gradient-to-r from-[#2F129B] to-[#6366F1] rounded-full font-normal text-base hover:shadow-lg transition-all"
                disabled={submitMutation.isPending || checksRemaining <= 0}
              >
                {submitMutation.isPending ? (
                  <>
                    <Loader2 className="mr-2 h-5 w-5 animate-spin" />
                    Processing...
                  </>
                ) : (
                  <>
                    Save and Continue
                    <ArrowRight className="ml-2 h-5 w-5" />
                  </>
                )}
              </Button>
            )}
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
