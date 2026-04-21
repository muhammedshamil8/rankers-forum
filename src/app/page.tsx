'use client';

import { useState, useEffect } from 'react';
import Image from 'next/image';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { ArrowRight, Building2, MapPin, Phone, Mail, Users } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useAuth, getRedirectUrl } from '@/lib/hooks';
import { Navbar, Footer } from '@/components/layout';
import { FAQ } from '@/components/home/FAQ';
import { CTA } from '@/components/home/CTA';
import { Features } from '@/components/home/Features';
import { HowItWorks } from '@/components/home/HowItWorks';
import { Hero } from '@/components/home/Hero';
import { LoginModal, RegisterModal, ForgotPasswordModal } from '@/components/modals';

import { ComingSoon } from '@/components/home/ComingSoon';


export default function LandingPage() {
  const router = useRouter();
  const { user, loading } = useAuth();
  const [loginOpen, setLoginOpen] = useState(false);
  const [registerOpen, setRegisterOpen] = useState(false);
  const [forgotPasswordOpen, setForgotPasswordOpen] = useState(false);

  const handleCheckColleges = () => {
    if (user) {
      router.push(getRedirectUrl(user));
    } else {
      setRegisterOpen(true);
    }
  };

  const handleAuthSuccess = () => {
    if (user) {
      router.push(getRedirectUrl(user));
    } else {
      router.push('/student/info');
    }
  };
  useEffect(() => {
  }, [loading, user, router]);


  return (
    <>
      {/* <ComingSoon /> */}
      
      <div className="min-h-screen bg-white">
        <Navbar
          user={user}
          loading={loading}
          onLoginClick={() => setLoginOpen(true)}
          onRegisterClick={() => setRegisterOpen(true)}
        />

        <Hero onCheckColleges={handleCheckColleges} />

        <HowItWorks />

        <Features />

        <CTA onAction={handleCheckColleges} />

        <FAQ />

        <Footer />

        <LoginModal
          open={loginOpen}
          onOpenChange={setLoginOpen}
          onRegisterClick={() => {
            setLoginOpen(false);
            setRegisterOpen(true);
          }}
          onForgotPasswordClick={() => {
            setLoginOpen(false);
            setForgotPasswordOpen(true);
          }}
          onSuccess={handleAuthSuccess}
        />

        <RegisterModal
          open={registerOpen}
          onOpenChange={setRegisterOpen}
          onLoginClick={() => {
            setRegisterOpen(false);
            setLoginOpen(true);
          }}
          onSuccess={handleAuthSuccess}
        />

        <ForgotPasswordModal
          open={forgotPasswordOpen}
          onOpenChange={setForgotPasswordOpen}
          onBackToLogin={() => {
            setForgotPasswordOpen(false);
            setLoginOpen(true);
          }}
        />
      </div>
     
    </>
  );
}
