'use client';

import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@radix-ui/react-dropdown-menu';
import { LogOut, User, Settings, Shield, LayoutDashboard } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useAuthActions } from '@/lib/hooks/useAuthActions';
import { useRouter } from 'next/navigation';
import { getRedirectUrl } from '@/lib/hooks';

interface UserMenuProps {
  user: any; // User from useAuth
}

export function UserMenu({ user }: UserMenuProps) {
  const router = useRouter();
  const { logout } = useAuthActions();

  const handleProfileClick = () => {
    if (user.role === 'student') {
      router.push('/student/info');
    } else {
      router.push(getRedirectUrl(user));
    }
  };

  const getInitials = (name: string) => {
    if (!name) return 'U';
    return name
      .split(' ')
      .map((n) => n[0])
      .filter(Boolean)
      .join('')
      .toUpperCase()
      .substring(0, 2);
  };

  const displayName = user.firstName ? `${user.firstName} ${user.lastName}` : (user.displayName || user.email || 'User');

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <button className="flex items-center cursor-pointer justify-center w-10 h-10 rounded-full bg-slate-400 text-white shadow-md hover:opacity-90 transition-all active:scale-95 focus:outline-hidden">
          {user.photoURL ? (
            <img
              src={user.photoURL}
              alt={displayName}
              className="w-full h-full rounded-full object-cover"
            />
          ) : (
            <span className="text-sm font-medium">
              {getInitials(displayName)}
            </span>
          )}
        </button>
      </DropdownMenuTrigger>
      <DropdownMenuContent 
        className="z-50 min-w-[200px] overflow-hidden rounded-xl border border-slate-200 bg-white p-1 shadow-xl animate-in fade-in zoom-in-95 duration-200 mt-2" 
        align="end"
      >
        <DropdownMenuLabel className="px-3 py-2 text-sm">
          <div className="flex flex-col space-y-1">
            <p className="font-semibold text-slate-900 leading-none">
              {displayName}
            </p>
            <p className="text-xs text-slate-500 leading-none truncate max-w-[180px]">
              {user.email}
            </p>
            <div className="mt-1">
               <span className="inline-flex items-center px-2 py-0.5 rounded text-[10px] font-medium bg-blue-50 text-blue-700 capitalize">
                 {user.role}
               </span>
            </div>
          </div>
        </DropdownMenuLabel>
        <DropdownMenuSeparator className="h-px bg-slate-100 my-1" />
        
        <DropdownMenuItem 
          className="relative flex cursor-pointer select-none items-center rounded-lg px-3 py-2 text-sm text-slate-700 outline-hidden transition-colors hover:bg-slate-50 focus:bg-slate-50"
          onClick={handleProfileClick}
        >
          {user.role === 'student' ? <User className="mr-2 h-4 w-4" /> : <LayoutDashboard className="mr-2 h-4 w-4" />}
          <span>{user.role === 'student' ? 'Profile' : 'Dashboard'}</span>
        </DropdownMenuItem>
        
        <DropdownMenuSeparator className="h-px bg-slate-100 my-1" />
        
        <DropdownMenuItem 
          className="relative flex cursor-pointer select-none items-center rounded-lg px-3 py-2 text-sm text-red-600 outline-hidden transition-colors hover:bg-red-50 focus:bg-red-50"
          onClick={() => logout()}
        >
          <LogOut className="mr-2 h-4 w-4" />
          <span>Logout</span>
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
