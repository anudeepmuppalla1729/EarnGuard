import React, { useState } from 'react';
import { View, Text, TextInput, TouchableOpacity, StyleSheet, KeyboardAvoidingView, Platform, ScrollView, Alert, ActivityIndicator } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { theme } from '../theme/theme';
import { s, vs, ms } from '../theme/responsive';
import { Shield, User, Mail, Smartphone, Lock, Eye, EyeOff, ChevronLeft } from 'lucide-react-native';
import * as Haptics from 'expo-haptics';
import { useNavigation } from '@react-navigation/native';
import { useAuthStore } from '../store/authStore';

export default function SignUpScreen() {
  const navigation = useNavigation<any>();
  const signup = useAuthStore(s => s.signup);
  const isLoading = useAuthStore(s => s.isLoading);
  const [fullName, setFullName] = useState('');
  const [email, setEmail] = useState('');
  const [phone, setPhone] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);

  const handleSignUp = async () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    if (!fullName || !email || !password) {
      Alert.alert('Error', 'Please fill in all required fields');
      return;
    }
    try {
      await signup(email, password, fullName);
      navigation.navigate('TwoFactorAuth');
    } catch (e: any) {
      Alert.alert('Sign Up Failed', e?.error?.message || 'Please try again.');
    }
  };

  const handleSignIn = () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    navigation.navigate('Login');
  };

  return (
    <SafeAreaView style={styles.safeArea}>
      <KeyboardAvoidingView 
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        style={styles.container}
      >
        <ScrollView contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>
          <TouchableOpacity style={styles.backButton} onPress={() => navigation.goBack()}>
            <ChevronLeft size={s(22)} color={theme.colors.onSurface} />
          </TouchableOpacity>

          <View style={styles.branding}>
            <View style={styles.logoBox}>
              <Shield size={s(32)} color={theme.colors.primary} />
            </View>
            <Text style={styles.title}>Create account</Text>
            <Text style={styles.subtitle}>Smart protection for delivery partners.</Text>
          </View>

          <View style={styles.formCard}>
            <View style={styles.inputContainer}>
              <Text style={styles.label}>FULL NAME</Text>
              <View style={styles.inputWrapper}>
                <User size={s(18)} color={theme.colors.outline} style={styles.inputIcon} />
                <TextInput
                  style={styles.input}
                  placeholder="John Doe"
                  placeholderTextColor={theme.colors.outline}
                  value={fullName}
                  onChangeText={setFullName}
                />
              </View>
            </View>

            <View style={styles.inputContainer}>
              <Text style={styles.label}>EMAIL</Text>
              <View style={styles.inputWrapper}>
                <Mail size={s(18)} color={theme.colors.outline} style={styles.inputIcon} />
                <TextInput
                  style={styles.input}
                  placeholder="name@example.com"
                  placeholderTextColor={theme.colors.outline}
                  value={email}
                  onChangeText={setEmail}
                  autoCapitalize="none"
                  keyboardType="email-address"
                />
              </View>
            </View>

            <View style={styles.inputContainer}>
              <Text style={styles.label}>PHONE NUMBER</Text>
              <View style={styles.inputWrapper}>
                <Smartphone size={s(18)} color={theme.colors.outline} style={styles.inputIcon} />
                <TextInput
                  style={styles.input}
                  placeholder="+1 (555) 000-0000"
                  placeholderTextColor={theme.colors.outline}
                  value={phone}
                  onChangeText={setPhone}
                  keyboardType="phone-pad"
                />
              </View>
            </View>

            <View style={styles.inputContainer}>
              <Text style={styles.label}>PASSWORD</Text>
              <View style={styles.inputWrapper}>
                <Lock size={s(18)} color={theme.colors.outline} style={styles.inputIcon} />
                <TextInput
                  style={[styles.input, { paddingRight: s(48) }]}
                  placeholder="••••••••"
                  placeholderTextColor={theme.colors.outline}
                  value={password}
                  onChangeText={setPassword}
                  secureTextEntry={!showPassword}
                />
                <TouchableOpacity 
                  style={styles.eyeIcon} 
                  onPress={() => setShowPassword(!showPassword)}
                >
                  {showPassword ? <EyeOff size={s(18)} color={theme.colors.outline} /> : <Eye size={s(18)} color={theme.colors.outline} />}
                </TouchableOpacity>
              </View>
            </View>

            <TouchableOpacity 
              style={styles.primaryButton} 
              onPress={handleSignUp}
              activeOpacity={0.9}
            >
              <Text style={styles.primaryButtonText}>Create Account</Text>
            </TouchableOpacity>

            <View style={styles.dividerRow}>
              <View style={styles.line} />
              <Text style={styles.dividerText}>OR</Text>
              <View style={styles.line} />
            </View>

            <TouchableOpacity 
              style={styles.secondaryButton} 
              onPress={handleSignIn}
              activeOpacity={0.8}
            >
              <Text style={styles.secondaryButtonText}>Sign In</Text>
            </TouchableOpacity>
          </View>

          <Text style={styles.footerLegal}>
            By continuing, you agree to our{' '}
            <Text style={styles.legalLink}>Terms</Text> and{' '}
            <Text style={styles.legalLink}>Privacy Policy</Text>.
          </Text>
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: theme.colors.background,
  },
  container: {
    flex: 1,
  },
  scrollContent: {
    flexGrow: 1,
    paddingHorizontal: s(24),
    paddingBottom: vs(40),
    paddingTop: vs(16),
  },
  backButton: {
    width: s(40),
    height: s(40),
    borderRadius: s(20),
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: vs(16),
    borderWidth: 1,
    borderColor: theme.colors.divider,
    backgroundColor: theme.colors.surface,
  },
  branding: {
    alignItems: 'center',
    marginBottom: vs(32),
  },
  logoBox: {
    width: s(64),
    height: s(64),
    borderRadius: s(20),
    backgroundColor: theme.colors.surface,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: vs(20),
    borderWidth: 1,
    borderColor: theme.colors.divider,
  },
  title: {
    fontFamily: 'Manrope_800ExtraBold',
    fontSize: ms(28),
    color: theme.colors.onSurface,
    letterSpacing: -0.5,
    marginBottom: vs(4),
  },
  subtitle: {
    fontFamily: 'Inter_500Medium',
    fontSize: ms(15),
    color: theme.colors.onSurfaceVariant,
    textAlign: 'center',
  },
  formCard: {
    backgroundColor: theme.colors.surface,
    borderRadius: s(28),
    padding: s(24),
    borderWidth: 1,
    borderColor: theme.colors.divider,
  },
  inputContainer: {
    marginBottom: vs(16),
  },
  label: {
    fontFamily: 'Inter_700Bold',
    fontSize: ms(9),
    color: theme.colors.onSurfaceVariant,
    letterSpacing: 1.5,
    marginBottom: vs(8),
    marginLeft: s(4),
  },
  inputWrapper: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: theme.colors.background,
    borderRadius: s(14),
    height: vs(56),
    paddingHorizontal: s(16),
    borderWidth: 1,
    borderColor: theme.colors.divider,
  },
  inputIcon: {
    marginRight: s(12),
  },
  input: {
    flex: 1,
    height: '100%',
    fontFamily: 'Inter_500Medium',
    fontSize: ms(15),
    color: theme.colors.onSurface,
  },
  eyeIcon: {
    position: 'absolute',
    right: s(16),
  },
  primaryButton: {
    backgroundColor: theme.colors.primary,
    height: vs(60),
    borderRadius: s(16),
    justifyContent: 'center',
    alignItems: 'center',
    marginTop: vs(8),
  },
  primaryButtonText: {
    color: '#FFFFFF',
    fontSize: ms(16),
    fontFamily: 'Inter_700Bold',
  },
  dividerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginVertical: vs(24),
    gap: s(12),
  },
  line: {
    flex: 1,
    height: 1,
    backgroundColor: theme.colors.divider,
  },
  dividerText: {
    fontFamily: 'Inter_700Bold',
    fontSize: ms(10),
    color: theme.colors.outline,
  },
  secondaryButton: {
    backgroundColor: theme.colors.surface,
    height: vs(60),
    borderRadius: s(16),
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: theme.colors.divider,
  },
  secondaryButtonText: {
    color: theme.colors.onSurface,
    fontSize: ms(16),
    fontFamily: 'Inter_700Bold',
  },
  footerLegal: {
    marginTop: vs(32),
    textAlign: 'center',
    fontFamily: 'Inter_500Medium',
    fontSize: ms(12),
    color: theme.colors.onSurfaceVariant,
    lineHeight: vs(18),
    paddingHorizontal: s(20),
  },
  legalLink: {
    color: theme.colors.onSurface,
    fontFamily: 'Inter_600SemiBold',
    textDecorationLine: 'underline',
  },
});
