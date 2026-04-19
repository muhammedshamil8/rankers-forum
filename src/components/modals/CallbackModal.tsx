'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { Loader2, Phone, AlertCircle, CheckCircle2, ArrowRight } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Checkbox } from '@/components/ui/checkbox';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from '@/components/ui/dialog';
import { useMutation, useQuery } from '@tanstack/react-query';

interface CallbackModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  hasStudentProfile: boolean;
}

export function CallbackModal({ 
  open, 
  onOpenChange,
  hasStudentProfile,
}: CallbackModalProps) {
  const router = useRouter();
  const [requestCallback, setRequestCallback] = useState(false);
  const [submitted, setSubmitted] = useState(false);
  const [navigatingToForm, setNavigatingToForm] = useState(false);

  // Check existing callback status
  const { data: callbackStatus, isLoading: statusLoading } = useQuery({
    queryKey: ['callback-status'],
    queryFn: async () => {
      const response = await fetch('/api/students/callback');
      if (!response.ok) return null;
      return response.json();
    },
    enabled: open && hasStudentProfile,
  });

  // Submit callback request
  const submitMutation = useMutation({
    mutationFn: async () => {
      const response = await fetch('/api/students/callback', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
      });
      
      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || 'Failed to submit callback request');
      }
      
      return response.json();
    },
    onSuccess: () => {
      setSubmitted(true);
    },
  });

  const resetModalState = () => {
    setSubmitted(false);
    setRequestCallback(false);
    submitMutation.reset();
  };

  const handleGoToForm = () => {
    if (navigatingToForm) return;

    setNavigatingToForm(true);
    resetModalState();
    onOpenChange(false);

    // Defer navigation by a frame so dialog close animation completes cleanly.
    requestAnimationFrame(() => {
      router.push('/student/info');
    });
  };

  const handleSubmit = () => {
    if (requestCallback) {
      submitMutation.mutate();
    } else {
      // Just close the modal
      onOpenChange(false);
    }
  };

  const handleClose = () => {
    resetModalState();
    setNavigatingToForm(false);
    onOpenChange(false);
  };

  // Show loading state
  if (statusLoading && hasStudentProfile) {
    return (
      <Dialog open={open} onOpenChange={handleClose}>
        <DialogContent className="sm:max-w-md [&>button]:hidden">
          <DialogTitle className="sr-only">Checking callback status</DialogTitle>
          <DialogDescription className="sr-only">Please wait while we check your callback request status.</DialogDescription>
          <div className="flex items-center justify-center py-8">
            <Loader2 className="h-8 w-8 animate-spin text-indigo-600" />
          </div>
        </DialogContent>
      </Dialog>
    );
  }

  // Show success state after submission
  if (submitted) {
    return (
      <Dialog open={open} onOpenChange={handleClose}>
        <DialogContent className="sm:max-w-md">
          <div className="flex flex-col items-center justify-center py-6 text-center">
            <div className="w-16 h-16 rounded-full bg-green-100 flex items-center justify-center mb-4">
              <CheckCircle2 className="h-8 w-8 text-green-600" />
            </div>
            <DialogTitle className="text-xl font-semibold text-slate-900 mb-2">
              Callback Request Submitted!
            </DialogTitle>
            <DialogDescription className="text-slate-600 mb-6">
              Our team will contact you shortly. Thank you for your interest!
            </DialogDescription>
            <Button onClick={handleClose} className="w-full bg-linear-to-br from-[#2F129B] to-[#3B82F6] hover:opacity-90">
              Close
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    );
  }

  // Show profile required state
  if (!hasStudentProfile) {
    return (
      <Dialog open={open} onOpenChange={handleClose}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <div className="flex items-center gap-3 mb-2">
              <div className="w-10 h-10 rounded-full bg-amber-100 flex items-center justify-center">
                <AlertCircle className="h-5 w-5 text-amber-600" />
              </div>
              <DialogTitle className="text-lg font-semibold">
                Complete Your Profile First
              </DialogTitle>
            </div>
            <DialogDescription className="text-slate-600">
              To request a callback, please fill in your student details first. This helps us provide personalized guidance.
            </DialogDescription>
          </DialogHeader>

          <div className="flex gap-3 mt-6">
            <Button variant="outline" onClick={handleClose} className="flex-1">
              Cancel
            </Button>
            <Button onClick={handleGoToForm} className="flex-1" disabled={navigatingToForm}>
              {navigatingToForm ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Opening...
                </>
              ) : (
                <>
                  Fill Details <ArrowRight className="ml-2 h-4 w-4" />
                </>
              )}
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    );
  }

  // Show already has pending callback
  if (callbackStatus?.pendingCallback) {
    return (
      <Dialog open={open} onOpenChange={handleClose}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <div className="flex items-center gap-3 mb-2">
              <div className="w-10 h-10 rounded-full bg-blue-100 flex items-center justify-center">
                <Phone className="h-5 w-5 text-blue-600" />
              </div>
              <DialogTitle className="text-lg font-semibold">
                Callback Already Requested
              </DialogTitle>
            </div>
            <DialogDescription className="text-slate-600">
              You already have a pending callback request. Our team will contact you soon!
            </DialogDescription>
          </DialogHeader>

          <div className="bg-blue-50 rounded-lg p-4 mt-4">
            <p className="text-sm text-blue-700">
              <span className="font-medium">Status:</span>{' '}
              {callbackStatus.pendingCallback.status === 'new' ? 'Pending Assignment' : 
               callbackStatus.pendingCallback.status === 'assigned' ? 'Assigned to Counsellor' :
               callbackStatus.pendingCallback.status === 'in_progress' ? 'In Progress' :
               callbackStatus.pendingCallback.status}
            </p>
          </div>

          <Button onClick={handleClose} className="w-full mt-6">
            Close
          </Button>
        </DialogContent>
      </Dialog>
    );
  }

  // Show callback request form
  return (
    <Dialog open={open} onOpenChange={handleClose}>
      <DialogContent className="sm:max-w-md [&>button]:hidden">
        <DialogHeader>
          <div className="flex items-center gap-3 mb-2">
            <div className="w-10 h-10 rounded-full bg-indigo-100 flex items-center justify-center">
              <Phone className="h-5 w-5 text-indigo-600" />
            </div>
            <DialogTitle className="text-lg font-semibold">
              Talk to a College Expert
            </DialogTitle>
          </div>
          <DialogDescription className="text-slate-600">
            Get personalized guidance about your college options.
          </DialogDescription>
        </DialogHeader>

        <div className="mt-4 space-y-4">
          <div className="bg-slate-50 rounded-lg p-4">
            <p className="text-sm text-slate-600">
             Get answers about your college selection and personalized guidance based on your profile
            </p>
          </div>

          <div className="flex items-start gap-3">
            <Checkbox
              id="requestCallback"
              checked={requestCallback}
              onCheckedChange={(checked) => setRequestCallback(checked === true)}
            />
            <label 
              htmlFor="requestCallback" 
              className="text-sm text-slate-700 cursor-pointer leading-relaxed"
            >
              Yes, I would like to receive a callback from a counsellor to discuss my college options.
            </label>
          </div>

          {submitMutation.error && (
            <div className="p-3 text-sm text-red-600 bg-red-50 rounded-lg border border-red-100">
              {submitMutation.error.message}
            </div>
          )}
        </div>

        <div className="flex gap-3 mt-6">
          <Button variant="outline" onClick={handleClose} className="flex-1">
            Cancel
          </Button>
          <Button 
            onClick={handleSubmit} 
            className="flex-1 bg-linear-to-br from-[#2F129B] to-[#3B82F6] hover:opacity-90"
            disabled={submitMutation.isPending || !requestCallback}
          >
            {submitMutation.isPending ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Submitting...
              </>
            ) : (
              'Request Callback'
            )}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
