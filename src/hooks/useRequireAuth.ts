import { useCallback } from 'react';
import { useAuthStore } from '../store/authStore';

type RequireAuthOptions = {
  message?: string;
  onAuthed?: () => void;
};

export function useRequireAuth() {
  const user = useAuthStore((s) => s.user);
  const openLoginModal = useAuthStore((s) => s.openLoginModal);

  return useCallback(
    (options?: RequireAuthOptions | (() => void)) => {
      const normalized =
        typeof options === 'function' ? { onAuthed: options } : (options ?? {});

      if (user?.token) {
        normalized.onAuthed?.();
        return true;
      }

      openLoginModal({
        message: normalized.message,
        onSuccess: normalized.onAuthed,
      });
      return false;
    },
    [openLoginModal, user?.token],
  );
}
