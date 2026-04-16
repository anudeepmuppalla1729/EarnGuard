// =============================================================
// AppProvider — Session restoration, lifecycle, simulation init
// =============================================================
import React, { useEffect, useRef } from 'react';
import { useAuthStore } from './store/authStore';
import { useWalletStore } from './store/walletStore';
import { usePolicyStore } from './store/policyStore';
import { useClaimsStore } from './store/claimsStore';
import { useNotificationStore } from './store/notificationStore';
import { useDashboardStore } from './store/dashboardStore';
// import { startSimulation, stopSimulation } from './services/simulation';
import { startLifecycleListener, stopLifecycleListener } from './services/lifecycle';

interface AppProviderProps {
  children: React.ReactNode;
}

export function AppProvider({ children }: AppProviderProps) {
  const isAuthenticated = useAuthStore(s => s.isAuthenticated);
  const restoreSession = useAuthStore(s => s.restoreSession);
  const hasInitialized = useRef(false);

  // ── Session Restoration (on mount) ────────────────────────
  useEffect(() => {
    if (!hasInitialized.current) {
      hasInitialized.current = true;
      restoreSession();
    }
  }, []);

  // ── Lifecycle Listener ────────────────────────────────────
  useEffect(() => {
    startLifecycleListener();
    return () => stopLifecycleListener();
  }, []);

  // ── Data Loading + Simulation (when authenticated) ───────
  useEffect(() => {
    if (isAuthenticated) {
      // Hydrate all stores with SWR caching
      useWalletStore.getState().loadWithCache();
      usePolicyStore.getState().loadWithCache();
      useClaimsStore.getState().loadWithCache();
      useNotificationStore.getState().loadWithCache();
      useNotificationStore.getState().registerDevice();
      useDashboardStore.getState().loadWithCache();

      // Simulation disabled per user request
      // startSimulation();

      return () => {
        // stopSimulation();
      };
    } else {
      // Reset all stores on logout
      useWalletStore.getState().reset();
      usePolicyStore.getState().reset();
      useClaimsStore.getState().reset();
      useNotificationStore.getState().reset();
      useDashboardStore.getState().reset();
      // stopSimulation();
    }
  }, [isAuthenticated]);

  return <>{children}</>;
}
