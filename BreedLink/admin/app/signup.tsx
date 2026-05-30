import React, { useState } from 'react';
import { Text, View, TouchableOpacity, TextInput, StyleSheet, ScrollView } from 'react-native';
import { commonStyles, colors, buttonStyles } from '../styles/commonStyles';
import { SafeAreaView } from 'react-native-safe-area-context';
import { router } from 'expo-router';
import Icon from '../components/Icon';

export default function SignupScreen() {
  const [fullName, setFullName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');

  const handleSignup = () => {
    console.log('Signup with:', fullName, email, password);
    router.push('/dashboard');
  };

  const handleGoogleSignup = () => {
    console.log('Google signup pressed');
  };

  const handleAppleSignup = () => {
    console.log('Apple signup pressed');
  };

  const handleLogin = () => {
    console.log('Login pressed');
    router.push('/login');
  };

  const handleBack = () => {
    router.back();
  };

  return (
    <SafeAreaView style={commonStyles.container}>
      <ScrollView style={styles.scrollView} showsVerticalScrollIndicator={false}>
        <View style={styles.header}>
          <TouchableOpacity onPress={handleBack} style={styles.backButton}>
            <Icon name="arrow-back" size={24} color={colors.text} />
          </TouchableOpacity>
        </View>

        <View style={styles.content}>
          <View style={styles.titleSection}>
            <Text style={styles.title}>Join BreedLink! 🐾</Text>
            <Text style={styles.subtitle}>Connect with cat lovers around the world</Text>
          </View>

          <View style={styles.formSection}>
            <TextInput
              style={commonStyles.input}
              placeholder="Full Name"
              placeholderTextColor={colors.textLight}
              value={fullName}
              onChangeText={setFullName}
              autoCapitalize="words"
            />

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

            <TextInput
              style={commonStyles.input}
              placeholder="Confirm Password"
              placeholderTextColor={colors.textLight}
              value={confirmPassword}
              onChangeText={setConfirmPassword}
              secureTextEntry
            />

            <TouchableOpacity 
              style={[buttonStyles.primary, styles.signupButton]}
              onPress={handleSignup}
            >
              <Text style={styles.signupButtonText}>Create Account</Text>
            </TouchableOpacity>
          </View>

          <View style={styles.dividerSection}>
            <View style={styles.dividerLine} />
            <Text style={styles.dividerText}>or</Text>
            <View style={styles.dividerLine} />
          </View>

          <View style={styles.socialSection}>
            <TouchableOpacity 
              style={[buttonStyles.outline, styles.socialButton]}
              onPress={handleGoogleSignup}
            >
              <View style={styles.socialButtonContent}>
                <Text style={styles.socialButtonText}>Continue with Google</Text>
              </View>
            </TouchableOpacity>

            <TouchableOpacity 
              style={[buttonStyles.outline, styles.socialButton]}
              onPress={handleAppleSignup}
            >
              <View style={styles.socialButtonContent}>
                <Text style={styles.socialButtonText}>Continue with Apple</Text>
              </View>
            </TouchableOpacity>
          </View>

          <TouchableOpacity onPress={handleLogin} style={styles.loginSection}>
            <Text style={styles.loginText}>
              Already have an account? <Text style={styles.loginLink}>Log In</Text>
            </Text>
          </TouchableOpacity>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  scrollView: {
    flex: 1,
  },
  header: {
    paddingHorizontal: 20,
    paddingTop: 10,
  },
  backButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: colors.backgroundAlt,
    alignItems: 'center',
    justifyContent: 'center',
  },
  content: {
    flex: 1,
    paddingHorizontal: 20,
    paddingTop: 40,
  },
  titleSection: {
    marginBottom: 40,
  },
  title: {
    fontSize: 32,
    fontWeight: '700',
    color: colors.text,
    textAlign: 'center',
    marginBottom: 8,
  },
  subtitle: {
    fontSize: 16,
    fontWeight: '400',
    color: colors.textSecondary,
    textAlign: 'center',
  },
  formSection: {
    marginBottom: 32,
    gap: 16,
  },
  signupButton: {
    width: '100%',
    marginTop: 8,
  },
  signupButtonText: {
    color: colors.background,
    fontSize: 16,
    fontWeight: '600',
  },
  dividerSection: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 32,
  },
  dividerLine: {
    flex: 1,
    height: 1,
    backgroundColor: colors.border,
  },
  dividerText: {
    marginHorizontal: 16,
    color: colors.textSecondary,
    fontSize: 14,
  },
  socialSection: {
    gap: 12,
    marginBottom: 40,
  },
  socialButton: {
    width: '100%',
  },
  socialButtonContent: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
  },
  socialButtonText: {
    color: colors.text,
    fontSize: 16,
    fontWeight: '500',
  },
  loginSection: {
    alignItems: 'center',
    paddingBottom: 20,
  },
  loginText: {
    color: colors.textSecondary,
    fontSize: 14,
  },
  loginLink: {
    color: colors.primary,
    fontWeight: '600',
  },
});