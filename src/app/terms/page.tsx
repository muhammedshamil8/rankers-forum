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
        
        <div className="prose prose-slate max-w-none space-y-8 text-slate-600 leading-relaxed">
          <p className="text-sm font-medium text-[#2F129B]">Effective Date: 17 Apr 2026</p>
          <p>
            By accessing and using <a href="http://www.rankersforum.com" className="text-indigo-600 hover:underline">www.rankersforum.com</a>, you agree to comply with these Terms & Conditions.
          </p>

          <section>
            <h2 className="text-2xl font-semibold text-slate-800 mb-4 font-poppins">1. Nature of Service</h2>
            <p>
              We provide predictive insights and counselling suggestions for UG and PG medical seat allocation based on user-provided data. These are informational tools only.
            </p>
          </section>

          <section>
            <h2 className="text-2xl font-semibold text-slate-800 mb-4 font-poppins">2. No Guarantee of Admission</h2>
            <p>We do NOT guarantee:</p>
            <ul className="list-disc pl-6 space-y-2">
              <li>Seat allotment</li>
              <li>Admission in any institution</li>
              <li>Accuracy of predictions</li>
            </ul>
            <p className="mt-4">
              All results are probabilistic and based on historical data and algorithms.
            </p>
          </section>

          <section>
            <h2 className="text-2xl font-semibold text-slate-800 mb-4 font-poppins">3. User Responsibilities</h2>
            <p>You agree to:</p>
            <ul className="list-disc pl-6 space-y-2">
              <li>Provide accurate and truthful information</li>
              <li>Not misuse the platform</li>
              <li>Not attempt to manipulate results</li>
            </ul>
          </section>

          <section>
            <h2 className="text-2xl font-semibold text-slate-800 mb-4 font-poppins">4. Intellectual Property</h2>
            <p>
              All content, algorithms, design, and data on this website are the property of <a href="http://www.rankersforum.com" className="text-indigo-600 hover:underline">www.rankersforum.com</a> and may not be copied or reused without permission.
            </p>
          </section>

          <section>
            <h2 className="text-2xl font-semibold text-slate-800 mb-4 font-poppins">5. Limitation of Liability</h2>
            <p>We are not liable for:</p>
            <ul className="list-disc pl-6 space-y-2">
              <li>Admission outcomes</li>
              <li>Decisions made based on our suggestions</li>
              <li>Any direct or indirect damages</li>
            </ul>
            <p className="mt-4">
              Use the service at your own risk.
            </p>
          </section>

          <section>
            <h2 className="text-2xl font-semibold text-slate-800 mb-4 font-poppins">6. Service Availability</h2>
            <p>We may modify, suspend, or discontinue services without notice.</p>
          </section>

          <section>
            <h2 className="text-2xl font-semibold text-slate-800 mb-4 font-poppins">7. Termination</h2>
            <p>We reserve the right to restrict or terminate access if users violate these terms.</p>
          </section>

          <section>
            <h2 className="text-2xl font-semibold text-slate-800 mb-4 font-poppins">8. Governing Law</h2>
            <p>These terms shall be governed by the laws of India.</p>
          </section>

          <section>
            <h2 className="text-2xl font-semibold text-slate-800 mb-4 font-poppins">9. Changes to Terms</h2>
            <p>We may update these Terms at any time. Continued use implies acceptance.</p>
          </section>

          <section>
            <h2 className="text-2xl font-semibold text-slate-800 mb-4 font-poppins">10. Contact</h2>
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
