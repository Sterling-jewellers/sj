import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import { IUser } from '@/types';

interface AuthStore {
  user: IUser | null;
  token: string | null;
  isLoading: boolean;
  setUser: (user: IUser, token: string) => void;
  logout: () => void;
  updateUser: (user: Partial<IUser>) => void;
}

export const useAuthStore = create<AuthStore>()(
  persist(
    (set) => ({
      user: null,
      token: null,
      isLoading: false,

      setUser: (user, token) => {
        if (typeof window !== 'undefined') localStorage.setItem('sj_token', token);
        set({ user, token });
      },

      logout: () => {
        if (typeof window !== 'undefined') localStorage.removeItem('sj_token');
        set({ user: null, token: null });
      },

      updateUser: (updates) => set((state) => ({
        user: state.user ? { ...state.user, ...updates } : null,
      })),
    }),
    { name: 'sj-auth' }
  )
);
