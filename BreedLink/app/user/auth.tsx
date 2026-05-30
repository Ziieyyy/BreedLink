
import React, { useState } from 'react';
import { View, Text, TextInput, TouchableOpacity, StyleSheet, KeyboardAvoidingView, Platform } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import { colors, buttonStyles, commonStyles } from '../styles/commonStyles';

export default function AuthScreen() {
  const router = useRouter();
  const [activeTab, setActiveTab] = useState<'login' | 'signup'>('login');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');

  const handleAuth = () => {
    console.log('Auth attempt:', { activeTab, email });
    // For demo purposes, navigate to home
    router.push('/home');
  };

  const handleSocialLogin = (provider: string) => {
    console.log('Social login:', provider);
    // For demo purposes, navigate to home
    router.push('/home');
  };

  return (
    <SafeAreaView style={styles.container}>
      <KeyboardAvoidingView 
        style={styles.keyboardView}
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
      >
        <View style={styles.content}>
          <View style={styles.header}>
            <Text style={styles.logo}>🐱</Text>
            <Text style={styles.welcomeText}>
              {activeTab === 'login' ? 'Welcome back! Your cats missed you 🐾' : 'Join the BreedLink community'}
            </Text>
          </View>

          <View style={styles.tabContainer}>
            <TouchableOpacity
              style={[styles.tab, activeTab === 'login' && styles.activeTab]}
              onPress={() => setActiveTab('login')}
            >
              <Text style={[styles.tabText, activeTab === 'login' && styles.activeTabText]}>
                Login
              </Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={[styles.tab, activeTab === 'signup' && styles.activeTab]}
              onPress={() => setActiveTab('signup')}
            >
              <Text style={[styles.tabText, activeTab === 'signup' && styles.activeTabText]}>
                Signup
              </Text>
            </TouchableOpacity>
          </View>

          <View style={styles.formContainer}>
            <TextInput
              style={commonStyles.input}
              placeholder="Email"
              placeholderTextColor={colors.textLight}
              value={email}
              onChangeText={setEmail}
              keyboardType="email-address"
              autoCapitalize="none"
            />

            <TextInput
              style={commonStyles.input}
              placeholder="Password"
              placeholderTextColor={colors.textLight}
              value={password}
              onChangeText={setPassword}
              secureTextEntry
            />

            {activeTab === 'signup' && (
              <TextInput
                style={commonStyles.input}
                placeholder="Confirm Password"
                placeholderTextColor={colors.textLight}
                value={confirmPassword}
                onChangeText={setConfirmPassword}
                secureTextEntry
              />
            )}

            <TouchableOpacity
              style={[buttonStyles.primary, styles.authButton]}
              onPress={handleAuth}
            >
              <Text style={buttonStyles.primaryText}>
                {activeTab === 'login' ? 'Log In' : 'Create Account'}
              </Text>
            </TouchableOpacity>

            {activeTab === 'login' && (
              <TouchableOpacity style={styles.forgotPassword}>
                <Text style={styles.forgotPasswordText}>Forgot Password?</Text>
              </TouchableOpacity>
            )}
          </View>

          <View style={styles.socialContainer}>
            <Text style={styles.orText}>Or continue with</Text>
            
            <View style={styles.socialButtons}>
              <TouchableOpacity
                style={styles.socialButton}
                onPress={() => handleSocialLogin('google')}
              >
                <Text style={styles.socialButtonText}>🔍 Google</Text>
              </TouchableOpacity>

              <TouchableOpacity
                style={styles.socialButton}
                onPress={() => handleSocialLogin('apple')}
              >
                <Text style={styles.socialButtonText}>🍎 Apple</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background,
  },
  keyboardView: {
    flex: 1,
  },
  content: {
    flex: 1,
    paddingHorizontal: 32,
    justifyContent: 'center',
  },
  header: {
    alignItems: 'center',
    marginBottom: 40,
  },
  logo: {
    fontSize: 60,
    marginBottom: 16,
  },
  welcomeText: {
    fontSize: 16,
    color: colors.textLight,
    textAlign: 'center',
  },
  tabContainer: {
    flexDirection: 'row',
    backgroundColor: colors.backgroundAlt,
    borderRadius: 12,
    padding: 4,
    marginBottom: 32,
  },
  tab: {
    flex: 1,
    paddingVertical: 12,
    alignItems: 'center',
    borderRadius: 8,
  },
  activeTab: {
    backgroundColor: colors.white,
  },
  tabText: {
    fontSize: 16,
    fontWeight: '500',
    color: colors.textLight,
  },
  activeTabText: {
    color: colors.text,
    fontWeight: '600',
  },
  formContainer: {
    marginBottom: 32,
  },
  authButton: {
    marginTop: 8,
  },
  forgotPassword: {
    alignItems: 'center',
    marginTop: 16,
  },
  forgotPasswordText: {
    fontSize: 14,
    color: colors.primary,
    fontWeight: '500',
  },
  socialContainer: {
    alignItems: 'center',
  },
  orText: {
    fontSize: 14,
    color: colors.textLight,
    marginBottom: 20,
  },
  socialButtons: {
    flexDirection: 'row',
    gap: 12,
  },
  socialButton: {
    backgroundColor: colors.backgroundAlt,
    paddingVertical: 12,
    paddingHorizontal: 20,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: colors.border,
  },
  socialButtonText: {
    fontSize: 14,
    color: colors.text,
    fontWeight: '500',
  },
});
