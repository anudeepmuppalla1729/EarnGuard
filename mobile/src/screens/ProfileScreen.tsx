import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, ScrollView, Image, Switch, Platform, Alert } from 'react-native';
import { theme } from '../theme/theme';
import { s, vs, ms } from '../theme/responsive';
import { useAuthStore } from '../store/authStore';
import { Shield, Star, Lock, Fingerprint, Bell, CreditCard, Languages, HelpCircle, LogOut, ChevronRight } from 'lucide-react-native';
import * as Haptics from 'expo-haptics';
import { useNavigation } from '@react-navigation/native';
import { SharedHeader } from '../components/SharedHeader';
import { HapticAction } from '../components/HapticAction';
import { BiometricService } from '../services/biometric';

export default function ProfileScreen() {
  const navigation = useNavigation<any>();
  const user = useAuthStore(s => s.user);
  const logout = useAuthStore(s => s.logout);
  const biometricEnabled = useAuthStore(s => s.biometricEnabled);
  const setBiometricEnabled = useAuthStore(s => s.setBiometricEnabled);
  const [isBiometricEnabled, setIsBiometricEnabled] = useState(biometricEnabled);

  useEffect(() => {
    setIsBiometricEnabled(biometricEnabled);
  }, [biometricEnabled]);

  const handlePress = (screen?: string) => {
    if (screen) {
      navigation.navigate(screen);
    }
  };

  const handleBiometricToggle = async (value: boolean) => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    if (value) {
      const available = await BiometricService.isAvailable();
      if (!available) {
        Alert.alert('Unavailable', 'Your device does not support biometric authentication.');
        return;
      }
      const success = await BiometricService.authenticate('Verify to enable biometric login');
      if (success) {
        setIsBiometricEnabled(true);
        setBiometricEnabled(true);
      }
    } else {
      setIsBiometricEnabled(false);
      setBiometricEnabled(false);
    }
  };

  const handleLogout = () => {
    Haptics.notificationAsync(Haptics.NotificationFeedbackType.Warning);
    logout();
  };

  return (
    <View style={styles.container}>
      <SharedHeader showProfile={false} />

      <ScrollView 
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        {/* Profile Hero */}
        <View style={styles.heroSection}>
          <View style={styles.largeAvatarContainer}>
            <Image 
              source={{ uri: 'https://lh3.googleusercontent.com/aida-public/AB6AXuCfx0dSy3GS1iZ6QMq9h82PhzyigL_MnXnF-pU60htKKHGjWi6u79Fst46fkpknC618jb7vckFwkiQvlgN5MZWQC4qtE2RbCXUC_axmnxoY07Lj_KJndqKPouNbxJP50BtcVnOvQakODiYNdbolpUZCbUydJbvyx2o_1i8PV3kbUqx3h4GNo44QinwLT_1jXYg5y-7Yu-e2wtXH3kGKlKgBKE0DIw7eHZf49JbGY83r2d-pGRrvrhUEasKoIONudiByjBF5QRzo1vE' }} 
              style={styles.largeAvatar}
            />
          </View>
          <Text style={styles.profileName}>{user?.name || 'Avi Sharma'}</Text>
          <Text style={styles.profileEmail}>{user?.email || 'avi@example.com'}</Text>
          
          <View style={styles.heroActions}>
            <HapticAction onPress={() => handlePress()} style={styles.editButton}>
              <Text style={styles.editButtonText}>Edit Profile</Text>
            </HapticAction>
            <HapticAction onPress={() => handlePress()} style={styles.statusButton}>
              <Text style={styles.statusButtonText}>Pro Status</Text>
            </HapticAction>
          </View>
        </View>

        {/* Dashboard Bento */}
        <View style={styles.bentoRow}>
          <HapticAction style={styles.bentoCard}>
            <View style={[styles.bentoIconContainer, { backgroundColor: theme.colors.successLight }]}>
              <Shield size={s(20)} color={theme.colors.success} />
            </View>
            <View>
              <Text style={styles.bentoLabel}>STATUS</Text>
              <Text style={[styles.bentoValue, { color: theme.colors.success }]}>Protected</Text>
            </View>
          </HapticAction>
          <HapticAction style={styles.bentoCard}>
            <View style={[styles.bentoIconContainer, { backgroundColor: theme.colors.warningLight }]}>
              <Star size={s(20)} color={theme.colors.warning} />
            </View>
            <View>
              <Text style={styles.bentoLabel}>SCORE</Text>
              <Text style={styles.bentoValue}>842</Text>
            </View>
          </HapticAction>
        </View>

        {/* Settings Groups */}
        <View style={styles.settingsSection}>
          <Text style={styles.groupHeader}>SECURITY & PRIVACY</Text>
          <View style={styles.groupContainer}>
            <SettingItem icon={<Lock size={s(18)} />} title="Two-Factor Auth" onPress={() => handlePress('TwoFactorAuth')} />
            <View style={styles.groupSeparator} />
            <View style={styles.settingItem}>
              <View style={styles.settingLeft}>
                <View style={styles.settingIconBg}>
                  <Fingerprint size={s(18)} color={theme.colors.onSurface} />
                </View>
                <Text style={styles.settingText}>Biometric Login</Text>
              </View>
              <Switch 
                value={isBiometricEnabled} 
                onValueChange={(v) => {
                  Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
                  handleBiometricToggle(v);
                }} 
                trackColor={{ false: theme.colors.divider, true: theme.colors.primary }}
                thumbColor={Platform.OS === 'ios' ? undefined : '#FFFFFF'}
              />
            </View>
          </View>

          <Text style={[styles.groupHeader, { marginTop: vs(32) }]}>PREFERENCES</Text>
          <View style={styles.groupContainer}>
            <SettingItem icon={<Bell size={s(18)} />} title="Alert Notifications" onPress={() => handlePress('NotificationSettings')} />
            <View style={styles.groupSeparator} />
            <SettingItem icon={<CreditCard size={s(18)} />} title="Payment Methods" badge="Visa ••42" onPress={() => handlePress()} />
            <View style={styles.groupSeparator} />
            <SettingItem icon={<Languages size={s(18)} />} title="Region & Language" value="English (US)" onPress={() => handlePress()} />
          </View>

          <Text style={[styles.groupHeader, { marginTop: vs(32) }]}>SUPPORT</Text>
          <View style={styles.groupContainer}>
            <SettingItem icon={<HelpCircle size={s(18)} />} title="Help Center" onPress={() => handlePress('HelpCenter')} />
          </View>

          <HapticAction style={styles.signOutButton} onPress={handleLogout} hapticStyle={Haptics.ImpactFeedbackStyle.Medium}>
            <LogOut size={s(20)} color={theme.colors.error} />
            <Text style={styles.signOutText}>Sign Out</Text>
          </HapticAction>

          <Text style={styles.versionText}>EARNGUARD PREMIUM V2.4.0</Text>
        </View>
      </ScrollView>
    </View>
  );
}

