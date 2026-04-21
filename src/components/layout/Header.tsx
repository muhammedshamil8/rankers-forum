'use client';

import { useState } from 'react';
import Link from 'next/link';
import { Menu, X, Phone } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useAuth, getRedirectUrl } from '@/lib/hooks';
import { LoginModal, RegisterModal, ForgotPasswordModal, LogoutModal } from '@/components/modals';

export function Header() {
  const { user, loading } = useAuth();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [loginOpen, setLoginOpen] = useState(false);
  const [registerOpen, setRegisterOpen] = useState(false);
  const [forgotPasswordOpen, setForgotPasswordOpen] = useState(false);
  const [logoutOpen, setLogoutOpen] = useState(false);

  const handleRegisterClick = () => {
    setLoginOpen(false);
    setRegisterOpen(true);
  };

  const handleLoginClick = () => {
    setRegisterOpen(false);
    setForgotPasswordOpen(false);
    setLoginOpen(true);
  };

  const handleForgotPasswordClick = () => {
    setLoginOpen(false);
    setForgotPasswordOpen(true);
  };

  const getDashboardLink = () => {
    if (!user) return '/';
    return getRedirectUrl(user);
  };

  return (
    <>
      <header className="sticky top-0 z-50 w-full bg-white/80 backdrop-blur-lg border-b border-slate-100">
        <nav className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="flex h-16 items-center justify-between">
            <Link href="/" className="flex items-center gap-2">
              <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-gradient-to-br from-indigo-600 to-violet-600">
                <span className="text-white font-bold text-lg">R</span>
              </div>
              <span className="font-bold text-xl text-slate-900">
                Rankers <span className="text-indigo-600">Forum</span>
              </span>
            </Link>

            <div className="hidden md:flex md:items-center md:gap-8">
              <a href="#how-it-works" className="text-sm font-medium text-slate-600 hover:text-slate-900 transition-colors">
                How it Works
              </a>
              <a href="#features" className="text-sm font-medium text-slate-600 hover:text-slate-900 transition-colors">
                Features
              </a>
              <a href="#faq" className="text-sm font-medium text-slate-600 hover:text-slate-900 transition-colors">
                FAQ
              </a>
              <a href="#contact" className="text-sm font-medium text-slate-600 hover:text-slate-900 transition-colors">
                Contact
              </a>
            </div>

            <div className="hidden md:flex md:items-center md:gap-3">
              {loading ? (
                <div className="h-11 w-24 bg-slate-100 rounded-lg animate-pulse" />
              ) : user ? (
                <>
                  <Link href={getDashboardLink()}>
                    <Button variant="outline">Dashboard</Button>
                  </Link>
                  <Button variant="ghost" onClick={() => setLogoutOpen(true)}>
                    Logout
                  </Button>
                </>
              ) : (
                <>
                  <Button variant="ghost" onClick={() => setLoginOpen(true)}>
                    Login
                  </Button>
                  <Button onClick={() => setRegisterOpen(true)}>
                    Register
                  </Button>
                </>
              )}
            </div>

            <button
              type="button"
              className="md:hidden p-2 text-slate-600"
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
            >
              {mobileMenuOpen ? (
                <X className="h-6 w-6" />
              ) : (
                <Menu className="h-6 w-6" />
              )}
            </button>
          </div>

          {mobileMenuOpen && (
            <div className="md:hidden py-4 border-t border-slate-100">
              <div className="flex flex-col gap-4">
                <a href="#how-it-works" className="text-sm font-medium text-slate-600 hover:text-slate-900">
                  How it Works
                </a>
                <a href="#features" className="text-sm font-medium text-slate-600 hover:text-slate-900">
                  Features
                </a>
                <a href="#faq" className="text-sm font-medium text-slate-600 hover:text-slate-900">
                  FAQ
                </a>
                <a href="#contact" className="text-sm font-medium text-slate-600 hover:text-slate-900">
                  Contact
                </a>
                <div className="flex flex-col gap-2 pt-4 border-t border-slate-100">
                  {user ? (
                    <>
                      <Link href={getDashboardLink()}>
                        <Button variant="outline" className="w-full">Dashboard</Button>
                      </Link>
                      <Button variant="ghost" className="w-full" onClick={() => setLogoutOpen(true)}>
                        Logout
                      </Button>
                    </>
                  ) : (
                    <>
                      <Button variant="outline" className="w-full cursor-pointer" onClick={() => setLoginOpen(true)}>
                        Login
                      </Button>
                      <Button className="w-full cursor-pointer" onClick={() => setRegisterOpen(true)}>
                        Register
                      </Button>
                    </>
                  )}
                </div>
              </div>
            </div>
          )}
        </nav>
      </header>

      <LoginModal
        open={loginOpen}
        onOpenChange={setLoginOpen}
        onRegisterClick={handleRegisterClick}
        onForgotPasswordClick={handleForgotPasswordClick}
      />
      <RegisterModal
        open={registerOpen}
        onOpenChange={setRegisterOpen}
        onLoginClick={handleLoginClick}
      />
      <ForgotPasswordModal
        open={forgotPasswordOpen}
        onOpenChange={setForgotPasswordOpen}
        onLoginClick={handleLoginClick}
      />
      <LogoutModal
        open={logoutOpen}
        onOpenChange={setLogoutOpen}
      />
    </>
  );
}
