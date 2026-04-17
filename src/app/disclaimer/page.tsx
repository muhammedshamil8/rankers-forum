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
        
        <div className="prose prose-slate max-w-none space-y-8 text-slate-600 leading-relaxed">
          <p className="text-sm font-medium text-[#2F129B]">Effective Date: 17 Apr 2026</p>
          <p>
            The information provided on <a href="http://www.rankersforum.com" className="text-indigo-600 hover:underline">www.rankersforum.com</a> is for informational and guidance purposes only.
          </p>

          <section>
            <h2 className="text-2xl font-semibold text-slate-800 mb-4 font-poppins">1. No Professional Advice</h2>
            <p>The platform does NOT provide:</p>
            <ul className="list-disc pl-6 space-y-2">
              <li>Legal advice</li>
              <li>Medical advice</li>
              <li>Official counselling authority guidance</li>
            </ul>
          </section>

          <section>
            <h2 className="text-2xl font-semibold text-slate-800 mb-4 font-poppins">2. Prediction Disclaimer</h2>
            <p>All seat predictions and rankings:</p>
            <ul className="list-disc pl-6 space-y-2">
              <li>Are based on historical trends and algorithms</li>
              <li>May not reflect actual counselling outcomes</li>
              <li>Should not be considered final or authoritative</li>
            </ul>
          </section>

          <section>
            <h2 className="text-2xl font-semibold text-slate-800 mb-4 font-poppins">3. No Affiliation</h2>
            <p>We are NOT affiliated with:</p>
            <ul className="list-disc pl-6 space-y-2">
              <li>Government counselling authorities</li>
              <li>Medical colleges</li>
              <li>Examination bodies</li>
            </ul>
          </section>

          <section>
            <h2 className="text-2xl font-semibold text-slate-800 mb-4 font-poppins">4. User Decision Responsibility</h2>
            <p>Users are solely responsible for:</p>
            <ul className="list-disc pl-6 space-y-2">
              <li>Their counselling choices</li>
              <li>Preference filling decisions</li>
              <li>Admission-related actions</li>
            </ul>
          </section>

          <section>
            <h2 className="text-2xl font-semibold text-slate-800 mb-4 font-poppins">5. Accuracy of Data</h2>
            <p>
              While we strive for accuracy, we do not guarantee that all data is complete, current, or error-free.
            </p>
          </section>

          <section>
            <h2 className="text-2xl font-semibold text-slate-800 mb-4 font-poppins">6. External Factors</h2>
            <p>Counselling outcomes may vary due to:</p>
            <ul className="list-disc pl-6 space-y-2">
              <li>Policy changes</li>
              <li>Seat matrix updates</li>
              <li>Reservation changes</li>
              <li>Competition levels</li>
            </ul>
            <p className="mt-4">We are not responsible for such variations.</p>
          </section>

          <section>
            <h2 className="text-2xl font-semibold text-slate-800 mb-4 font-poppins">7. Use at Your Own Risk</h2>
            <p>By using this website, you acknowledge that you do so at your own risk.</p>
          </section>

          <section>
            <h2 className="text-2xl font-semibold text-slate-800 mb-4 font-poppins">8. Contact</h2>
            <p>Email: <a href="mailto:contactrankersforum@gmail.com" className="text-indigo-600 hover:underline">contactrankersforum@gmail.com</a></p>
          </section>
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
 
