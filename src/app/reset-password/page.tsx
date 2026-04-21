'use client';

import { useState } from 'react';
import { Navbar, Footer } from '@/components/layout';
import { useAuth } from '@/lib/hooks';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Loader2, ShieldCheck, Eye, EyeOff } from 'lucide-react';

export default function ResetPassword() {
  const { user, loading } = useAuth();
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isSuccess, setIsSuccess] = useState(false);
  const [showPassword, setShowPassword] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (newPassword !== confirmPassword) {
      alert("Passwords don't match");
      return;
    }
    
    setIsSubmitting(true);
    await new Promise(resolve => setTimeout(resolve, 1500));
    setIsSubmitting(false);
    setIsSuccess(true);
  };

  return (
    <div className="min-h-screen bg-slate-50">
      <Navbar
        user={user}
        loading={loading}
        onLoginClick={() => {}}
        onRegisterClick={() => {}}
      />

      <main className="max-w-md mx-auto px-4 pt-40 pb-20">
        <div className="bg-white rounded-3xl shadow-xl p-8 border border-slate-100">
          {isSuccess ? (
            <div className="text-center space-y-6 py-4">
              <div className="w-20 h-20 bg-green-50 rounded-full flex items-center justify-center mx-auto">
                <ShieldCheck className="w-10 h-10 text-green-600" />
              </div>
              <div className="space-y-2">
                <h1 className="text-2xl font-bold text-slate-900">Password Reset Successful</h1>
                <p className="text-slate-500">
                  Your password has been changed successfully. You can now use your new password to log in.
                </p>
              </div>
              <Button 
                onClick={() => window.location.href = '/'}
                className="w-full bg-linear-to-br from-[#2F129B] to-[#3B82F6] hover:opacity-90 py-6"
              >
                Go to Login
              </Button>
            </div>
          ) : (
            <>
              <div className="text-center space-y-2 mb-8">
                <h1 className="text-3xl font-bold text-slate-900">Set New Password</h1>
                <p className="text-slate-500 text-sm">
                  Please enter a strong password to secure your account.
                </p>
              </div>

              <form onSubmit={handleSubmit} className="space-y-6">
                <div className="space-y-2">
                  <Label htmlFor="newPassword">New Password</Label>
                  <div className="relative">
                    <Input
                      id="newPassword"
                      type={showPassword ? "text" : "password"}
                      placeholder="••••••••"
                      value={newPassword}
                      onChange={(e) => setNewPassword(e.target.value)}
                      required
                      className="pr-10 h-12 rounded-xl"
                    />
                    <button
                      type="button"
                      onClick={() => setShowPassword(!showPassword)}
                      className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600"
                    >
                      {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                    </button>
                  </div>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="confirmPassword">Confirm Password</Label>
                  <Input
                    id="confirmPassword"
                    type={showPassword ? "text" : "password"}
                    placeholder="••••••••"
                    value={confirmPassword}
                    onChange={(e) => setConfirmPassword(e.target.value)}
                    required
                    className="h-12 rounded-xl"
                  />
                </div>

                <Button 
                  type="submit"
                  disabled={isSubmitting}
                  className="w-full bg-linear-to-br from-[#2F129B] to-[#3B82F6] hover:opacity-90 py-6 font-semibold text-lg"
                >
                  {isSubmitting ? (
                    <Loader2 className="animate-spin mr-2" />
                  ) : "Update Password"}
                </Button>
              </form>
            </>
          )}
        </div>
      </main>

      <Footer />
    </div>
  );
}
