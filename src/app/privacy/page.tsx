'use client';

import { useState } from 'react';
import { Navbar, Footer } from '@/components/layout';
import { useAuth } from '@/lib/hooks';
import { LoginModal, RegisterModal, ForgotPasswordModal } from '@/components/modals';

export default function PrivacyPolicy() {
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
        <h1 className="text-4xl font-bold text-slate-900 mb-8 font-poppins">Privacy Policy</h1>
        
        <div className="prose prose-slate max-w-none space-y-8 text-slate-600 leading-relaxed">
          <p className="text-sm font-medium text-[#2F129B]">Effective Date: 17 Apr 2026</p>
          <p>
            This Privacy Policy describes how www.rankersforum.com ("we", "our", "us") collects, uses, and protects your information when you use our website and services related to medical counselling and seat suggestion.
          </p>

          <section>
            <h2 className="text-2xl font-semibold text-slate-800 mb-4 font-poppins">1. Information We Collect</h2>
            <p>We may collect the following types of information:</p>
            <ul className="list-disc pl-6 space-y-2">
              <li><strong>Personal Information:</strong> Name, email address, phone number (if provided)</li>
              <li><strong>Academic Information:</strong> Exam rank, category, state, preferences for UG/PG medical seats</li>
              <li><strong>Technical Data:</strong> IP address, browser type, device information</li>
              <li><strong>Usage Data:</strong> Pages visited, time spent, interactions</li>
            </ul>
          </section>

          <section>
            <h2 className="text-2xl font-semibold text-slate-800 mb-4 font-poppins">2. How We Use Your Information</h2>
            <p>We use the collected information to:</p>
            <ul className="list-disc pl-6 space-y-2">
              <li>Provide counselling suggestions and seat predictions</li>
              <li>Improve our algorithms and services</li>
              <li>Communicate updates or important notices</li>
              <li>Analyze usage trends and optimize user experience</li>
            </ul>
          </section>

          <section>
            <h2 className="text-2xl font-semibold text-slate-800 mb-4 font-poppins">3. Data Sharing and Disclosure</h2>
            <p>We do NOT sell your personal data. However, we may share data:</p>
            <ul className="list-disc pl-6 space-y-2">
              <li>With service providers assisting in website operations</li>
              <li>If required by law or legal processes</li>
              <li>To protect rights, safety, or prevent fraud</li>
            </ul>
          </section>

          <section>
            <h2 className="text-2xl font-semibold text-slate-800 mb-4 font-poppins">4. Data Storage and Security</h2>
            <p>We implement reasonable security measures to protect your data. However, no system is 100% secure, and we cannot guarantee absolute security.</p>
          </section>

          <section>
            <h2 className="text-2xl font-semibold text-slate-800 mb-4 font-poppins">5. Cookies and Tracking</h2>
            <p>We may use cookies to enhance user experience, analyze traffic, and personalize content.</p>
          </section>

          <section>
            <h2 className="text-2xl font-semibold text-slate-800 mb-4 font-poppins">6. User Rights</h2>
            <p>You may:</p>
            <ul className="list-disc pl-6 space-y-2">
              <li>Request access to your data</li>
              <li>Request correction or deletion</li>
              <li>Withdraw consent (where applicable)</li>
            </ul>
            <p className="mt-4">
              Contact us at: <a href="mailto:contactrankersforum@gmail.com" className="text-indigo-600 hover:underline">contactrankersforum@gmail.com</a>
            </p>
          </section>

          <section>
            <h2 className="text-2xl font-semibold text-slate-800 mb-4 font-poppins">7. Third-Party Links</h2>
            <p>Our website may contain links to external websites. We are not responsible for their privacy practices.</p>
          </section>

          <section>
            <h2 className="text-2xl font-semibold text-slate-800 mb-4 font-poppins">8. Children's Privacy</h2>
            <p>Our services are intended for users above 16 years. We do not knowingly collect data from minors without consent.</p>
          </section>

          <section>
            <h2 className="text-2xl font-semibold text-slate-800 mb-4 font-poppins">9. Changes to This Policy</h2>
            <p>We may update this policy from time to time. Continued use of the website implies acceptance of changes.</p>
          </section>

          <section>
            <h2 className="text-2xl font-semibold text-slate-800 mb-4 font-poppins">10. Contact Us</h2>
            <p>For any privacy concerns:​</p>
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
