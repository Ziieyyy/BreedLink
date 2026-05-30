
import React, { useState } from 'react';
import { Text, View, TouchableOpacity, TextInput, StyleSheet, ScrollView, Alert } from 'react-native';
import { commonStyles, colors, buttonStyles } from '../styles/commonStyles';
import { SafeAreaView } from 'react-native-safe-area-context';
import { router } from 'expo-router';
import Icon from '../components/Icon';
import { supabase } from 'supabase';
import AsyncStorage from '@react-native-async-storage/async-storage';

export default function LoginScreen() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');

const handleLogin = async () => {
  try {
    const { data, error } = await supabase.auth.signInWithPassword({
      email,
      password,
    });

    if (error) {
      Alert.alert('Login Failed', error.message);
      return;
    }

    const user = data.user;

    const { data: adminData, error: adminError } = await supabase
      .from('admins')
      .select('*')
      .eq('admin_id', user.id)
      .single();

    if (adminError) {
      Alert.alert('Error', adminError.message);
      return;
    }

    if (adminData) {
      Alert.alert('Success', `Welcome back ${adminData.name || ''}!`);
      router.push('/dashboard');
    } else {
      Alert.alert('Unauthorized', 'You are not registered as an admin.');
    }
  } catch (err) {
    Alert.alert('Unexpected Error', 'Please try again later.');
  }
};


  const handleForgotPassword = () => {
    console.log('Forgot password pressed');
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
            <Text style={styles.title}>Welcome back! 🐾</Text>
            <Text style={styles.subtitle}>Your cats missed you 🐾</Text>
          </View>

          <View style={styles.formSection}>
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


            <TouchableOpacity 
              style={[buttonStyles.primary, styles.loginButton]}
              onPress={handleLogin}
            >
              <Text style={styles.loginButtonText}>Log In</Text>
            </TouchableOpacity>
          </View>
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
  },
  forgotPassword: {
    alignSelf: 'flex-end',
    marginBottom: 24,
  },
  forgotPasswordText: {
    color: colors.primary,
    fontSize: 14,
    fontWeight: '500',
  },
  loginButton: {
    width: '100%',
  },
  loginButtonText: {
    color: colors.background,
    fontSize: 16,
    fontWeight: '600',
  },
});
