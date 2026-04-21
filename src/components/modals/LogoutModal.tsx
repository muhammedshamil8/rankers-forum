'use client';

import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { useAuthActions } from '@/lib/hooks';
import { Loader2 } from 'lucide-react';

interface LogoutModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export function LogoutModal({ open, onOpenChange }: LogoutModalProps) {
  const { logout, loading } = useAuthActions();

  const handleLogout = async () => {
    try {
      await logout();
      onOpenChange(false);
    } catch {
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-sm">
        <DialogHeader>
          <DialogTitle className="text-2xl font-bold">Logout</DialogTitle>
          <DialogDescription className="sr-only">
            Are you sure you want to log out?
          </DialogDescription>
        </DialogHeader>

        <p className="text-center text-slate-600 py-4">
          You will be logged out of your account.
        </p>

        <div className="flex gap-4">
          <Button
            variant="outline"
            className="flex-1 h-11 rounded-full"
            onClick={() => onOpenChange(false)}
          >
            Cancel
          </Button>
          <Button
            variant="destructive"
            className="flex-1 h-11 rounded-full bg-red-500 hover:bg-red-600"
            onClick={handleLogout}
            disabled={loading}
          >
            {loading ? (
              <Loader2 className="h-4 w-4 animate-spin" />
            ) : (
              'Logout'
            )}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
