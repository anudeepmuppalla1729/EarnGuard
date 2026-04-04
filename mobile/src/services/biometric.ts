// =============================================================
// Biometric Service — expo-local-authentication wrapper
// =============================================================
import * as LocalAuthentication from 'expo-local-authentication';
import { SecureStorage, STORAGE_KEYS } from './storage';

export const BiometricService = {
  /**
   * Check if device has biometric hardware
   */
  async isAvailable(): Promise<boolean> {
    try {
      const hasHardware = await LocalAuthentication.hasHardwareAsync();
      if (!hasHardware) return false;
      const isEnrolled = await LocalAuthentication.isEnrolledAsync();
      return isEnrolled;
    } catch {
      return false;
    }
  },

  /**
   * Get supported authentication types
   */
  async getTypes(): Promise<LocalAuthentication.AuthenticationType[]> {
    try {
      return await LocalAuthentication.supportedAuthenticationTypesAsync();
    } catch {
      return [];
    }
  },

  /**
   * Prompt biometric authentication
   */
  async authenticate(promptMessage = 'Authenticate to access EarnGuard'): Promise<boolean> {
    try {
      const result = await LocalAuthentication.authenticateAsync({
        promptMessage,
        cancelLabel: 'Cancel',
        disableDeviceFallback: false,
        fallbackLabel: 'Use Passcode',
      });
      return result.success;
    } catch {
      return false;
    }
  },

  /**
   * Check if user has opted in to biometric login
   */
  async isEnabled(): Promise<boolean> {
    const value = await SecureStorage.get(STORAGE_KEYS.BIOMETRIC_ENABLED);
    return value === 'true';
  },

  /**
   * Set biometric preference
   */
  async setEnabled(enabled: boolean): Promise<void> {
    await SecureStorage.set(STORAGE_KEYS.BIOMETRIC_ENABLED, String(enabled));
  },
};
