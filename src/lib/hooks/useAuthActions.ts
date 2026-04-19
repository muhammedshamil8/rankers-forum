'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { signInWithEmail, signUpWithEmail, signInWithGoogle, signOut, resetPassword, getAuthErrorMessage, AuthError } from '@/lib/firebase/auth';
import { useAuth, User } from './useAuth';
import { useQueryClient } from '@tanstack/react-query';

interface UseAuthActionsReturn {
  login: (email: string, password: string) => Promise<User | null>;
  registerUser: (data: RegisterData) => Promise<void>;
  loginWithGoogle: () => Promise<User | null>;
  logout: () => Promise<void>;
  sendPasswordReset: (email: string) => Promise<void>;
  loading: boolean;
  error: string | null;
  clearError: () => void;
}

interface RegisterData {
  email: string;
  password: string;
  firstName: string;
  lastName: string;
  phone: string;
  city?: string;
  state?: string;
}

export function useAuthActions(): UseAuthActionsReturn {
  const router = useRouter();
  const queryClient = useQueryClient();
  const { refreshUser } = useAuth();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const clearError = () => setError(null);

  const login = async (email: string, password: string): Promise<User | null> => {
    setLoading(true);
    setError(null);

    try {
      const credential = await signInWithEmail(email, password);
      const idToken = await credential.user.getIdToken();

      // Call our login API to set the session cookie and get user data
      const response = await fetch('/api/auth/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ idToken }),
      });

      if (!response.ok) {
        throw new Error('Failed to establish session');
      }

      const { user } = await response.json();
      
      // Clear cache to ensure fresh data for the new user
      queryClient.clear();
      sessionStorage.clear();
      
      // Update the global user state silently
      refreshUser();
      
      router.refresh();
      return user;
    } catch (e) {
      const authError = e as AuthError;
      setError(getAuthErrorMessage(authError));
      throw e;
    } finally {
      setLoading(false);
    }
  };

  const register = async (data: RegisterData) => {
    setLoading(true);
    setError(null);

    try {
      // First, register via API to create user document
      const response = await fetch('/api/auth/register', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Registration failed');
      }

      // Then sign in with the credentials
      await signInWithEmail(data.email, data.password);
      await refreshUser();
      
      // Clear cache for new user session
      queryClient.clear();
      sessionStorage.clear();
      
      router.refresh();
    } catch (e) {
      if (e instanceof Error) {
        setError(e.message);
      } else {
        const authError = e as AuthError;
        setError(getAuthErrorMessage(authError));
      }
      throw e;
    } finally {
      setLoading(false);
    }
  };

  const loginWithGoogle = async (): Promise<User | null> => {
    setLoading(true);
    setError(null);

    try {
      const credential = await signInWithGoogle();
      const idToken = await credential.user.getIdToken();

      // Call our login API to set the session cookie and get user data
      const response = await fetch('/api/auth/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ idToken }),
      });

      if (!response.ok) {
        throw new Error('Failed to establish session');
      }

      const { user } = await response.json();
      
      // Clear cache for new user session
      queryClient.clear();
      sessionStorage.clear();
      
      // Trigger silent refresh
      refreshUser();
      
      router.refresh();
      return user;
    } catch (e) {
      const authError = e as AuthError;
      setError(getAuthErrorMessage(authError));
      throw e;
    } finally {
      setLoading(false);
    }
  };

  const logout = async () => {
    setLoading(true);
    setError(null);

    try {
      await signOut();
      
      // Clear data immediately
      queryClient.clear();
      sessionStorage.clear();

      // Clear server session
      await fetch('/api/auth/logout', { method: 'POST' });

      await refreshUser();
      router.push('/');
      router.refresh();
    } catch (e) {
      const authError = e as AuthError;
      setError(getAuthErrorMessage(authError));
      throw e;
    } finally {
      setLoading(false);
    }
  };

  const sendPasswordReset = async (email: string) => {
    setLoading(true);
    setError(null);

    try {
      await resetPassword(email);
    } catch (e) {
      const authError = e as AuthError;
      setError(getAuthErrorMessage(authError));
      throw e;
    } finally {
      setLoading(false);
    }
  };

  return {
    login,
    registerUser: register,
    loginWithGoogle,
    logout,
    sendPasswordReset,
    loading,
    error,
    clearError,
  };
}
