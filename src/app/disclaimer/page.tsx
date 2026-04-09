'use client';

import { useState } from 'react';
import { Navbar, Footer } from '@/components/layout';
import { useAuth } from '@/lib/hooks';
import { LoginModal, RegisterModal, ForgotPasswordModal } from '@/components/modals';

export default function Disclaimer() {
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
        <h1 className="text-4xl font-bold text-slate-900 mb-8 font-poppins">Disclaimer</h1>
        
        <div className="prose prose-slate max-w-none space-y-6 text-slate-600 leading-relaxed">
          <section>
            <h2 className="text-2xl font-semibold text-slate-800 mb-4">1. Informational Purposes Only</h2>
            <p>
              Rankers Forum is an independent platform and is NOT affiliated with the Medical Counselling Committee (MCC), National Medical Commission (NMC), or any state counseling authority. The information provided on this website is for guidance and informational purposes only.
            </p>
          </section>

          <section>
            <h2 className="text-2xl font-semibold text-slate-800 mb-4">2. Prediction Model</h2>
            <p>
              Our college prediction results are based on mathematical models and historical trends. Admission outcomes depend on various factors including, but not limited to, the number of candidates, difficulty levels of the exam, and changing counseling rules. We provide no guarantee that you will secure admission based on our predictions.
            </p>
          </section>

          <section>
            <h2 className="text-2xl font-semibold text-slate-800 mb-4">3. Official Notifications</h2>
            <p>
              Users are strongly advised to always refer to the official websites and notifications released by the respective counseling authorities for final information regarding seat matrix, choice filling, and allotment.
            </p>
          </section>

          <section>
            <h2 className="text-2xl font-semibold text-slate-800 mb-4">4. Limitation of Liability</h2>
            <p>
              Rankers Forum, its owners, and its contributors shall not be held liable for any loss, damage, or consequence resulting from the use of the information provided on our website.
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
