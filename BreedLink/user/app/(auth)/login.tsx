import React, { useState } from 'react';
import { View, Text, TextInput, TouchableOpacity, StyleSheet } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import { commonStyles, colors, buttonStyles } from '../../styles/commonStyles';
import Icon from '../../components/Icon';
import CustomAlert, { AlertType } from '../../components/CustomAlert';
import { supabase } from '../../supabase';
import AsyncStorage from '@react-native-async-storage/async-storage';

export default function LoginScreen() {
  const router = useRouter();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [alert, setAlert] = useState<{ visible: boolean; type: AlertType; title: string; message: string }>({ 
    visible: false, 
    type: 'error', 
    title: '', 
    message: '' 
  });

  const handleLogin = async () => {
    if (!email || !password) {
      setAlert({ visible: true, type: 'error', title: 'Error', message: 'Please fill in all fields' });
      return;
    }

    setIsLoading(true);
    console.log('Login attempt:', { email });
    
    const { data, error } = await supabase.auth.signInWithPassword({
      email,
      password,
    });

    if (error) {
      setIsLoading(false);
      setAlert({ visible: true, type: 'error', title: 'Login Failed', message: error.message });
      return;
    }

    console.log('Login successful', data.user);
    
    // First, check if user is an admin
    const { data: adminData, error: adminError } = await supabase
      .from('admins')
      .select('*')
      .eq('admin_id', data.user.id)
      .single();

    if (!adminError && adminData) {
      // User is an admin - redirect to admin dashboard
      console.log('Admin login detected, redirecting to admin dashboard');
      await AsyncStorage.setItem('user_role', 'admin');
      await AsyncStorage.setItem('admin_data', JSON.stringify(adminData));
      setIsLoading(false);
      router.replace('/admin/dashboard');
      return;
    }

    // Not an admin, check if user has completed profile setup
    const { data: ownerData, error: ownerError } = await supabase
      .from('owner')
      .select('name, phone')
      .eq('owner_id', data.user.id)
      .single();

    setIsLoading(false);

    // If profile is incomplete (no name or phone), redirect to create-account
    if (ownerError || !ownerData || !ownerData.name || !ownerData.phone) {
      console.log('Profile incomplete, redirecting to create-account');
      await AsyncStorage.setItem('user_role', 'user');
      await AsyncStorage.setItem('profile_incomplete', 'true');
      router.replace('/create-account');
    } else {
      // Profile is complete, go to home
      console.log('Profile complete, redirecting to home');
      await AsyncStorage.setItem('user_role', 'user');
      await AsyncStorage.setItem('profile_complete', 'true');
      router.replace('/home');
    }  
  };

  const handleForgotPassword = () => {
    console.log('Navigate to forgot password');
    router.push('/(auth)/forgot-password');
  };

  const handleSignUp = () => {
    console.log('Navigate to sign up');
    router.push('/(auth)/signup');
  };

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
            onPress={() => router.back()}
          >
            <Icon name="arrow-back" size={24} color={colors.text} />
          </TouchableOpacity>
        </View>

        <View style={styles.content}>
          <Text style={styles.title}>Welcome back!</Text>
          <Text style={styles.subtitle}>Your cats missed you 🐾</Text>

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

            <TouchableOpacity onPress={handleForgotPassword}>
              <Text style={styles.forgotPassword}>Forgot Password?</Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={[buttonStyles.primary, styles.loginButton]}
              onPress={handleLogin}
              disabled={isLoading}
            >
              <Text style={styles.loginButtonText}>
                {isLoading ? 'Logging in...' : 'Log In'}
              </Text>
            </TouchableOpacity>
          </View>
        </View>

        <View style={styles.footer}>
          <Text style={styles.footerText}>
            Don&apos;t have an account?{' '}
            <Text style={styles.signUpLink} onPress={handleSignUp}>
              Sign Up
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
  forgotPassword: {
    fontSize: 14,
    color: colors.primary,
    textAlign: 'right',
    marginBottom: 24,
    fontWeight: '500',
  },
  loginButton: {
    marginTop: 8,
  },
  loginButtonText: {
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
  signUpLink: {
    color: colors.primary,
    fontWeight: '600',
  },
});