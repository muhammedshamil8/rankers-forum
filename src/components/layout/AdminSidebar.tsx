'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import {
  GraduationCap,
  LayoutDashboard,
  Users,
  Building2,
  UserCog,
  UserCircle,
  LogOut,
} from 'lucide-react';
import { useAuth } from '@/lib/hooks';
import { cn } from '@/lib/utils';
import { Button } from '../ui/button';
import Image from 'next/image';

const superAdminLinks = [
  { href: '/super-admin/dashboard', label: 'Dashboard', icon: LayoutDashboard },
  { href: '/super-admin/students', label: 'Students', icon: Users },
  { href: '/super-admin/colleges', label: 'College', icon: Building2 },
  { href: '/super-admin/referral-codes', label: 'Referral Codes', icon: GraduationCap }, 
  { href: '/super-admin/admins', label: 'Admin', icon: UserCog },
  { href: '/super-admin/profile', label: 'Profile', icon: UserCircle },
];

const adminLinks = [
  { href: '/admin/dashboard', label: 'Dashboard', icon: LayoutDashboard },
  { href: '/admin/leads', label: 'Leads', icon: Users },
];

interface AdminSidebarProps {
  onLogoutClick?: () => void;
}

export function AdminSidebar({ onLogoutClick }: AdminSidebarProps) {
  const pathname = usePathname();
  const { user } = useAuth();

  const links = user?.role === 'admin' ? adminLinks : superAdminLinks;

  return (
    <aside className="w-64 bg-white text-white flex flex-col shadow-md border-r border-slate-100 fixed inset-y-0 left-0 z-50">
      <div className="p-6 ">
        <Image
          src="/logoBlue.svg"
          alt="Rankers Forum Logo"
          width={160}
          height={45}
          className="object-contain w-[100px] h-[32px] md:w-[160px] md:h-[45px]"
          priority
        />
      </div>
      <nav className="flex-1 p-4 space-y-2">
        {links.map((link) => {
          const isActive = pathname === link.href || pathname.startsWith(link.href + '/');
          return (
            <Link
              key={link.href}
              href={link.href}
              className={cn(
                'flex items-center gap-3 px-4 py-3 rounded-lg text-sm font-medium transition-colors',
                isActive
                  ? 'bg-linear-to-r from-[#2F129B] to-[#3B82F6] text-white'
                  : 'text-[#4B5563] hover:text-gray-800 hover:bg-slate-200'
              )}
            >
              <link.icon className="h-5 w-5" />
              {link.label}
            </Link>
          );
        })}
      </nav>

      <div className="p-4">
        <div className="bg-gray-100 rounded-lg p-3">
          <div className="flex items-center gap-3 mb-3">
            {user?.avatarUrl ? (
              <Image
                src={user.avatarUrl}
                alt={`${user.firstName} ${user.lastName}`}
                width={40}
                height={40}
                className="w-10 h-10 rounded-full object-cover"
              />
            ) : (
              <div className="w-10 h-10 rounded-full bg-slate-700 flex items-center justify-center text-white font-medium">
                {user?.firstName?.[0]}{user?.lastName?.[0]}
              </div>
            )}
            <div className="flex-1 min-w-0">
              <p className="text-sm font-medium text-gray-700 truncate">
                {user?.firstName} {user?.lastName?.[0]}
              </p>
              <p className="text-xs text-gray-500 truncate">
                {user?.role === 'super_admin' ? 'Super Admin' : 'Admin'}
              </p>
            </div>
          </div>
          <Button
            variant="outline"
            className="w-full border-gray-300 text-gray-700 hover:bg-gray-50"
            size="sm"
            onClick={onLogoutClick}
          >
            <LogOut className="h-4 w-4 mr-2" />
            Logout
          </Button>
        </div>
      </div>
    </aside>
  );
}
