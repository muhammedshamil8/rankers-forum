'use client';

import { createContext, useContext, useEffect, useState, ReactNode } from 'react';
import { User as FirebaseUser, onAuthStateChanged } from 'firebase/auth';
import { auth } from '@/lib/firebase/config';
import { UserRole } from '@/types';

export interface User {
  id: string;
  email: string | null;
  role: UserRole;
  firstName: string;
  lastName: string;
  isActive: boolean;
  avatarUrl?: string | null;
  hasStudentProfile?: boolean;
}

/**
 * Get the redirect URL based on user role and profile status
 */
export function getRedirectUrl(user: User): string {
  switch (user.role) {
    case 'student':
      return user.hasStudentProfile ? '/student/result' : '/student/info';
    case 'admin':
      return '/admin/dashboard';
    case 'super_admin':
      return '/super-admin/dashboard';
    default:
      return '/';
  }
}

interface AuthContextType {
  firebaseUser: FirebaseUser | null;
  user: User | null;
  loading: boolean;
  error: string | null;
  refreshUser: () => Promise<User | null>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [firebaseUser, setFirebaseUser] = useState<FirebaseUser | null>(null);
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchUser = async (): Promise<User | null> => {
    try {
      const response = await fetch('/api/auth/me');

      if (response.ok) {
        const data = await response.json();
        setUser(data.user);
        setError(null);
        return data.user;
      } else {
        setUser(null);
        if (response.status !== 401) {
          setError('Failed to fetch user');
        }
        return null;
      }
    } catch {
      setUser(null);
      setError('Failed to fetch user');
      return null;
    }
  };

  const refreshUser = async (): Promise<User | null> => {
    return await fetchUser();
  };

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (firebaseUser) => {
      setFirebaseUser(firebaseUser);

      if (firebaseUser) {
        // Get ID token and send to server
        try {
          const idToken = await firebaseUser.getIdToken();

          const response = await fetch('/api/auth/login', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ idToken }),
          });

          if (response.ok) {
            const data = await response.json();
            setUser(data.user);
            setError(null);
          } else {
            setUser(null);
          }
        } catch {
          setUser(null);
          setError('Failed to authenticate');
        }
      } else {
        setUser(null);
      }

      setLoading(false);
    });

    return () => unsubscribe();
  }, []);

  // Also check session on mount
  useEffect(() => {
    fetchUser();
  }, []);

  return (
    <AuthContext.Provider
      value={{
        firebaseUser,
        user,
        loading,
        error,
        refreshUser,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);

  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }

  return context;
}

export function useRequireAuth(allowedRoles?: UserRole[]) {
  const { user, loading } = useAuth();

  const isAuthorized = !loading && user &&
    (!allowedRoles || allowedRoles.includes(user.role));

  return {
    user,
    loading,
    isAuthorized,
    isStudent: user?.role === 'student',
    isAdmin: user?.role === 'admin',
    isSuperAdmin: user?.role === 'super_admin',
  };
}
