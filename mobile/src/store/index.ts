// =============================================================
// Store Barrel — Re-exports all domain stores
// Backward-compatible useStore wraps useAuthStore
// =============================================================
export { useAuthStore } from './authStore';
export { useWalletStore } from './walletStore';
export { usePolicyStore } from './policyStore';
export { useClaimsStore } from './claimsStore';
export { useNotificationStore } from './notificationStore';

// Backward-compatible useStore for existing imports
// Maps old interface → new authStore
import { useAuthStore } from './authStore';

export const useStore = () => {
  const auth = useAuthStore();
  return {
    isAuthenticated: auth.isAuthenticated,
    accessToken: auth.accessToken,
    user: auth.user,
    isLoading: auth.isLoading,
    login: auth.login,
    logout: auth.logout,
    fetchProfile: auth.fetchProfile,
  };
};