const SettingItem = ({ icon, title, value, badge, onPress }: any) => (
  <HapticAction onPress={onPress} style={styles.settingItem}>
    <View style={styles.settingLeft}>
      <View style={styles.settingIconBg}>
        {React.cloneElement(icon, { color: theme.colors.onSurface })}
      </View>
      <Text style={styles.settingText}>{title}</Text>
    </View>
    <View style={styles.settingRight}>
      {value && <Text style={styles.settingValue}>{value}</Text>}
      {badge && (
        <View style={styles.badge}>
          <Text style={styles.badgeText}>{badge}</Text>
        </View>
      )}
      <ChevronRight size={s(18)} color={theme.colors.divider} />
    </View>
  </HapticAction>
);

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: theme.colors.background,
  },
  scrollContent: {
    paddingTop: vs(110),
    paddingHorizontal: s(20),
    paddingBottom: vs(150),
  },
  heroSection: {
    alignItems: 'center',
    marginBottom: vs(40),
    paddingTop: vs(16),
  },
  largeAvatarContainer: {
    width: s(100),
    height: s(100),
    borderRadius: s(50),
    overflow: 'hidden',
    marginBottom: vs(24),
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.05,
    shadowRadius: 12,
    borderWidth: 1,
    borderColor: theme.colors.surface,
    elevation: 4,
  },
  largeAvatar: {
    width: '100%',
    height: '100%',
  },
  profileName: {
    fontFamily: 'Manrope_800ExtraBold',
    fontSize: ms(32),
    color: theme.colors.onSurface,
    letterSpacing: -1,
    marginBottom: vs(4),
  },
  profileEmail: {
    fontFamily: 'Inter_400Regular',
    fontSize: ms(14),
    color: theme.colors.onSurfaceVariant,
  },
  heroActions: {
    flexDirection: 'row',
    gap: s(12),
    marginTop: vs(24),
  },
  editButton: {
    backgroundColor: theme.colors.primary,
    paddingHorizontal: s(24),
    paddingVertical: vs(12),
    borderRadius: 99,
  },
  editButtonText: {
    fontFamily: 'Inter_700Bold',
    fontSize: ms(14),
    color: theme.colors.onPrimary,
  },
  statusButton: {
    backgroundColor: theme.colors.surface,
    paddingHorizontal: s(24),
    paddingVertical: vs(12),
    borderRadius: 99,
    borderWidth: 1,
    borderColor: theme.colors.divider,
  },
  statusButtonText: {
    fontFamily: 'Inter_700Bold',
    fontSize: ms(14),
    color: theme.colors.onSurface,
  },
  bentoRow: {
    flexDirection: 'row',
    gap: s(12),
    marginBottom: vs(40),
  },
  bentoCard: {
    flex: 1,
    aspectRatio: 1,
    backgroundColor: theme.colors.surface,
    padding: s(20),
    borderRadius: s(28),
    justifyContent: 'space-between',
    borderWidth: 1,
    borderColor: theme.colors.divider,
  },
  bentoIconContainer: {
    width: s(40),
    height: s(40),
    borderRadius: s(12),
    justifyContent: 'center',
    alignItems: 'center',
  },
  bentoLabel: {
    fontFamily: 'Inter_700Bold',
    fontSize: ms(10),
    color: theme.colors.onSurfaceVariant,
    letterSpacing: 1.5,
    marginBottom: vs(4),
  },
  bentoValue: {
    fontFamily: 'Manrope_800ExtraBold',
    fontSize: ms(20),
    color: theme.colors.onSurface,
  },
  settingsSection: {
    marginBottom: vs(40),
  },
  groupHeader: {
    fontFamily: 'Manrope_700Bold',
    fontSize: ms(11),
    color: theme.colors.onSurfaceVariant,
    letterSpacing: 2,
    marginBottom: vs(16),
    paddingHorizontal: s(8),
  },
  groupContainer: {
    backgroundColor: theme.colors.surface,
    borderRadius: s(28),
    overflow: 'hidden',
    borderWidth: 1,
    borderColor: theme.colors.divider,
  },
  settingItem: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: s(20),
  },
  settingLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: s(16),
  },
  settingIconBg: {
    width: s(36),
    height: s(36),
    borderRadius: s(10),
    backgroundColor: theme.colors.background,
    justifyContent: 'center',
    alignItems: 'center',
  },
  settingText: {
    fontFamily: 'Inter_600SemiBold',
    fontSize: ms(15),
    color: theme.colors.onSurface,
  },
  settingRight: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: s(12),
  },
  settingValue: {
    fontFamily: 'Inter_500Medium',
    fontSize: ms(14),
    color: theme.colors.onSurfaceVariant,
  },
  badge: {
    backgroundColor: theme.colors.successLight,
    paddingHorizontal: s(10),
    paddingVertical: vs(4),
    borderRadius: s(8),
  },
  badgeText: {
    fontFamily: 'Inter_700Bold',
    fontSize: ms(11),
    color: theme.colors.success,
  },
  groupSeparator: {
    height: 1,
    backgroundColor: theme.colors.divider,
    marginLeft: s(72),
  },
  signOutButton: {
    marginTop: vs(48),
    backgroundColor: theme.colors.errorLight,
    height: vs(64),
    borderRadius: s(20),
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    gap: s(12),
  },
  signOutText: {
    fontFamily: 'Inter_700Bold',
    fontSize: ms(16),
    color: theme.colors.error,
  },
  versionText: {
    fontFamily: 'Manrope_700Bold',
    fontSize: ms(10),
    color: theme.colors.outline,
    letterSpacing: 2,
    textAlign: 'center',
    marginTop: vs(32),
  },
});
