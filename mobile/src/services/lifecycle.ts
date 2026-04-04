// =============================================================
// App Lifecycle Service — AppState, session, biometric on resume
// =============================================================
import { AppState, AppStateStatus } from 'react-native';
import { useAuthStore } from '../store/authStore';
import { BiometricService } from './biometric';

let appStateSubscription: ReturnType<typeof AppState.addEventListener> | null = null;
let lastBackgroundTime: number | null = null;

const BIOMETRIC_GRACE_PERIOD = 5 * 60_000; // 5 minutes

/**
 * Start listening to app lifecycle events
 */
export function startLifecycleListener() {
  stopLifecycleListener();

  appStateSubscription = AppState.addEventListener('change', handleAppStateChange);
}

/**
 * Stop listening
 */
export function stopLifecycleListener() {
  if (appStateSubscription) {
    appStateSubscription.remove();
    appStateSubscription = null;
  }
}

async function handleAppStateChange(nextAppState: AppStateStatus) {
  const authStore = useAuthStore.getState();

  if (nextAppState === 'background' || nextAppState === 'inactive') {
    // Record when app went to background
    lastBackgroundTime = Date.now();
  }

  if (nextAppState === 'active') {
    // App came to foreground
    if (!authStore.isAuthenticated) return;

    // Validate session
    if (!authStore.validateSession()) {
      // Session expired while in background → logout
      await authStore.logout();
      return;
    }

    // Check if biometric re-auth is needed
    if (lastBackgroundTime && authStore.biometricEnabled) {
      const elapsed = Date.now() - lastBackgroundTime;
      if (elapsed > BIOMETRIC_GRACE_PERIOD) {
        const available = await BiometricService.isAvailable();
        if (available) {
          const success = await BiometricService.authenticate('Verify to continue');
          if (!success) {
            await authStore.logout();
            return;
          }
        }
      }
    }

    lastBackgroundTime = null;
  }
}
