import React, { useState } from 'react';
import { View, Text, TextInput, TouchableOpacity, StyleSheet, ActivityIndicator, Alert, KeyboardAvoidingView, Platform, Image, ScrollView } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { theme } from '../theme/theme';
import { s, vs, ms } from '../theme/responsive';
import { useStore } from '../store';
import { Shield, Mail, Lock, Eye, EyeOff } from 'lucide-react-native';
import * as Haptics from 'expo-haptics';
import { useNavigation } from '@react-navigation/native';

export default function LoginScreen() {
  const navigation = useNavigation<any>();
  const { login, isLoading } = useStore();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);

  const handleLogin = async () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    if (!email || !password) {
      Alert.alert('Error', 'Please enter both email and password');
      return;
    }
    try {
      await login(email, password);
    } catch (e) {
      Alert.alert('Login Failed', 'Invalid credentials, please try again.');
    }
  };

  return (
    <SafeAreaView style={styles.safeArea}>
      <KeyboardAvoidingView 
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        style={styles.container}
      >
        <ScrollView contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>
          <View style={styles.header}>
            <View style={styles.logoContainer}>
              <Shield size={s(36)} color={theme.colors.primary} />
            </View>
            <Text style={styles.title}>Welcome back</Text>
            <Text style={styles.subtitle}>Sign in to your protection dashboard</Text>
          </View>

          <View style={styles.form}>
            <View style={styles.inputGroup}>
              <Text style={styles.label}>EMAIL ADDRESS</Text>
              <View style={styles.inputWrapper}>
                <Mail size={s(18)} color={theme.colors.onSurface} style={styles.inputIcon} />
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

            <View style={styles.inputGroup}>
              <Text style={styles.label}>PASSWORD</Text>
              <View style={styles.inputWrapper}>
                <Lock size={s(18)} color={theme.colors.onSurface} style={styles.inputIcon} />
                <TextInput
                  style={styles.input}
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
              <TouchableOpacity style={styles.forgotBtn}>
                <Text style={styles.forgotText}>Forgot Password?</Text>
              </TouchableOpacity>
            </View>

            <TouchableOpacity 
              style={styles.primaryButton} 
              onPress={handleLogin}
              disabled={isLoading}
              activeOpacity={0.9}
            >
              {isLoading ? (
                <ActivityIndicator color="#FFFFFF" />
              ) : (
                <Text style={styles.primaryButtonText}>Sign In</Text>
              )}
            </TouchableOpacity>

            <View style={styles.dividerRow}>
              <View style={styles.line} />
              <Text style={styles.dividerText}>OR</Text>
              <View style={styles.line} />
            </View>

            <View style={styles.socialRow}>
              <TouchableOpacity style={styles.socialBtn}>
                <Image source={{ uri: 'https://cdn-icons-png.flaticon.com/512/0/747.png' }} style={styles.socialIcon} />
                <Text style={styles.socialBtnText}>Apple</Text>
              </TouchableOpacity>
              <TouchableOpacity style={styles.socialBtn}>
                <Image source={{ uri: 'https://cdn-icons-png.flaticon.com/512/2991/2991148.png' }} style={styles.socialIcon} />
                <Text style={styles.socialBtnText}>Google</Text>
              </TouchableOpacity>
            </View>
          </View>

          <TouchableOpacity 
            style={styles.footer} 
            onPress={() => navigation.navigate('SignUp')}
          >
            <Text style={styles.footerText}>
              Don't have an account? <Text style={styles.signUpLink}>Sign Up</Text>
            </Text>
          </TouchableOpacity>

          <View style={styles.legalFooter}>
            <Text style={styles.legalText}>SECURED WITH 256-BIT AES ENCRYPTION</Text>
          </View>
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
    paddingTop: vs(40),
    paddingBottom: vs(24),
  },
  header: {
    alignItems: 'center',
    marginBottom: vs(48),
  },
  logoContainer: {
    width: s(72),
    height: s(72),
    borderRadius: s(24),
    backgroundColor: theme.colors.surface,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: vs(24),
    borderWidth: 1,
    borderColor: theme.colors.divider,
  },
  title: {
    fontFamily: 'Manrope_800ExtraBold',
    fontSize: ms(32),
    color: theme.colors.onSurface,
    letterSpacing: -1,
    marginBottom: vs(8),
  },
  subtitle: {
    fontFamily: 'Inter_500Medium',
    fontSize: ms(16),
    color: theme.colors.onSurfaceVariant,
    textAlign: 'center',
  },
  form: {
    gap: vs(24),
  },
  inputGroup: {
    gap: vs(8),
  },
  label: {
    fontFamily: 'Inter_700Bold',
    fontSize: ms(9),
    color: theme.colors.onSurfaceVariant,
    letterSpacing: 1.5,
    marginLeft: s(4),
  },
  inputWrapper: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: theme.colors.surface,
    borderRadius: s(16),
    height: vs(64),
    paddingHorizontal: s(20),
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
    fontSize: ms(16),
    color: theme.colors.onSurface,
  },
  eyeIcon: {
    padding: s(4),
  },
  forgotBtn: {
    alignSelf: 'flex-end',
    padding: s(4),
  },
  forgotText: {
    fontFamily: 'Inter_700Bold',
    fontSize: ms(14),
    color: theme.colors.onSurface,
    textDecorationLine: 'underline',
  },
  primaryButton: {
    backgroundColor: theme.colors.primary,
    height: vs(64),
    borderRadius: s(16),
    justifyContent: 'center',
    alignItems: 'center',
    marginTop: vs(8),
  },
  primaryButtonText: {
    fontFamily: 'Inter_700Bold',
    fontSize: ms(18),
    color: '#FFFFFF',
  },
  dividerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: s(12),
    marginVertical: vs(8),
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
  socialRow: {
    flexDirection: 'row',
    gap: s(16),
  },
  socialBtn: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: s(12),
    height: vs(56),
    borderRadius: s(16),
    backgroundColor: theme.colors.surface,
    borderWidth: 1,
    borderColor: theme.colors.divider,
  },
  socialIcon: {
    width: s(20),
    height: s(20),
  },
  socialBtnText: {
    fontFamily: 'Inter_700Bold',
    fontSize: ms(16),
    color: theme.colors.onSurface,
  },
  footer: {
    marginTop: vs(40),
    alignItems: 'center',
  },
  footerText: {
    fontFamily: 'Inter_500Medium',
    fontSize: ms(15),
    color: theme.colors.onSurfaceVariant,
  },
  signUpLink: {
    color: theme.colors.onSurface,
    fontFamily: 'Inter_700Bold',
    textDecorationLine: 'underline',
  },
  legalFooter: {
    marginTop: vs(48),
    alignItems: 'center',
  },
  legalText: {
    fontFamily: 'Manrope_700Bold',
    fontSize: ms(10),
    color: theme.colors.outline,
    letterSpacing: 1.5,
  },
});
