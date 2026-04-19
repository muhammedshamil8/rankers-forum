'use client';

import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { Loader2, ArrowRight } from 'lucide-react';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
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
import { useAuthActions } from '@/lib/hooks';
import { INDIAN_STATES } from '@/lib/constants';
import { isValidPhoneNumber, normalizePhoneNumber } from '@/lib/phone';

// Step 1 schema - Contact & Personal info
const step1Schema = z.object({
  phone: z.string()
    .trim()
    .min(1, 'Phone number is required')
    .refine((value) => isValidPhoneNumber(value), 'Enter a valid phone number')
    .transform((value) => normalizePhoneNumber(value)),
  email: z.string().email('Please enter a valid email address (@ and domain required)'),
  firstName: z.string().trim().min(1, 'First name is required'),
  lastName: z.string().trim().min(1, 'Last name is required'),
  city: z.string().trim().min(1, 'City is required'),
  state: z.string().trim().min(1, 'State is required'),
});

// Step 2 schema - Password
const step2Schema = z.object({
  password: z.string().min(6, 'Password must be at least 6 characters'),
  confirmPassword: z.string(),
}).refine((data) => data.password === data.confirmPassword, {
  message: "Passwords don't match",
  path: ['confirmPassword'],
});

type Step1Data = z.infer<typeof step1Schema>;
type Step2Data = z.infer<typeof step2Schema>;

interface RegisterModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onLoginClick: () => void;
  onSuccess?: () => void;
}

