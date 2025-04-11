import React, { createContext, useState, useEffect, useContext, ReactNode } from 'react';
import { loginUser, registerOwner } from './authService';

const API_BASE = process.env.NEXT_PUBLIC_API_BASE_URL || 'http://localhost:5000';

export interface AuthUser {
  id: string;
  name: string;
  email: string;
  role: 'admin' | 'owner';
  restaurant_id?: string;
  restaurant?: {
    id: string;
    restaurant_name?: string;
    logo_url?: string;
    address?: string;
    phone?: string;
    opening_hours?: string;
    closing_hours?: string;
    description?: string;
    region?: string;
  };
}

interface AuthContextType {
  user: AuthUser | null;
  token: string | null;
  loading: boolean;
  login: (email: string, password: string) => Promise<AuthUser>;
  register: (
    name: string,
    email: string,
    password: string,
    plan: string,
    address: string,
    phone: string,
    openingHours: string,
    closingHours: string,
    description: string,
    region: string
  ) => Promise<AuthUser>;
  logout: () => void;
  refreshUser: () => Promise<void>;
}

export const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<AuthUser | null>(null);
  const [token, setToken] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const initializeAuth = async () => {
      try {
        const savedUser = localStorage.getItem('user');
        const savedToken = localStorage.getItem('token');

        if (savedUser && savedToken) {
          setUser(JSON.parse(savedUser));
          setToken(savedToken);
        } else {
          // If nothing is stored, attempt to fetch the profile using credentials
          const res = await fetch(`${API_BASE}/api/profile`, { credentials: 'include' });
          const data = await res.json();
          if (data.user) {
            setUser(data.user);
            setToken('session');
            localStorage.setItem('user', JSON.stringify(data.user));
            localStorage.setItem('token', 'session');
          } else {
            setUser(null);
            setToken(null);
            localStorage.removeItem('user');
            localStorage.removeItem('token');
          }
        }
      } catch (err) {
        console.warn('Failed to initialize session.', err);
        setUser(null);
        setToken(null);
        localStorage.removeItem('user');
        localStorage.removeItem('token');
      } finally {
        setLoading(false);
      }
    };

    initializeAuth();
  }, []);

  async function login(email: string, password: string): Promise<AuthUser> {
    try {
      await loginUser(email, password);
      const res = await fetch(`${API_BASE}/api/profile`, { credentials: 'include' });
      const data = await res.json();
      if (!data.user) throw new Error('Failed to load user profile');
      setUser(data.user);
      setToken('session');
      localStorage.setItem('user', JSON.stringify(data.user));
      localStorage.setItem('token', 'session');
      return data.user;
    } catch (error) {
      console.error('Login failed:', error);
      throw error;
    }
  }

  async function register(
    name: string,
    email: string,
    password: string,
    plan: string,
    address: string,
    phone: string,
    openingHours: string,
    closingHours: string,
    description: string,
    region: string
  ): Promise<AuthUser> {
    try {
      await registerOwner(name, email, password, plan, address, phone, openingHours, closingHours, description, region);
      const res = await fetch(`${API_BASE}/api/profile`, { credentials: 'include' });
      const data = await res.json();
      if (!data.user) throw new Error('Failed to fetch user after registration');
      setUser(data.user);
      setToken('session');
      localStorage.setItem('user', JSON.stringify(data.user));
      localStorage.setItem('token', 'session');
      return data.user;
    } catch (error) {
      console.error('Registration failed:', error);
      throw error;
    }
  }

  async function refreshUser(): Promise<void> {
    try {
      const res = await fetch(`${API_BASE}/api/profile`, { credentials: 'include' });
      const data = await res.json();
      if (data.user) {
        setUser(data.user);
        localStorage.setItem('user', JSON.stringify(data.user));
      } else {
        setUser(null);
        localStorage.removeItem('user');
      }
    } catch (err) {
      console.error('Failed to refresh user:', err);
      setUser(null);
      localStorage.removeItem('user');
    }
  }

  function logout() {
    setUser(null);
    setToken(null);
    localStorage.removeItem('user');
    localStorage.removeItem('token');
    fetch(`${API_BASE}/api/auth/logout`, { method: 'POST', credentials: 'include' }).catch(() => {});
  }

  return (
    <AuthContext.Provider value={{ user, token, loading, login, register, logout, refreshUser }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth(): AuthContextType {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}
