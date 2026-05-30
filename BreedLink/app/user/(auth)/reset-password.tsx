import React, { useState, useEffect, useRef } from 'react';
import { View, Text, TextInput, TouchableOpacity, StyleSheet, ActivityIndicator } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter, useLocalSearchParams } from 'expo-router';
import { commonStyles, colors, buttonStyles } from '../../styles/commonStyles';
import Icon from '../../components/Icon';
import CustomAlert, { AlertType } from '../../components/CustomAlert';
import { supabase } from '../../supabase';
import AsyncStorage from '@react-native-async-storage/async-storage';

// Password validation function
const validatePassword = (password: string): { isValid: boolean; message: string } => {
  // Check length (6-12 characters)
  if (password.length < 6) {
    return { 
      isValid: false, 
      message: 'Password must be at least 6 characters long. The longer your password, the harder it is to crack.' 
    };
  }
  
  if (password.length > 12) {
    return { 
      isValid: false, 
      message: 'Password must be no more than 12 characters long.' 
    };
  }
  
  // Check for uppercase letter
  if (!/[A-Z]/.test(password)) {
    return { 
      isValid: false, 
      message: 'Password must include at least one uppercase letter (A-Z).' 
    };
  }
  
  // Check for lowercase letter
  if (!/[a-z]/.test(password)) {
    return { 
      isValid: false, 
      message: 'Password must include at least one lowercase letter (a-z).' 
    };
  }
  
  // Check for number
  if (!/[0-9]/.test(password)) {
    return { 
      isValid: false, 
      message: 'Password must include at least one number (0-9).' 
    };
  }
  
  // Check for special character
  if (!/[!@#$%^&*()_+\-=\[\]{};':"\\|,.<>\/?]/.test(password)) {
    return { 
      isValid: false, 
      message: 'Password must include at least one special character (!@#$%^&*()_+-=[]{};\':"\\|,.<>/?).' 
    };
  }
  
  return { isValid: true, message: '' };
};

// Password requirement checker component
const PasswordRequirementChecker = ({ password }: { password: string }) => {
  const requirements = [
    { 
      text: '6-12 characters', 
      met: password.length >= 6 && password.length <= 12 
    },
    { 
      text: 'One uppercase letter (A-Z)', 
      met: /[A-Z]/.test(password) 
    },
    { 
      text: 'One lowercase letter (a-z)', 
      met: /[a-z]/.test(password) 
    },
    { 
      text: 'One number (0-9)', 
      met: /[0-9]/.test(password) 
    },
    { 
      text: 'One special character (!@#$%^&* etc.)', 
      met: /[!@#$%^&*()_+\-=\[\]{};':"\\|,.<>\/?]/.test(password) 
    }
  ];

  return (
    <View style={styles.requirementsContainer}>
      <Text style={styles.requirementsTitle}>Password Requirements:</Text>
      {requirements.map((req, index) => (
        <View key={index} style={styles.requirementRow}>
          <Icon 
            name={req.met ? "checkmark-circle" : "close-circle"} 
            size={20} 
            color={req.met ? colors.success : colors.error} 
          />
          <Text style={[
            styles.requirementText, 
            { color: req.met ? colors.text : colors.textLight }
          ]}>
            {req.text}
          </Text>
        </View>
      ))}
    </View>
  );
};

export default function ResetPasswordScreen() {
  const router = useRouter();
  const params = useLocalSearchParams();
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [isVerifying, setIsVerifying] = useState(false);
  const [userEmail, setUserEmail] = useState('');
  const [alert, setAlert] = useState<{ visible: boolean; type: AlertType; title: string; message: string }>({ 
    visible: false, 
    type: 'error', 
    title: '', 
    message: '' 
  });
  const [showNewPassword, setShowNewPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  
  // Create refs for each digit input
  const digitRefs = [
    useRef<TextInput>(null),
    useRef<TextInput>(null),
    useRef<TextInput>(null),
    useRef<TextInput>(null),
    useRef<TextInput>(null),
    useRef<TextInput>(null)
  ];
  
  // State for each digit
  const [digits, setDigits] = useState(['', '', '', '', '', '']);
  const [isCodeVerified, setIsCodeVerified] = useState(false);

  useEffect(() => {
    // Get email from AsyncStorage
    const getEmail = async () => {
      const storedEmail = await AsyncStorage.getItem('reset_email');
      if (storedEmail) {
        setUserEmail(storedEmail);
        console.log('📧 Email retrieved:', storedEmail);
      }
    };
    
    getEmail();
  }, []);

  // Handle digit input change
  const handleDigitChange = (text: string, index: number) => {
    // Only allow digits
    if (text && !/^\d*$/.test(text)) return;
    
    const newDigits = [...digits];
    
    if (text.length > 1) {
      // If pasting multiple digits, fill as many as possible
      const pastedDigits = text.split('').slice(0, 6 - index);
      pastedDigits.forEach((digit, i) => {
        if (index + i < 6) {
          newDigits[index + i] = digit;
        }
      });
      setDigits(newDigits);
      
      // Focus on the next empty field or the last field
      let nextIndex = index + pastedDigits.length;
      while (nextIndex < 5 && newDigits[nextIndex] !== '') {
        nextIndex++;
      }
      if (nextIndex < 6) {
        digitRefs[nextIndex].current?.focus();
      }
    } else {
      newDigits[index] = text;
      setDigits(newDigits);
      
      // Move to next input if a digit is entered and next field is empty
      if (text && index < 5 && digits[index + 1] === '') {
        digitRefs[index + 1].current?.focus();
      }
    }
  };

  // Handle backspace key press
  const handleKeyPress = (e: any, index: number) => {
    if (e.nativeEvent.key === 'Backspace' && !digits[index] && index > 0) {
      digitRefs[index - 1].current?.focus();
    }
  };

  // Get the full 6-digit code
  const getFullCode = () => digits.join('');

  // Verify the 6-digit code
  const verifyCode = async () => {
    const verificationCode = getFullCode();
    console.log('🔍 Verifying OTP code...');
    
    // Validate 6-digit code
    if (!verificationCode || verificationCode.length !== 6) {
      setAlert({ 
        visible: true, 
        type: 'error', 
        title: 'Error', 
        message: 'Please enter the 6-digit code from your email' 
      });
      return;
    }

    if (!userEmail) {
      setAlert({ 
        visible: true, 
        type: 'error', 
        title: 'Error', 
        message: 'Email not found. Please try again.' 
      });
      return;
    }

    setIsLoading(true);

    try {
      // Verify OTP code using recovery type
      const { data, error: verifyError } = await supabase.auth.verifyOtp({
        email: userEmail,
        token: verificationCode,
        type: 'recovery' // Use 'recovery' for password reset
      });

      if (verifyError) {
        console.error('❌ OTP verification failed:', verifyError.message);
        setAlert({ 
          visible: true, 
          type: 'error', 
          title: 'Error', 
          message: 'Invalid or expired code. Please try again.' 
        });
        setIsLoading(false);
        return;
      }

      console.log('✅ OTP code verified!');
      setIsCodeVerified(true);
      setIsLoading(false);
      
    } catch (err) {
      console.error('❌ Unexpected error:', err);
      setAlert({ 
        visible: true, 
        type: 'error', 
        title: 'Error', 
        message: 'Failed to verify code. Please try again.' 
      });
      setIsLoading(false);
    }
  };

  // Reset password after code verification
  const resetPassword = async () => {
    // Validate passwords
    if (!newPassword || !confirmPassword) {
      setAlert({ 
        visible: true, 
        type: 'error', 
        title: 'Error', 
        message: 'Please fill in all password fields' 
      });
      return;
    }

    // Validate password
    const passwordValidation = validatePassword(newPassword);
    if (!passwordValidation.isValid) {
      setAlert({ 
        visible: true, 
        type: 'error', 
        title: 'Password Error', 
        message: passwordValidation.message 
      });
      return;
    }

    if (newPassword !== confirmPassword) {
      setAlert({ 
        visible: true, 
        type: 'error', 
        title: 'Error', 
        message: 'Passwords do not match' 
      });
      return;
    }

    setIsLoading(true);

    try {
      // Update password using Supabase auth
      const { error: updateError } = await supabase.auth.updateUser({
        password: newPassword
      });

      if (updateError) {
        console.error('❌ Password update failed:', updateError.message);
        setAlert({ 
          visible: true, 
          type: 'error', 
          title: 'Error', 
          message: 'Failed to update password. Please try again.' 
        });
        setIsLoading(false);
        return;
      }

      // Clear AsyncStorage
      await AsyncStorage.removeItem('reset_email');

      console.log('✅ Password updated successfully!');
      setAlert({
        visible: true,
        type: 'success',
        title: 'Success',
        message: 'Your password has been reset successfully!',
      });

      // Redirect to login
      setTimeout(() => {
        router.replace('/(auth)/login');
      }, 2000);

    } catch (err) {
      console.error('❌ Unexpected error:', err);
      setAlert({ 
        visible: true, 
        type: 'error', 
        title: 'Error', 
        message: 'Failed to reset password. Please try again.' 
      });
    } finally {
      setIsLoading(false);
    }
  };

  if (isVerifying) {
    return (
      <SafeAreaView style={commonStyles.container}>
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color={colors.primary} />
          <Text style={styles.loadingText}>Loading...</Text>
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
            onPress={() => router.replace('/(auth)/login')}
          >
            <Icon name="arrow-back" size={24} color={colors.text} />
          </TouchableOpacity>
        </View>

        <View style={styles.content}>
          <Text style={styles.title}>Reset Password</Text>
          <Text style={styles.subtitle}>
            {isCodeVerified 
              ? 'Enter your new password' 
              : 'Enter the 6-digit code from your email'}
          </Text>

          <View style={styles.form}>
            {!isCodeVerified ? (
              <>
                {/* 6-digit code inputs */}
                <View style={styles.codeContainer}>
                  {digits.map((digit, index) => (
                    <TextInput
                      key={index}
                      ref={digitRefs[index]}
                      style={[commonStyles.input, styles.digitInput]}
                      value={digit}
                      onChangeText={(text) => handleDigitChange(text, index)}
                      onKeyPress={(e) => handleKeyPress(e, index)}
                      keyboardType="number-pad"
                      maxLength={1}
                      placeholder=""
                      placeholderTextColor={colors.textLight}
                      textAlign="center"
                    />
                  ))}
                </View>

                <TouchableOpacity
                  style={[buttonStyles.primary, styles.verifyButton]}
                  onPress={verifyCode}
                  disabled={isLoading}
                >
                  <Text style={styles.verifyButtonText}>
                    {isLoading ? 'Verifying...' : 'Verify Code'}
                  </Text>
                </TouchableOpacity>
              </>
            ) : (
              <>
                <View style={styles.passwordContainer}>
                  <TextInput
                    style={[commonStyles.input, styles.passwordInput]}
                    placeholder="New Password"
                    value={newPassword}
                    onChangeText={setNewPassword}
                    secureTextEntry={!showNewPassword}
                    placeholderTextColor={colors.textLight}
                  />
                  <TouchableOpacity 
                    style={styles.eyeButton}
                    onPress={() => setShowNewPassword(!showNewPassword)}
                  >
                    <Icon 
                      name={showNewPassword ? "eye-off" : "eye"} 
                      size={20} 
                      color={colors.textLight} 
                    />
                  </TouchableOpacity>
                </View>

                <View style={styles.passwordContainer}>
                  <TextInput
                    style={[commonStyles.input, styles.passwordInput]}
                    placeholder="Confirm New Password"
                    value={confirmPassword}
                    onChangeText={setConfirmPassword}
                    secureTextEntry={!showConfirmPassword}
                    placeholderTextColor={colors.textLight}
                  />
                  <TouchableOpacity 
                    style={styles.eyeButton}
                    onPress={() => setShowConfirmPassword(!showConfirmPassword)}
                  >
                    <Icon 
                      name={showConfirmPassword ? "eye-off" : "eye"} 
                      size={20} 
                      color={colors.textLight} 
                    />
                  </TouchableOpacity>
                </View>

                {/* Password Requirements Checker - Always visible */}
                <PasswordRequirementChecker password={newPassword} />

                <TouchableOpacity
                  style={[buttonStyles.primary, styles.resetButton]}
                  onPress={resetPassword}
                  disabled={isLoading}
                >
                  <Text style={styles.resetButtonText}>
                    {isLoading ? 'Resetting...' : 'Reset Password'}
                  </Text>
                </TouchableOpacity>
              </>
            )}
          </View>
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
  },
  form: {
    gap: 16,
  },
  codeContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    gap: 10,
  },
  digitInput: {
    flex: 1,
    textAlign: 'center',
    fontSize: 24,
    fontWeight: 'bold',
  },
  verifyButton: {
    marginTop: 8,
  },
  verifyButtonText: {
    color: colors.white,
    fontSize: 16,
    fontWeight: '600',
  },
  resetButton: {
    marginTop: 8,
  },
  resetButtonText: {
    color: colors.white,
    fontSize: 16,
    fontWeight: '600',
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  loadingText: {
    marginTop: 16,
    fontSize: 16,
    color: colors.textLight,
  },
  passwordContainer: {
    position: 'relative',
    marginBottom: 16,
  },
  passwordInput: {
    paddingRight: 40,
  },
  eyeButton: {
    position: 'absolute',
    right: 12,
    top: 16,
    zIndex: 1,
  },
  requirementsContainer: {
    backgroundColor: colors.backgroundAlt,
    borderRadius: 12,
    padding: 16,
    marginVertical: 16,
  },
  requirementsTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: colors.text,
    marginBottom: 12,
  },
  requirementRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 8,
  },
  requirementText: {
    fontSize: 14,
    marginLeft: 8,
  },
});