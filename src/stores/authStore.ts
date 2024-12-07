import { create } from 'zustand';
import { AuthState, User } from '../types/auth';

interface AuthStore extends AuthState {
  setUser: (user: User | null) => void;
  setLoading: (isLoading: boolean) => void;
  logout: () => void;
}

export const useAuthStore = create<AuthStore>((set) => ({
  user: null,
  isAuthenticated: false,
  isLoading: true,

  setUser: (user: User | null) => set({ user, isAuthenticated: !!user }),
  setLoading: (isLoading: boolean) => set({ isLoading }),
  logout: () => set({ user: null, isAuthenticated: false }),
})); 