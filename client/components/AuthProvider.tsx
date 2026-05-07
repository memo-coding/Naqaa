'use client';
import { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { fetchApi } from '@/lib/api';

interface Profile {
  id: string;
  name: string | null;
  email: string;
  role: 'admin' | 'customer';
  avatar_url?: string | null;
  loyaltyTier?: string;
  totalSpent?: number;
}

interface AuthContextType {
  user: Profile | null;
  loading: boolean;
  login: (email: string, password: string) => Promise<{ error: string | null, role?: string }>;
  signup: (email: string, password: string, name: string, userRole?: 'admin' | 'customer') => Promise<{ error: string | null }>;
  updateProfile: (name: string, email: string, password?: string) => Promise<{ error: string | null }>;
  logout: () => void;
  isAuthenticated: boolean;
  isAdmin: boolean;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<Profile | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const initAuth = async () => {
      const token = localStorage.getItem('naqaa_token');
      if (token) {
        try {
          // Verify token and fetch profile
          const userData = await fetchApi('/auth/me');
          const avatarName = encodeURIComponent(userData.name || userData.email || 'Admin');
          setUser({
            id: userData._id,
            name: userData.name,
            email: userData.email,
            role: userData.role,
            avatar_url: `https://ui-avatars.com/api/?name=${avatarName}&background=91f78e&color=002a06&size=128&bold=true&font-size=0.4`,
            loyaltyTier: userData.loyaltyTier,
            totalSpent: userData.totalSpent,
          });
        } catch (error) {
          console.error('Session expired or invalid', error);
          localStorage.removeItem('naqaa_token');
        }
      }
      setLoading(false);
    };

    initAuth();
  }, []);

  const login = async (email: string, password: string): Promise<{ error: string | null, role?: string }> => {
    setLoading(true);
    try {
      const data = await fetchApi('/auth/login', {
        method: 'POST',
        body: JSON.stringify({ email, password })
      });
      
      localStorage.setItem('naqaa_token', data.token);
      const loginAvatarName = encodeURIComponent(data.name || data.email || 'Admin');
      setUser({
        id: data._id,
        name: data.name,
        email: data.email,
        role: data.role,
        avatar_url: `https://ui-avatars.com/api/?name=${loginAvatarName}&background=91f78e&color=002a06&size=128&bold=true&font-size=0.4`,
        loyaltyTier: data.loyaltyTier,
        totalSpent: data.totalSpent,
      });
      setLoading(false);
      return { error: null, role: data.role };
    } catch (err: any) {
      setLoading(false);
      return { error: err.message };
    }
  };

  const signup = async (email: string, password: string, name: string, userRole: 'admin' | 'customer' = 'customer'): Promise<{ error: string | null }> => {
    setLoading(true);
    try {
      const data = await fetchApi('/auth/register', {
        method: 'POST',
        body: JSON.stringify({ email, password, name, role: userRole })
      });
      
      localStorage.setItem('naqaa_token', data.token);
      const signupAvatarName = encodeURIComponent(data.name || data.email || 'User');
      setUser({
        id: data._id,
        name: data.name,
        email: data.email,
        role: data.role,
        avatar_url: `https://ui-avatars.com/api/?name=${signupAvatarName}&background=91f78e&color=002a06&size=128&bold=true&font-size=0.4`,
        loyaltyTier: data.loyaltyTier,
        totalSpent: data.totalSpent,
      });
      setLoading(false);
      return { error: null };
    } catch (err: any) {
      setLoading(false);
      return { error: err.message };
    }
  };

  const updateProfile = async (name: string, email: string, password?: string): Promise<{ error: string | null }> => {
    setLoading(true);
    try {
      const data = await fetchApi('/auth/profile', {
        method: 'PUT',
        body: JSON.stringify({ name, email, password })
      });
      
      localStorage.setItem('naqaa_token', data.token);
      const updateAvatarName = encodeURIComponent(data.name || data.email || 'User');
      setUser({
        id: data._id,
        name: data.name,
        email: data.email,
        role: data.role,
        avatar_url: `https://ui-avatars.com/api/?name=${updateAvatarName}&background=91f78e&color=002a06&size=128&bold=true&font-size=0.4`,
        loyaltyTier: data.loyaltyTier,
        totalSpent: data.totalSpent,
      });
      setLoading(false);
      return { error: null };
    } catch (err: any) {
      setLoading(false);
      return { error: err.message };
    }
  };

  const logout = () => {
    localStorage.removeItem('naqaa_token');
    setUser(null);
  };

  return (
    <AuthContext.Provider value={{
      user,
      loading,
      login,
      signup,
      updateProfile,
      logout,
      isAuthenticated: !!user,
      isAdmin: user?.role === 'admin',
    }}>
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
