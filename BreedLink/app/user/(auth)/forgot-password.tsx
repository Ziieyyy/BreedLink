import React, { useState } from 'react';
import { View, Text, TextInput, TouchableOpacity, StyleSheet } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import { commonStyles, colors, buttonStyles } from '../../styles/commonStyles';
import Icon from '../../components/Icon';
import CustomAlert, { AlertType } from '../../components/CustomAlert';
import { supabase } from '../../supabase';
import AsyncStorage from '@react-native-async-storage/async-storage';

export default function ForgotPasswordScreen() {
  const router = useRouter();
  const [email, setEmail] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [isEmailSent, setIsEmailSent] = useState(false);
  const [alert, setAlert] = useState<{ visible: boolean; type: AlertType; title: string; message: string }>({ 
    visible: false, 
    type: 'error', 
    title: '', 
    message: '' 
  });

  const handleResetPassword = async () => {
    if (!email) {
      setAlert({ visible: true, type: 'error', title: 'Error', message: 'Please enter your email address' });
      return;
    }

    // Basic email validation
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
      setAlert({ visible: true, type: 'error', title: 'Error', message: 'Please enter a valid email address' });
      return;
    }

    setIsLoading(true);
    console.log('🔵 Sending password reset OTP to email:', email);
    
    try {
      // Use Supabase's resetPasswordForEmail to send OTP
      const { data, error } = await supabase.auth.resetPasswordForEmail(email, {
        redirectTo: 'natively://(auth)/reset-password',
      });

      if (error) {
        console.error('❌ Error sending reset email:', error.message);
        setAlert({ 
          visible: true, 
          type: 'error', 
          title: 'Error', 
          message: error.message 
        });
        setIsLoading(false);
        return;
      }

      console.log('✅ Password reset email sent successfully');
      
      // Store email in AsyncStorage for verification
      await AsyncStorage.setItem('reset_email', email);
      
      setIsEmailSent(true);
      setIsLoading(false);
    } catch (err) {
      console.error('❌ Unexpected error:', err);
      setAlert({ 
        visible: true, 
        type: 'error', 
        title: 'Error', 
        message: 'Failed to send verification code. Please try again.' 
      });
      setIsLoading(false);
    }
  };

  const handleBackToLogin = () => {
    router.back();
  };

  const handleResetPasswordClick = () => {
    console.log('🔵 Navigating to code verification page');
    // Navigate to reset-password page
    router.push('/(auth)/reset-password');
  };

  if (isEmailSent) {
    return (
      <SafeAreaView style={commonStyles.container}>
        <CustomAlert
          visible={alert.visible}
          type={alert.type}
          title={alert.title}
          message={alert.message}
          onConfirm={() => setAlert({ ...alert, visible: false })}
        />
        <View style={styles.container}>
          <View style={styles.header}>
            <TouchableOpacity
              style={styles.backButton}
              onPress={handleBackToLogin}
            >
              <Icon name="arrow-back" size={24} color={colors.text} />
            </TouchableOpacity>
          </View>

          <View style={styles.content}>
            <View style={styles.successContainer}>
              <Text style={styles.successIcon}>📧</Text>
              <Text style={styles.successTitle}>Check your email</Text>
              <Text style={styles.successSubtitle}>
                We've sent a 6-digit code to
              </Text>
              <Text style={styles.emailText}>{email}</Text>
              
              <Text style={styles.successDescription}>
                Enter the 6-digit code from your email above to reset your password.
              </Text>
            </View>

            <TouchableOpacity
              style={[buttonStyles.primary, styles.button]}
              onPress={handleResetPasswordClick}
            >
              <Text style={buttonStyles.primaryText}>Reset Password</Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={styles.resendButton}
              onPress={() => {
                setIsEmailSent(false);
                handleResetPassword();
              }}
            >
              <Text style={styles.resendButtonText}>Resend Email</Text>
            </TouchableOpacity>
          </View>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={commonStyles.container}>
      <CustomAlert
        visible={alert.visible}
        type={alert.type}
        title={alert.title}
        message={alert.message}
        onConfirm={() => setAlert({ ...alert, visible: false })}
      />
      <View style={styles.container}>
        <View style={styles.header}>
          <TouchableOpacity
            style={styles.backButton}
            onPress={handleBackToLogin}
          >
            <Icon name="arrow-back" size={24} color={colors.text} />
          </TouchableOpacity>
        </View>

        <View style={styles.content}>
          <Text style={styles.title}>Forgot Password?</Text>
          <Text style={styles.subtitle}>
            No worries! Enter your email and we'll send you a reset link.
          </Text>

          <View style={styles.form}>
            <TextInput
              style={commonStyles.input}
              placeholder="Email"
              value={email}
              onChangeText={setEmail}
              keyboardType="email-address"
              autoCapitalize="none"
              placeholderTextColor={colors.textLight}
            />

            <TouchableOpacity
              style={[buttonStyles.primary, styles.resetButton]}
              onPress={handleResetPassword}
              disabled={isLoading}
            >
              <Text style={styles.resetButtonText}>
                {isLoading ? 'Sending...' : 'Send Reset Link'}
              </Text>
            </TouchableOpacity>
          </View>
        </View>

        <View style={styles.footer}>
          <Text style={styles.footerText}>
            Remember your password?{' '}
            <Text style={styles.loginLink} onPress={handleBackToLogin}>
              Back to Login
            </Text>
          </Text>
        </View>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    paddingHorizontal: 24,
  },
  header: {
    paddingVertical: 16,
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
    justifyContent: 'center',
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
    color: colors.textLight,
    textAlign: 'center',
    marginBottom: 40,
    lineHeight: 24,
  },
  form: {
    gap: 0,
  },
  resetButton: {
    marginTop: 8,
  },
  resetButtonText: {
    color: colors.white,
    fontSize: 16,
    fontWeight: '600',
  },
  footer: {
    paddingVertical: 24,
    alignItems: 'center',
  },
  footerText: {
    fontSize: 14,
    color: colors.textLight,
  },
  loginLink: {
    color: colors.primary,
    fontWeight: '600',
  },
  successContainer: {
    alignItems: 'center',
    marginBottom: 40,
  },
  successIcon: {
    fontSize: 60,
    marginBottom: 24,
  },
  successTitle: {
    fontSize: 24,
    fontWeight: '700',
    color: colors.text,
    textAlign: 'center',
    marginBottom: 8,
  },
  successSubtitle: {
    fontSize: 16,
    color: colors.textLight,
    textAlign: 'center',
    marginBottom: 4,
  },
  emailText: {
    fontSize: 16,
    fontWeight: '600',
    color: colors.text,
    textAlign: 'center',
    marginBottom: 16,
  },
  successDescription: {
    fontSize: 14,
    color: colors.textLight,
    textAlign: 'center',
    lineHeight: 20,
  },
  button: {
    marginBottom: 16,
  },
  resendButton: {
    alignItems: 'center',
    padding: 12,
  },
  resendButtonText: {
    fontSize: 14,
    color: colors.primary,
    fontWeight: '500',
  },
});