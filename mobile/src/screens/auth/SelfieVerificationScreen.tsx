import React, { useState } from 'react';
import { View, Text, TouchableOpacity, StyleSheet, ActivityIndicator } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useNavigation, useRoute } from '@react-navigation/native';
import { theme } from '../../theme/theme';
import { s, vs, ms } from '../../theme/responsive';
import { ChevronLeft, Camera } from 'lucide-react-native';
import * as Haptics from 'expo-haptics';

export default function SelfieVerificationScreen() {
  const navigation = useNavigation<any>();
  const route = useRoute<any>();
  const [isCapturing, setIsCapturing] = useState(false);
  const [isCaptured, setIsCaptured] = useState(false);

  const prevData = route.params || {};

  const handleCapture = () => {
    setIsCapturing(true);
    setTimeout(() => {
      setIsCapturing(false);
      setIsCaptured(true);
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
    }, 2000);
  };

  const handleContinue = () => {
    if (!isCaptured) return;
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    navigation.navigate('AllSet', prevData);
  };

  return (
    <SafeAreaView style={styles.safeArea}>
      <View style={styles.container}>
        <TouchableOpacity style={styles.backButton} onPress={() => navigation.goBack()} disabled={isCapturing}>
          <ChevronLeft size={s(22)} color={theme.colors.onSurface} />
        </TouchableOpacity>

        <Text style={styles.stepText}>Step 3 of 4</Text>
        <Text style={styles.title}>Take a selfie</Text>
        <Text style={styles.subtitle}>Please look into the camera and follow the instructions.</Text>

        <TouchableOpacity 
            style={[styles.cameraArea, isCaptured && styles.cameraAreaSuccess]} 
            onPress={!isCaptured && !isCapturing ? handleCapture : undefined}
            activeOpacity={0.8}
        >
          {isCapturing ? (
            <ActivityIndicator size="large" color={theme.colors.primary} />
          ) : isCaptured ? (
            <Text style={styles.successText}>Selfie Captured</Text>
          ) : (
             <Camera size={s(48)} color={theme.colors.outline} />
          )}
        </TouchableOpacity>

        <View style={styles.instructions}>
           <Text style={styles.instructionTitle}>Good Lighting</Text>
           <Text style={styles.instructionDesc}>Make sure your face is evenly lit.</Text>
           <View style={{height: vs(16)}} />
           <Text style={styles.instructionTitle}>Clear View</Text>
           <Text style={styles.instructionDesc}>Remove glasses or masks if necessary.</Text>
        </View>

        <View style={styles.footer}>
          <TouchableOpacity 
            style={[styles.primaryButton, !isCaptured && styles.primaryButtonDisabled]} 
            onPress={handleContinue}
            disabled={!isCaptured}
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
  cameraArea: { width: s(200), height: s(200), borderRadius: s(100), backgroundColor: theme.colors.surface, borderWidth: 2, borderColor: theme.colors.divider, alignSelf: 'center', justifyContent: 'center', alignItems: 'center', marginBottom: vs(32) },
  cameraAreaSuccess: { borderColor: theme.colors.primary, backgroundColor: theme.colors.primary + '10' },
  successText: { fontFamily: 'Inter_700Bold', fontSize: ms(16), color: theme.colors.primary },
  instructions: { paddingHorizontal: s(16) },
  instructionTitle: { fontFamily: 'Inter_700Bold', fontSize: ms(14), color: theme.colors.onSurface, marginBottom: vs(4) },
  instructionDesc: { fontFamily: 'Inter_400Regular', fontSize: ms(14), color: theme.colors.onSurfaceVariant },
  footer: { flex: 1, justifyContent: 'flex-end', paddingBottom: vs(40) },
  primaryButton: { backgroundColor: theme.colors.primary, height: vs(60), borderRadius: s(16), justifyContent: 'center', alignItems: 'center' },
  primaryButtonDisabled: { opacity: 0.5 },
  primaryButtonText: { color: '#FFFFFF', fontSize: ms(16), fontFamily: 'Inter_700Bold' },
});
