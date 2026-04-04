import React, { useState } from 'react';
import { View, Text, TouchableOpacity, StyleSheet, ActivityIndicator } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useNavigation, useRoute } from '@react-navigation/native';
import { theme } from '../../theme/theme';
import { s, vs, ms } from '../../theme/responsive';
import { ChevronLeft, UploadCloud } from 'lucide-react-native';
import * as Haptics from 'expo-haptics';

export default function IdentityVerificationScreen() {
  const navigation = useNavigation<any>();
  const route = useRoute<any>();
  const [isUploading, setIsUploading] = useState(false);
  const [isUploaded, setIsUploaded] = useState(false);

  const prevData = route.params || {};

  const handleUpload = () => {
    setIsUploading(true);
    setTimeout(() => {
      setIsUploading(false);
      setIsUploaded(true);
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
    }, 2000);
  };

  const handleContinue = () => {
    if (!isUploaded) return;
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    navigation.navigate('SelfieVerification', prevData);
  };

  return (
    <SafeAreaView style={styles.safeArea}>
      <View style={styles.container}>
        <TouchableOpacity style={styles.backButton} onPress={() => navigation.goBack()} disabled={isUploading}>
          <ChevronLeft size={s(22)} color={theme.colors.onSurface} />
        </TouchableOpacity>

        <Text style={styles.stepText}>Step 2 of 4</Text>
        <Text style={styles.title}>Verify your identity</Text>
        <Text style={styles.subtitle}>A quick scan to keep your account secure.</Text>

        <TouchableOpacity 
            style={[styles.uploadArea, isUploaded && styles.uploadAreaSuccess]} 
            onPress={!isUploaded && !isUploading ? handleUpload : undefined}
            activeOpacity={0.8}
        >
          {isUploading ? (
            <ActivityIndicator size="large" color={theme.colors.primary} />
          ) : isUploaded ? (
            <Text style={styles.successText}>ID Uploaded Successfully</Text>
          ) : (
            <>
              <UploadCloud size={s(48)} color={theme.colors.primary} style={{marginBottom: vs(16)}} />
              <Text style={styles.uploadTitle}>Upload Aadhaar / ID Card</Text>
              <Text style={styles.uploadSubtitle}>PNG, JPG or PDF (Max. 5MB)</Text>
            </>
          )}
        </TouchableOpacity>

        <Text style={styles.legalText}>Your data is encrypted and stored securely. We only use this information for mandatory identity verification.</Text>

        <View style={styles.footer}>
          <TouchableOpacity 
            style={[styles.primaryButton, !isUploaded && styles.primaryButtonDisabled]} 
            onPress={handleContinue}
            disabled={!isUploaded}
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
  subtitle: { fontFamily: 'Inter_500Medium', fontSize: ms(15), color: theme.colors.onSurfaceVariant, marginBottom: vs(32), lineHeight: ms(22) },
  uploadArea: { height: vs(200), borderRadius: s(16), borderWidth: 2, borderColor: theme.colors.divider, borderStyle: 'dashed', justifyContent: 'center', alignItems: 'center', backgroundColor: theme.colors.surface, marginBottom: vs(24) },
  uploadAreaSuccess: { borderColor: theme.colors.primary, backgroundColor: theme.colors.primary + '10', borderStyle: 'solid' },
  uploadTitle: { fontFamily: 'Inter_700Bold', fontSize: ms(16), color: theme.colors.onSurface, marginBottom: vs(4) },
  uploadSubtitle: { fontFamily: 'Inter_500Medium', fontSize: ms(12), color: theme.colors.outline },
  successText: { fontFamily: 'Inter_700Bold', fontSize: ms(18), color: theme.colors.primary },
  legalText: { fontFamily: 'Inter_400Regular', fontSize: ms(12), color: theme.colors.outline, textAlign: 'center', lineHeight: ms(18) },
  footer: { flex: 1, justifyContent: 'flex-end', paddingBottom: vs(40) },
  primaryButton: { backgroundColor: theme.colors.primary, height: vs(60), borderRadius: s(16), justifyContent: 'center', alignItems: 'center' },
  primaryButtonDisabled: { opacity: 0.5 },
  primaryButtonText: { color: '#FFFFFF', fontSize: ms(16), fontFamily: 'Inter_700Bold' },
});
