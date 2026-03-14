import { create } from 'zustand';
import api from '@/lib/api';

export interface User {
  id: number;
  name: string;
  email: string;
  role: 'patient' | 'donor' | 'ngo' | 'admin';
  avatar_url?: string;
  is_verified?: boolean;
}

interface AuthState {
  user:     User | null;
  token:    string | null;
  loading:  boolean;
  setAuth:  (token: string, user: User) => void;
  logout:   () => void;
  fetchMe:  () => Promise<void>;
}

export const useAuth = create<AuthState>((set) => ({
  user:    null,
  token:   null,
  loading: false,

  setAuth: (token, user) => {
    localStorage.setItem('mt_token', token);
    localStorage.setItem('mt_user',  JSON.stringify(user));
    set({ token, user });
  },

  logout: () => {
    localStorage.removeItem('mt_token');
    localStorage.removeItem('mt_user');
    set({ token: null, user: null });
    window.location.href = '/';
  },

  fetchMe: async () => {
    set({ loading: true });
    try {
      const token = localStorage.getItem('mt_token');
      if (!token) return;
      const { data } = await api.get('/auth/me');
      set({ user: data, token });
    } catch {
      localStorage.removeItem('mt_token');
      localStorage.removeItem('mt_user');
      set({ user: null, token: null });
    } finally {
      set({ loading: false });
    }
  },
}));
