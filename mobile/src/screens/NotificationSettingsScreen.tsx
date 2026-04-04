import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, ScrollView, Switch, Platform } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { theme } from '../theme/theme';
import { s, vs, ms } from '../theme/responsive';
import { ChevronLeft, Info } from 'lucide-react-native';
import { useNavigation } from '@react-navigation/native';
import * as Haptics from 'expo-haptics';
import { HapticAction } from '../components/HapticAction';
import { CacheStorage, STORAGE_KEYS } from '../services/storage';

interface NotifPrefs {
  policyUpdates: boolean;
  securityNotices: boolean;
  claimAlerts: boolean;
  marketing: boolean;
}

const DEFAULT_PREFS: NotifPrefs = {
  policyUpdates: true,
  securityNotices: true,
  claimAlerts: true,
  marketing: false,
};

export default function NotificationSettingsScreen() {
  const navigation = useNavigation();
  const [settings, setSettings] = useState<NotifPrefs>(DEFAULT_PREFS);

  // Load saved preferences on mount
  useEffect(() => {
    (async () => {
      const saved = await CacheStorage.get<NotifPrefs>(STORAGE_KEYS.NOTIFICATION_PREFS);
      if (saved) setSettings(saved);
    })();
  }, []);

  const toggleSwitch = (key: keyof NotifPrefs) => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    setSettings(prev => {
      const updated = { ...prev, [key]: !prev[key] };
      CacheStorage.set(STORAGE_KEYS.NOTIFICATION_PREFS, updated);
      return updated;
    });
  };

  return (
    <SafeAreaView style={styles.safeArea}>
      <View style={styles.header}>
        <HapticAction style={styles.backButton} onPress={() => navigation.goBack()}>
          <ChevronLeft size={s(22)} color={theme.colors.onSurface} />
        </HapticAction>
        <Text style={styles.headerTitle}>Notifications</Text>
        <View style={styles.placeholder} />
      </View>

      <ScrollView contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>
        <View style={styles.hero}>
          <Text style={styles.title}>Preferences</Text>
          <Text style={styles.subtitle}>
            Control how you receive alerts about your protections.
          </Text>
        </View>

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>SECURITY</Text>
          <View style={styles.card}>
            <View style={styles.settingItem}>
              <View style={styles.settingText}>
                <Text style={styles.settingLabel}>Policy Updates</Text>
                <Text style={styles.settingDescription}>Changes to your coverage limits.</Text>
              </View>
              <Switch
                trackColor={{ false: theme.colors.divider, true: theme.colors.primary }}
                thumbColor={Platform.OS === 'ios' ? undefined : '#FFFFFF'}
                onValueChange={() => toggleSwitch('policyUpdates')}
                value={settings.policyUpdates}
              />
            </View>
            <View style={styles.divider} />
            <View style={styles.settingItem}>
              <View style={styles.settingText}>
                <Text style={styles.settingLabel}>Security Notices</Text>
                <Text style={styles.settingDescription}>Login attempts and activity.</Text>
              </View>
              <Switch
                trackColor={{ false: theme.colors.divider, true: theme.colors.primary }}
                thumbColor={Platform.OS === 'ios' ? undefined : '#FFFFFF'}
                onValueChange={() => toggleSwitch('securityNotices')}
                value={settings.securityNotices}
              />
            </View>
          </View>
        </View>

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>ACTIVITY</Text>
          <View style={styles.card}>
            <View style={styles.settingItem}>
              <View style={styles.settingText}>
                <Text style={styles.settingLabel}>Claim Alerts</Text>
                <Text style={styles.settingDescription}>Status updates on your payouts.</Text>
              </View>
              <Switch
                trackColor={{ false: theme.colors.divider, true: theme.colors.primary }}
                thumbColor={Platform.OS === 'ios' ? undefined : '#FFFFFF'}
                onValueChange={() => toggleSwitch('claimAlerts')}
                value={settings.claimAlerts}
              />
            </View>
          </View>
        </View>

        <View style={[styles.infoBox, { backgroundColor: theme.colors.surface }]}>
          <Info size={s(18)} color={theme.colors.onSurfaceVariant} />
          <Text style={styles.infoText}>
            Critical alerts for billing and legal updates are always enabled.
          </Text>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: theme.colors.background,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: s(16),
    height: vs(64),
  },
  backButton: {
    width: s(40),
    height: s(40),
    borderRadius: 20,
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: theme.colors.divider,
    backgroundColor: theme.colors.surface,
  },
  headerTitle: {
    fontFamily: 'Manrope_700Bold',
    fontSize: ms(17),
    color: theme.colors.onSurface,
  },
  placeholder: {
    width: s(40),
  },
  content: {
    paddingHorizontal: s(24),
    paddingBottom: vs(40),
  },
  hero: {
    marginTop: vs(24),
    marginBottom: vs(32),
  },
  title: {
    fontFamily: 'Manrope_800ExtraBold',
    fontSize: ms(32),
    color: theme.colors.onSurface,
    letterSpacing: -1,
    marginBottom: vs(4),
  },
  subtitle: {
    fontFamily: 'Inter_500Medium',
    fontSize: ms(16),
    color: theme.colors.onSurfaceVariant,
  },
  section: {
    marginBottom: vs(24),
  },
  sectionTitle: {
    fontFamily: 'Inter_700Bold',
    fontSize: ms(10),
    color: theme.colors.onSurfaceVariant,
    letterSpacing: 1.5,
    marginBottom: vs(12),
    marginLeft: s(4),
  },
  card: {
    backgroundColor: theme.colors.surface,
    borderRadius: s(24),
    borderWidth: 1,
    borderColor: theme.colors.divider,
    overflow: 'hidden',
  },
  settingItem: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: s(20),
    justifyContent: 'space-between',
  },
  settingText: {
    flex: 1,
    paddingRight: s(16),
  },
  settingLabel: {
    fontFamily: 'Manrope_700Bold',
    fontSize: ms(16),
    color: theme.colors.onSurface,
    marginBottom: vs(2),
  },
  settingDescription: {
    fontFamily: 'Inter_400Regular',
    fontSize: ms(13),
    color: theme.colors.onSurfaceVariant,
  },
  divider: {
    height: 1,
    backgroundColor: theme.colors.divider,
    marginHorizontal: s(20),
  },
  infoBox: {
    flexDirection: 'row',
    gap: s(12),
    padding: s(20),
    borderRadius: s(20),
    borderWidth: 1,
    borderColor: theme.colors.divider,
    marginTop: vs(12),
  },
  infoText: {
    flex: 1,
    fontFamily: 'Inter_500Medium',
    fontSize: ms(13),
    color: theme.colors.onSurfaceVariant,
    lineHeight: ms(18),
  },
});
