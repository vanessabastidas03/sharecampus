import React, { createContext, useContext, useEffect, useState, ReactNode } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { saveToken, removeToken } from '../services/api';

interface AuthState {
  token: string | null;
  userId: string | null;
  loading: boolean;
}

interface AuthContextValue extends AuthState {
  login: (accessToken: string, userId: number) => Promise<void>;
  logout: () => Promise<void>;
}

const AuthContext = createContext<AuthContextValue | null>(null);

const USER_ID_KEY = '@sharecampus_userId';

export function AuthProvider({ children }: { children: ReactNode }) {
  const [state, setState] = useState<AuthState>({ token: null, userId: null, loading: true });

  useEffect(() => {
    async function loadStoredAuth() {
      try {
        const [token, userId] = await Promise.all([
          AsyncStorage.getItem('@sharecampus_token'),
          AsyncStorage.getItem(USER_ID_KEY),
        ]);
        setState({ token, userId, loading: false });
      } catch {
        setState({ token: null, userId: null, loading: false });
      }
    }
    loadStoredAuth();
  }, []);

  async function login(accessToken: string, userId: number) {
    await Promise.all([
      saveToken(accessToken),
      AsyncStorage.setItem(USER_ID_KEY, String(userId)),
    ]);
    setState({ token: accessToken, userId: String(userId), loading: false });
  }

  async function logout() {
    await Promise.all([
      removeToken(),
      AsyncStorage.removeItem(USER_ID_KEY),
    ]);
    setState({ token: null, userId: null, loading: false });
  }

  return (
    <AuthContext.Provider value={{ ...state, login, logout }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth(): AuthContextValue {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuth debe usarse dentro de AuthProvider');
  return ctx;
}
