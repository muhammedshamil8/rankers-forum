'use client';

import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { Loader2, CheckCircle2 } from 'lucide-react';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { useAuthActions } from '@/lib/hooks';

const forgotPasswordSchema = z.object({
  email: z.string().email('Please enter a valid email address'),
});

type ForgotPasswordFormData = z.infer<typeof forgotPasswordSchema>;

interface ForgotPasswordModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onLoginClick?: () => void;
  onBackToLogin?: () => void;
}

export function ForgotPasswordModal({
  open,
  onOpenChange,
  onLoginClick,
  onBackToLogin,
}: ForgotPasswordModalProps) {
  const handleBackToLogin = onBackToLogin || onLoginClick || (() => {});

  const { sendPasswordReset, loading, error, clearError } = useAuthActions();
  const [sent, setSent] = useState(false);

  const {
    register,
    handleSubmit,
    formState: { errors },
    reset,
  } = useForm<ForgotPasswordFormData>({
    resolver: zodResolver(forgotPasswordSchema),
  });

  const onSubmit = async (data: ForgotPasswordFormData) => {
    try {
      clearError();
      await sendPasswordReset(data.email);
      setSent(true);
    } catch {
      // Error is handled by useAuthActions
    }
  };

  const handleClose = (isOpen: boolean) => {
    if (!isOpen) {
      setSent(false);
      reset();
    }
    onOpenChange(isOpen);
  };

  return (
    <Dialog open={open} onOpenChange={handleClose}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="text-2xl">
            {sent ? 'Check Your Email' : 'Reset Password'}
          </DialogTitle>
          <DialogDescription className="sr-only">
            {sent ? 'Instructions sent to your email.' : 'Enter your email to reset your password.'}
          </DialogDescription>
        </DialogHeader>

        {sent ? (
          <div className="space-y-5 text-center py-4">
            <div className="flex justify-center">
              <CheckCircle2 className="h-16 w-16 text-emerald-500" />
            </div>
            <div className="space-y-2">
              <p className="text-slate-600">
                We&apos;ve sent a password reset link to your email address.
              </p>
              <p className="text-sm text-slate-500">
                Please check your inbox and follow the instructions to reset your password.
              </p>
            </div>
            <Button 
              className="w-full" 
              size="lg"
              onClick={handleBackToLogin}
            >
              Back to Login
            </Button>
          </div>
        ) : (
          <form onSubmit={handleSubmit(onSubmit)} className="space-y-5">
            {error && (
              <div className="p-3 text-sm text-red-600 bg-red-50 rounded-lg border border-red-100">
                {error}
              </div>
            )}

            <p className="text-slate-600">
              Enter your email address and we&apos;ll send you a link to reset your password.
            </p>

            <div className="space-y-2">
              <Label htmlFor="email">Email Address</Label>
              <Input
                id="email"
                type="email"
                placeholder="Enter Your Email Address"
                {...register('email')}
              />
              {errors.email && (
                <p className="text-sm text-red-500">{errors.email.message}</p>
              )}
            </div>

            <Button 
              type="submit" 
              className="w-full" 
              size="lg"
              disabled={loading}
            >
              {loading ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Sending...
                </>
              ) : (
                <>
                  Send Reset Link
                  <span className="ml-2">→</span>
                </>
              )}
            </Button>

            <p className="text-center text-sm text-slate-600">
              Remember your password?{' '}
              <button
                type="button"
                onClick={handleBackToLogin}
                className="text-indigo-600 hover:text-indigo-700 font-semibold"
              >
                Log in!
              </button>
            </p>
          </form>
        )}
      </DialogContent>
    </Dialog>
  );
}
