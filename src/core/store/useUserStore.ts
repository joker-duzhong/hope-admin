import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import type { User } from '@/core/types';

interface UserState {
  token: string | null;
  userInfo: User | null;
  appScope: string | null;
  login: (token: string, userInfo: User, appScope: string) => void;
  logout: () => void;
  setUserInfo: (userInfo: User) => void;
}

export const useUserStore = create<UserState>()(
  persist(
    (set) => ({
      token: null,
      userInfo: null,
      appScope: null,
      login: (token, userInfo, appScope) => set({ token, userInfo, appScope }),
      logout: () => set({ token: null, userInfo: null, appScope: null }),
      setUserInfo: (userInfo) => set({ userInfo }),
    }),
    {
      name: 'user-storage',
      version: 2,
      migrate: () => ({ token: null, userInfo: null, appScope: null }),
      partialize: ({ token, userInfo, appScope }) => ({ token, userInfo, appScope }),
    }
  )
);
