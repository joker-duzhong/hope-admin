import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import type { User } from '@/types';

interface UserState {
  token: string | null;
  userInfo: User | null;
  login: (token: string, userInfo: User) => void;
  logout: () => void;
  setUserInfo: (userInfo: User) => void;
}

export const useUserStore = create<UserState>()(
  persist(
    (set) => ({
      token: null,
      userInfo: null,
      login: (token, userInfo) => set({ token, userInfo }),
      logout: () => set({ token: null, userInfo: null }),
      setUserInfo: (userInfo) => set({ userInfo }),
    }),
    {
      name: 'user-storage',
    }
  )
);