export function RegisterModal({
  open,
  onOpenChange,
  onLoginClick,
  onSuccess,
}: RegisterModalProps) {
  const { registerUser, loginWithGoogle, loading, error, clearError } = useAuthActions();
  const [step, setStep] = useState(1);
  const [step1Data, setStep1Data] = useState<Step1Data | null>(null);
  const [googleLoading, setGoogleLoading] = useState(false);

  const step1Form = useForm<Step1Data>({
    resolver: zodResolver(step1Schema),
    defaultValues: {
      phone: '',
      email: '',
      firstName: '',
      lastName: '',
      city: '',
      state: '',
    },
  });

  const step2Form = useForm<Step2Data>({
    resolver: zodResolver(step2Schema),
    defaultValues: {
      password: '',
      confirmPassword: '',
    },
  });

  const handleStep1Submit = (data: Step1Data) => {
    setStep1Data(data);
    setStep(2);
  };

  const handleStep2Submit = async (data: Step2Data) => {
    if (!step1Data) return;

    try {
      clearError();
      await registerUser({
        email: step1Data.email,
        password: data.password,
        firstName: step1Data.firstName,
        lastName: step1Data.lastName,
        phone: step1Data.phone,
        city: step1Data.city,
        state: step1Data.state,
      });
      // Reset all forms
      step1Form.reset();
      step2Form.reset();
      setStep(1);
      setStep1Data(null);
      onOpenChange(false);
      setTimeout(() => {
        onSuccess?.();
      }, 50);
    } catch {
      // Error is handled by useAuthActions
    }
  };

  const handleGoogleSignUp = async () => {
    try {
      setGoogleLoading(true);
      clearError();
      await loginWithGoogle();
      onOpenChange(false);
      setTimeout(() => {
        onSuccess?.();
      }, 50);
    } catch {
      // Error is handled by useAuthActions
    } finally {
      setGoogleLoading(false);
    }
  };

  const handleClose = (isOpen: boolean) => {
    if (!isOpen) {
      setStep(1);
      step1Form.reset();
      step2Form.reset();
    }
    onOpenChange(isOpen);
  };

  return (
    <Dialog open={open} onOpenChange={handleClose}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="text-2xl font-bold">
            {step === 1 ? 'Register' : 'Set Up New Password'}
          </DialogTitle>
        </DialogHeader>

        {error && (
          <div className="p-3 text-sm text-red-600 bg-red-50 rounded-lg border border-red-100">
            {error}
          </div>
        )}

        {step === 1 ? (
          <form onSubmit={step1Form.handleSubmit(handleStep1Submit)} className="space-y-4">
            {/* Phone Number */}
            <div className="space-y-2">
              <Label htmlFor="phone">Phone No.</Label>
              <Input
                id="phone"
                type="tel"
                placeholder="Enter Your Phone Number"
                className="h-12"
                {...step1Form.register('phone')}
              />
              {step1Form.formState.errors.phone && (
                <p className="text-sm text-red-500">{step1Form.formState.errors.phone.message}</p>
              )}
            </div>

            {/* Email */}
            <div className="space-y-2">
              <Label htmlFor="email">Email id</Label>
              <Input
                id="email"
                type="email"
                placeholder="Enter Your Email Address"
                className="h-12"
                {...step1Form.register('email')}
              />
              {step1Form.formState.errors.email && (
                <p className="text-sm text-red-500">{step1Form.formState.errors.email.message}</p>
              )}
            </div>

            {/* Full Name */}
            <div className="space-y-2">
              <Label>Full Name</Label>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <Input
                    placeholder="First Name"
                    className="h-12"
                    {...step1Form.register('firstName')}
                  />
                  {step1Form.formState.errors.firstName && (
                    <p className="text-sm text-red-500 mt-1">{step1Form.formState.errors.firstName.message}</p>
                  )}
                </div>
                <div>
                  <Input
                    placeholder="Last Name"
                    className="h-12"
                    {...step1Form.register('lastName')}
                  />
                  {step1Form.formState.errors.lastName && (
                    <p className="text-sm text-red-500 mt-1">{step1Form.formState.errors.lastName.message}</p>
                  )}
                </div>
              </div>
            </div>

            {/* Location */}
            <div className="space-y-2">
              <Label>Location</Label>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <Input
                    placeholder="City"
                    className="h-12"
                    {...step1Form.register('city')}
                  />
                  {step1Form.formState.errors.city && (
                    <p className="text-sm text-red-500 mt-1">{step1Form.formState.errors.city.message}</p>
                  )}
                </div>
                <div>
                  <Select onValueChange={(value) => step1Form.setValue('state', value)}>
                    <SelectTrigger className="h-12">
                      <SelectValue placeholder="State" />
                    </SelectTrigger>
                    <SelectContent>
                      {INDIAN_STATES.map((state) => (
                        <SelectItem key={state} value={state}>
                          {state}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  {step1Form.formState.errors.state && (
                    <p className="text-sm text-red-500 mt-1">{step1Form.formState.errors.state.message}</p>
                  )}
                </div>
              </div>
            </div>

            <Button type="submit" className="w-full h-12 rounded-full" size="lg">
              Next
              <ArrowRight className="ml-2 h-4 w-4" />
            </Button>

            <div className="relative my-4">
              <div className="absolute inset-0 flex items-center">
                <span className="w-full border-t border-slate-200" />
              </div>
              <div className="relative flex justify-center text-sm">
                <span className="bg-white px-4 text-slate-500">Or</span>
              </div>
            </div>

            <Button
              type="button"
              variant="outline"
              className="w-full h-12 rounded-full cursor-pointer"
              size="lg"
              onClick={handleGoogleSignUp}
              disabled={googleLoading}
            >
              {googleLoading ? (
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              ) : (
                <svg className="mr-2 h-5 w-5" viewBox="0 0 24 24">
                  <path
                    d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
                    fill="#4285F4"
                  />
                  <path
                    d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
                    fill="#34A853"
                  />
                  <path
                    d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"
                    fill="#FBBC05"
                  />
                  <path
                    d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"
                    fill="#EA4335"
                  />
                </svg>
              )}
              Continue with Google
            </Button>

            <p className="text-center text-sm text-slate-600">
              Already have an account?{' '}
              <button
                type="button"
                onClick={onLoginClick}
                className="text-indigo-600 hover:text-indigo-700 font-semibold cursor-pointer"
              >
                Log in
              </button>
            </p>
          </form>
        ) : (
          <form onSubmit={step2Form.handleSubmit(handleStep2Submit)} className="space-y-5">
            {/* Password */}
            <div className="space-y-2">
              <Label htmlFor="password">Password</Label>
              <Input
                id="password"
                type="password"
                placeholder="Enter Password"
                className="h-12"
                {...step2Form.register('password')}
              />
              {step2Form.formState.errors.password && (
                <p className="text-sm text-red-500">{step2Form.formState.errors.password.message}</p>
              )}
            </div>

            {/* Confirm Password */}
            <div className="space-y-2">
              <Label htmlFor="confirmPassword">Confirm Password</Label>
              <Input
                id="confirmPassword"
                type="password"
                placeholder="Confirm Password"
                className="h-12"
                {...step2Form.register('confirmPassword')}
              />
              {step2Form.formState.errors.confirmPassword && (
                <p className="text-sm text-red-500">{step2Form.formState.errors.confirmPassword.message}</p>
              )}
            </div>

            <p className="text-center text-sm text-slate-500">
              By registering you accept our{' '}
              <a href="/terms" className="text-indigo-600 hover:text-indigo-700 font-semibold cursor-pointer">
                Terms & Conditions
              </a>
              .
            </p>

            <Button type="submit" className="w-full h-12 rounded-full cursor-pointer" size="lg" disabled={loading}>
              {loading ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Creating account...
                </>
              ) : (
                <>
                  Continue
                  <ArrowRight className="ml-2 h-4 w-4" />
                </>
              )}
            </Button>
          </form>
        )}
      </DialogContent>
    </Dialog>
  );
}
