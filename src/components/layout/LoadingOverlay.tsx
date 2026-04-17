'use client';

import { Loader2 } from 'lucide-react';
import { cn } from '@/lib/utils';

interface LoadingOverlayProps {
  isVisible: boolean;
  message?: string;
}

export function LoadingOverlay({ isVisible, message = 'Processing...' }: LoadingOverlayProps) {
  if (!isVisible) return null;

  return (
    <div className="fixed inset-0 z-[9999] flex items-center justify-center bg-white/80 backdrop-blur-sm animate-in fade-in duration-300">
      <div className="flex flex-col items-center gap-4 p-8 rounded-2xl bg-white shadow-2xl border border-slate-100 animate-in zoom-in-95 duration-300">
        <div className="relative">
          <div className="absolute inset-0 rounded-full bg-indigo-100 animate-ping opacity-25" />
          <Loader2 className="h-12 w-12 animate-spin text-indigo-600 relative z-10" />
        </div>
        <div className="flex flex-col items-center gap-1">
          <p className="text-lg font-semibold text-slate-900">{message}</p>
          <p className="text-sm text-slate-500">Please wait a moment</p>
        </div>
      </div>
    </div>
  );
}
