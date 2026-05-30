import React, { useState } from 'react';
import { View, Text, TextInput, TouchableOpacity, StyleSheet } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
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

export default function SignupScreen() {
  const router = useRouter();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [alert, setAlert] = useState<{ visible: boolean; type: AlertType; title: string; message: string; onConfirm?: () => void }>({ 
    visible: false, 
    type: 'error', 
    title: '', 
    message: '' 
  });
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);

  const handleSignup = async () => {
    if (!email || !password || !confirmPassword) {
      setAlert({ visible: true, type: 'error', title: 'Error', message: 'Please fill in all fields' });
      return;
    }

    // Validate password
    const passwordValidation = validatePassword(password);
    if (!passwordValidation.isValid) {
      setAlert({ visible: true, type: 'error', title: 'Password Error', message: passwordValidation.message });
      return;
    }

    if (password !== confirmPassword) {
      setAlert({ visible: true, type: 'error', title: 'Error', message: 'Passwords do not match' });
      return;
    }

    setIsLoading(true);
    
    // Signup with email confirmation enabled
    const { data: signUpData, error: signUpError } = await supabase.auth.signUp({
      email,
      password,
      options: {
        emailRedirectTo: 'natively://onboarding' // Custom scheme for mobile app redirect
      }
    });

    if (signUpError) {
      setIsLoading(false);
      setAlert({ visible: true, type: 'error', title: 'Signup Failed', message: signUpError.message });
      return;
    }

    const user = signUpData.user;

    // Check if email confirmation is required
    if (signUpData.user?.identities?.length === 0) {
      // This means the email is already registered
      setIsLoading(false);
      setAlert({ 
        visible: true, 
        type: 'warning', 
        title: 'Account Exists', 
        message: 'An account with this email already exists. Please check your email for confirmation or try logging in.' 
      });
      return;
    }

    // Insert user into owner table (will be updated with full details later in create-account)
    if (user) {
      const { error: insertError } = await supabase.from('owner').insert([
        {
          owner_id: user.id,
          email: user.email,
          name: null,
          phone: null,
        },
      ]);

      if (insertError) {
        console.warn('Owner record insertion warning:', insertError.message);
        // Don't fail the signup process if owner record insertion fails
        // The user can update their profile later
      }
    }

    console.log('Signup successful:', user);
    setIsLoading(false);
    
    // Show confirmation message and redirect to email confirmation screen
    setAlert({ 
      visible: true, 
      type: 'success', 
      title: 'Confirm Your Email', 
      message: `We have sent a confirmation email to ${email}. Please check your inbox and click the confirmation link to complete your registration.`,
      onConfirm: () => {
        setAlert({ ...alert, visible: false });
        router.replace('/(auth)/login');
      }
    });
  };

  const handleLogin = () => {
    console.log('Navigate to login');
    router.push('/(auth)/login');
  };

  return (
    <SafeAreaView style={commonStyles.container}>
      <CustomAlert
        visible={alert.visible}
        type={alert.type}
        title={alert.title}
        message={alert.message}
        onConfirm={alert.onConfirm || (() => setAlert({ ...alert, visible: false }))}
      />
      <View style={styles.container}>
        <View style={styles.header}>
          <TouchableOpacity
            style={styles.backButton}
            onPress={() => router.back()}
          >
            <Icon name="arrow-back" size={24} color={colors.text} />
          </TouchableOpacity>
        </View>

        <View style={styles.content}>
          <Text style={styles.title}>Create Account</Text>
          <Text style={styles.subtitle}>Join the BreedLink community 🐾</Text>

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

            <View style={styles.passwordContainer}>
              <TextInput
                style={[commonStyles.input, styles.passwordInput]}
                placeholder="Password"
                value={password}
                onChangeText={setPassword}
                secureTextEntry={!showPassword}
                placeholderTextColor={colors.textLight}
              />
              <TouchableOpacity 
                style={styles.eyeButton}
                onPress={() => setShowPassword(!showPassword)}
              >
                <Icon 
                  name={showPassword ? "eye-off" : "eye"} 
                  size={20} 
                  color={colors.textLight} 
                />
              </TouchableOpacity>
            </View>

            <View style={styles.passwordContainer}>
              <TextInput
                style={[commonStyles.input, styles.passwordInput]}
                placeholder="Confirm Password"
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
            <PasswordRequirementChecker password={password} />

            <TouchableOpacity
              style={[buttonStyles.primary, styles.signupButton]}
              onPress={handleSignup}
              disabled={isLoading}
            >
              <Text style={styles.signupButtonText}>
                {isLoading ? 'Creating Account...' : 'Create Account'}
              </Text>
            </TouchableOpacity>
          </View>
        </View>

        <View style={styles.footer}>
          <Text style={styles.footerText}>
            Already have an account?{' '}
            <Text style={styles.loginLink} onPress={handleLogin}>
              Log In
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
  },
  form: {
    gap: 0,
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
  signupButton: {
    marginTop: 8,
  },
  signupButtonText: {
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