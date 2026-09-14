import { create } from 'zustand';
import {
  requestLoginOtp,
  verifyLoginOtp,
  saveAuthSession,
  logout as clearSession,
  isCustomerRole,
} from '../services/auth.service';
import { getStoredAuthUser } from '../services/api/tokenStorage';
import type { AuthUser } from '../types';

type OpenLoginModalOptions = {
  message?: string;
  onSuccess?: () => void;
  force?: boolean;
};

type AuthState = {
  user: AuthUser | null;
  isBootstrapping: boolean;
  isLoading: boolean;
  error: string | null;
  loginModalVisible: boolean;
  loginPrompt: string | null;
  loginOnSuccess: (() => void) | null;
  hasShownInitialLoginPrompt: boolean;
  bootstrap: () => Promise<void>;
  openLoginModal: (options?: OpenLoginModalOptions) => void;
  closeLoginModal: () => void;
  showInitialLoginPrompt: () => void;
  sendOtp: (identifier: string) => Promise<void>;
  verifyOtp: (identifier: string, otp: string) => Promise<AuthUser>;
  signOut: () => Promise<void>;
  setUser: (user: AuthUser | null) => void;
};

export const useAuthStore = create<AuthState>((set, get) => ({
  user: null,
  isBootstrapping: true,
  isLoading: false,
  error: null,
  loginModalVisible: false,
  loginPrompt: null,
  loginOnSuccess: null,
  hasShownInitialLoginPrompt: false,

  openLoginModal: (options) => {
    set({
      loginModalVisible: true,
      loginPrompt: options?.message ?? null,
      loginOnSuccess: options?.onSuccess ?? null,
      error: null,
    });
  },

  closeLoginModal: () => {
    set({
      loginModalVisible: false,
      loginPrompt: null,
      loginOnSuccess: null,
      error: null,
      hasShownInitialLoginPrompt: true,
    });
  },

  showInitialLoginPrompt: () => {
    const { user, hasShownInitialLoginPrompt, loginModalVisible } = get();
    if (user?.token || hasShownInitialLoginPrompt || loginModalVisible) return;
    get().openLoginModal({
      message: 'Sign in to order medicines, track delivery, and save your addresses.',
    });
    set({ hasShownInitialLoginPrompt: true });
  },

  bootstrap: async () => {
    set({ isBootstrapping: true });
    const user = await getStoredAuthUser();
    set({ user, isBootstrapping: false });
  },

  sendOtp: async (identifier) => {
    set({ isLoading: true, error: null });
    try {
      await requestLoginOtp(identifier.trim());
    } catch (error) {
      set({ error: error instanceof Error ? error.message : 'Failed to send OTP' });
      throw error;
    } finally {
      set({ isLoading: false });
    }
  },

  verifyOtp: async (identifier, otp) => {
    set({ isLoading: true, error: null });
    try {
      const response = await verifyLoginOtp(identifier.trim(), otp.trim());
      const user = await saveAuthSession(response as Record<string, unknown>, identifier);
      if (!isCustomerRole(user.role)) {
        await clearSession();
        throw new Error('This app is for customers only. Please use the owner portal.');
      }
      const onSuccess = get().loginOnSuccess;
      set({
        user,
        loginModalVisible: false,
        loginPrompt: null,
        loginOnSuccess: null,
        error: null,
      });
      onSuccess?.();
      return user;
    } catch (error) {
      set({ error: error instanceof Error ? error.message : 'OTP verification failed' });
      throw error;
    } finally {
      set({ isLoading: false });
    }
  },

  signOut: async () => {
    await clearSession();
    set({ user: null, error: null });
  },

  setUser: (user) => set({ user }),
}));
