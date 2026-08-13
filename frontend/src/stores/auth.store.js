import { create } from 'zustand';
import { login as loginApi, logout as logoutApi, me } from '../api/auth.api.js';

const getStoredUser = () => {
  try {
    const raw = localStorage.getItem('assetowl_user');
    return raw ? JSON.parse(raw) : null;
  } catch {
    return null;
  }
};

const initialUser = getStoredUser();

export const useAuthStore = create((set, get) => ({
  user: initialUser,
  isAuthenticated: Boolean(initialUser),
  isLoading: !initialUser, // If we already have stored user, don't block the screen with full loader

  initialize: async () => {
    try {
      const res = await me();
      const userData = res.data?.user || res.data || res.user;
      if (userData) {
        localStorage.setItem('assetowl_user', JSON.stringify(userData));
        set({ user: userData, isAuthenticated: true, isLoading: false });
      } else {
        localStorage.removeItem('assetowl_user');
        set({ user: null, isAuthenticated: false, isLoading: false });
      }
    } catch {
      // If /auth/me fails (e.g. session expired or invalid cookie)
      localStorage.removeItem('assetowl_user');
      set({ user: null, isAuthenticated: false, isLoading: false });
    }
  },

  login: async (email, password) => {
    const res = await loginApi({ email, password });
    const userData = res.data?.user || res.user || res.data;
    if (userData) {
      localStorage.setItem('assetowl_user', JSON.stringify(userData));
      set({ user: userData, isAuthenticated: true, isLoading: false });
    }
    return userData;
  },

  logout: async () => {
    try {
      await logoutApi();
    } finally {
      localStorage.removeItem('assetowl_user');
      set({ user: null, isAuthenticated: false, isLoading: false });
    }
  },

  setUser: (user) => {
    if (user) {
      localStorage.setItem('assetowl_user', JSON.stringify(user));
    } else {
      localStorage.removeItem('assetowl_user');
    }
    set({
      user,
      isAuthenticated: Boolean(user),
      isLoading: false
    });
  },

  clearUser: () => {
    localStorage.removeItem('assetowl_user');
    set({
      user: null,
      isAuthenticated: false,
      isLoading: false
    });
  }
}));

export default useAuthStore;
