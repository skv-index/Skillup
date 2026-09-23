import { createContext, useCallback, useContext, useEffect, useMemo, useState } from 'react';
import type { ReactNode } from 'react';
import type { User } from '@/types';
import { api, setAuthToken } from './api-client';
import { storage } from './utils';

const TOKEN_KEY = 'skillup.token';
const USER_KEY = 'skillup.user';

interface AuthState {
  user: User | null;
  token: string | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  login: (email: string, password: string) => Promise<void>;
  register: (name: string, email: string, password: string) => Promise<void>;
  logout: () => void;
  setUser: (u: User | null) => void;
}

const AuthContext = createContext<AuthState | null>(null);

function readStoredUser(): User | null {
  try {
    const raw = storage.get(USER_KEY);
    return raw ? (JSON.parse(raw) as User) : null;
  } catch {
    return null;
  }
}

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUserState] = useState<User | null>(() => readStoredUser());
  const [token, setToken] = useState<string | null>(() => storage.get(TOKEN_KEY));
  const [isLoading, setLoading] = useState(false);

  useEffect(() => {
    setAuthToken(token);
  }, [token]);

  const setUser = useCallback((u: User | null) => {
    setUserState(u);
    if (u) storage.set(USER_KEY, JSON.stringify(u));
    else storage.remove(USER_KEY);
  }, []);

  const login = useCallback(
    async (email: string, password: string) => {
      setLoading(true);
      try {
        // Real backend when available; falls back to demo session for foundation-only dev.
        try {
          const res = await api.post<{ user: User; token: string }>('/auth/login', { email, password });
          setToken(res.token);
          storage.set(TOKEN_KEY, res.token);
          setUser(res.user);
          return;
        } catch {
          const demo: User = {
            id: 'u_demo',
            email,
            name: email.split('@')[0] ?? 'Learner',
            role: 'learner',
            createdAt: new Date().toISOString(),
            onboardingCompleted: false,
          };
          setToken('demo-token');
          storage.set(TOKEN_KEY, 'demo-token');
          setUser(demo);
        }
      } finally {
        setLoading(false);
      }
    },
    [setUser],
  );

  const register = useCallback(
    async (name: string, email: string, _password: string) => {
      setLoading(true);
      try {
        try {
          const res = await api.post<{ user: User; token: string }>('/auth/register', {
            name,
            email,
            password: _password,
          });
          setToken(res.token);
          storage.set(TOKEN_KEY, res.token);
          setUser(res.user);
          return;
        } catch {
          const demo: User = {
            id: 'u_demo',
            email,
            name,
            role: 'learner',
            createdAt: new Date().toISOString(),
            onboardingCompleted: false,
          };
          setToken('demo-token');
          storage.set(TOKEN_KEY, 'demo-token');
          setUser(demo);
        }
      } finally {
        setLoading(false);
      }
    },
    [setUser],
  );

  const logout = useCallback(() => {
    setToken(null);
    setUser(null);
    storage.remove(TOKEN_KEY);
    storage.remove(USER_KEY);
  }, [setUser]);

  const value = useMemo<AuthState>(
    () => ({
      user,
      token,
      isAuthenticated: !!user,
      isLoading,
      login,
      register,
      logout,
      setUser,
    }),
    [user, token, isLoading, login, register, logout, setUser],
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth(): AuthState {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuth must be used inside <AuthProvider>');
  return ctx;
}
