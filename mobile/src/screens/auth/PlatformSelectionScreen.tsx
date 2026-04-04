import React, { useState } from 'react';
import { View, Text, TouchableOpacity, StyleSheet } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useNavigation, useRoute } from '@react-navigation/native';
import { theme } from '../../theme/theme';
import { s, vs, ms } from '../../theme/responsive';
import { ChevronLeft, CheckCircle2 } from 'lucide-react-native';
import * as Haptics from 'expo-haptics';

type Platform = 'ZEPTO' | 'BLINKIT' | 'SWIGGY';

const PLATFORMS: { id: Platform; label: string; tagline: string }[] = [
  { id: 'ZEPTO',   label: 'Zepto',   tagline: '10-minute delivery' },
  { id: 'BLINKIT', label: 'Blinkit', tagline: 'Quick commerce' },
  { id: 'SWIGGY',  label: 'Swiggy',  tagline: 'Food & grocery delivery' },
];

export default function PlatformSelectionScreen() {
  const navigation = useNavigation<any>();
  const route = useRoute<any>();
  const [selectedPlatform, setSelectedPlatform] = useState<Platform | null>(null);

  const prevData = route.params || {};

  const handleSelect = (platform: Platform) => {
    Haptics.selectionAsync();
    setSelectedPlatform(platform);
  };

  const handleContinue = () => {
    if (!selectedPlatform) return;
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    // Pass the platform along — worker ID is resolved server-side from email + mobile
    navigation.navigate('IdentityVerification', { ...prevData, platform: selectedPlatform });
  };

  return (
    <SafeAreaView style={styles.safeArea}>
      <View style={styles.container}>
        <TouchableOpacity style={styles.backButton} onPress={() => navigation.goBack()}>
          <ChevronLeft size={s(22)} color={theme.colors.onSurface} />
        </TouchableOpacity>

        <Text style={styles.stepText}>Step 1 of 4</Text>
        <Text style={styles.title}>Which platform do you work on?</Text>
        <Text style={styles.subtitle}>
          Select your primary platform. We'll automatically link your account using your registered mobile number.
        </Text>

        <View style={styles.optionsContainer}>
          {PLATFORMS.map(p => (
            <TouchableOpacity
              key={p.id}
              style={[styles.optionCard, selectedPlatform === p.id && styles.optionCardSelected]}
              onPress={() => handleSelect(p.id)}
              activeOpacity={0.8}
            >
              <View style={styles.optionContent}>
                <View>
                  <Text style={[styles.optionText, selectedPlatform === p.id && styles.optionTextSelected]}>
                    {p.label}
                  </Text>
                  <Text style={styles.optionTagline}>{p.tagline}</Text>
                </View>
                {selectedPlatform === p.id && (
                  <CheckCircle2 size={s(22)} color={theme.colors.primary} />
                )}
              </View>
            </TouchableOpacity>
          ))}
        </View>

        <View style={styles.infoBox}>
          <Text style={styles.infoText}>
            🔒 Your worker ID is automatically assigned by the platform. No manual entry needed.
          </Text>
        </View>

        <View style={styles.footer}>
          <TouchableOpacity
            style={[styles.primaryButton, !selectedPlatform && styles.primaryButtonDisabled]}
            onPress={handleContinue}
            disabled={!selectedPlatform}
            activeOpacity={0.9}
          >
            <Text style={styles.primaryButtonText}>Continue</Text>
          </TouchableOpacity>
        </View>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: { flex: 1, backgroundColor: theme.colors.background },
  container: { flex: 1, paddingHorizontal: s(24), paddingTop: vs(16) },
  backButton: { width: s(40), height: s(40), borderRadius: s(20), justifyContent: 'center', alignItems: 'center', marginBottom: vs(24), borderWidth: 1, borderColor: theme.colors.divider, backgroundColor: theme.colors.surface },
  stepText: { fontFamily: 'Inter_600SemiBold', fontSize: ms(12), color: theme.colors.outline, textTransform: 'uppercase', marginBottom: vs(8) },
  title: { fontFamily: 'Manrope_800ExtraBold', fontSize: ms(28), color: theme.colors.onSurface, letterSpacing: -0.5, marginBottom: vs(12) },
  subtitle: { fontFamily: 'Inter_500Medium', fontSize: ms(14), color: theme.colors.onSurfaceVariant, marginBottom: vs(28), lineHeight: ms(21) },
  optionsContainer: { gap: vs(12) },
  optionCard: { padding: s(20), borderRadius: s(16), backgroundColor: theme.colors.surface, borderWidth: 1, borderColor: theme.colors.divider },
  optionCardSelected: { borderColor: theme.colors.primary, backgroundColor: theme.colors.primary + '10' },
  optionContent: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  optionText: { fontFamily: 'Inter_700Bold', fontSize: ms(16), color: theme.colors.onSurface, marginBottom: vs(2) },
  optionTextSelected: { color: theme.colors.primary },
  optionTagline: { fontFamily: 'Inter_400Regular', fontSize: ms(12), color: theme.colors.outline },
  infoBox: { marginTop: vs(24), padding: s(16), borderRadius: s(12), backgroundColor: theme.colors.surface, borderWidth: 1, borderColor: theme.colors.divider },
  infoText: { fontFamily: 'Inter_500Medium', fontSize: ms(13), color: theme.colors.onSurfaceVariant, lineHeight: ms(20) },
  footer: { flex: 1, justifyContent: 'flex-end', paddingBottom: vs(40) },
  primaryButton: { backgroundColor: theme.colors.primary, height: vs(60), borderRadius: s(16), justifyContent: 'center', alignItems: 'center' },
  primaryButtonDisabled: { opacity: 0.5 },
  primaryButtonText: { color: '#FFFFFF', fontSize: ms(16), fontFamily: 'Inter_700Bold' },
});
