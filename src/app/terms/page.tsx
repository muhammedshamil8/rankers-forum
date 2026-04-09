'use client';

import { useState } from 'react';
import { Navbar, Footer } from '@/components/layout';
import { useAuth } from '@/lib/hooks';
import { LoginModal, RegisterModal, ForgotPasswordModal } from '@/components/modals';

export default function TermsAndConditions() {
  const { user, loading } = useAuth();
  const [loginOpen, setLoginOpen] = useState(false);
  const [registerOpen, setRegisterOpen] = useState(false);
  const [forgotPasswordOpen, setForgotPasswordOpen] = useState(false);

  return (
    <div className="min-h-screen bg-white">
      <Navbar
        user={user}
        loading={loading}
        onLoginClick={() => setLoginOpen(true)}
        onRegisterClick={() => setRegisterOpen(true)}
      />

      <main className="max-w-4xl mx-auto px-4 pt-32 pb-20">
        <h1 className="text-4xl font-bold text-slate-900 mb-8 font-poppins">Terms & Conditions</h1>
        
        <div className="prose prose-slate max-w-none space-y-6 text-slate-600 leading-relaxed">
          <section>
            <h2 className="text-2xl font-semibold text-slate-800 mb-4">1. Acceptance of Terms</h2>
            <p>
              By accessing or using Rankers Forum, you agree to be bound by these Terms and Conditions. If you do not agree with any part of these terms, you must not use our services.
            </p>
          </section>

          <section>
            <h2 className="text-2xl font-semibold text-slate-800 mb-4">2. Use of Services</h2>
            <p>
              Rankers Forum provides information and tools based on historical NEET counseling data. Our predictions are intended for informational purposes only and do not guarantee admission to any specific college or university.
            </p>
          </section>

          <section>
            <h2 className="text-2xl font-semibold text-slate-800 mb-4">3. Accuracy of Data</h2>
            <p>
              While we strive to provide accurate and up-to-date information, we cannot guarantee the complete accuracy of historical data or future counseling trends. The final admission process is governed by the respective counseling authorities (MCC, State Counseling, etc.).
            </p>
          </section>

          <section>
            <h2 className="text-2xl font-semibold text-slate-800 mb-4">4. User Responsibilities</h2>
            <p>
              Users are responsible for verifying all information and deadlines with official counseling notifications. Rankers Forum will not be held liable for any decisions made based on the information provided on our website.
            </p>
          </section>

          <section>
            <h2 className="text-2xl font-semibold text-slate-800 mb-4">5. Account Registration</h2>
            <p>
              To access certain features, you must register for an account. You agree to provide accurate information and maintain the security of your account credentials.
            </p>
          </section>

          <section>
            <h2 className="text-2xl font-semibold text-slate-800 mb-4">6. Intellectual Property</h2>
            <p>
              The content, logos, and features of Rankers Forum are protected by intellectual property laws. You may not reproduce or distribute any content without our prior written consent.
            </p>
          </section>

          <p className="mt-12 text-sm text-slate-400">
            Last Updated: April 9, 2026
          </p>
        </div>
      </main>

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
      />

      <RegisterModal
        open={registerOpen}
        onOpenChange={setRegisterOpen}
        onLoginClick={() => {
          setRegisterOpen(false);
          setLoginOpen(true);
        }}
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
  );
}
