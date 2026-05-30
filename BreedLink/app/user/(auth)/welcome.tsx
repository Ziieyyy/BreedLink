
import React from 'react';
import { View, Text, TouchableOpacity, ImageBackground, StyleSheet } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import { commonStyles, colors, buttonStyles } from '../../styles/commonStyles';
import { LinearGradient } from 'expo-linear-gradient';

export default function WelcomeScreen() {
  const router = useRouter();

  const handleCreateAccount = () => {
    console.log('Navigate to create account');
    router.push('/(auth)/signup');
  };

  const handleLogin = () => {
    console.log('Navigate to login');
    router.push('/(auth)/login');
  };

  return (
    <ImageBackground
      source={{ uri: 'https://images.unsplash.com/photo-1514888286974-6c03e2ca1dba?ixlib=rb-4.0.3&auto=format&fit=crop&w=1000&q=80' }}
      style={styles.backgroundImage}
      blurRadius={3}
    >
      <LinearGradient
        colors={['rgba(0,0,0,0.4)', 'rgba(0,0,0,0.6)']}
        style={styles.overlay}
      >
        <SafeAreaView style={commonStyles.container}>
          <View style={styles.content}>
            <View style={styles.logoSection}>
              <Text style={styles.logo}>🐱</Text>
              <Text style={styles.appName}>BreedLink</Text>
              <Text style={styles.tagline}>Connect cats with trusted breeders</Text>
            </View>

            <View style={styles.buttonSection}>
              <TouchableOpacity
                style={[buttonStyles.primary, styles.primaryButton]}
                onPress={handleCreateAccount}
              >
                <Text style={styles.primaryButtonText}>Create Account</Text>
              </TouchableOpacity>

              <TouchableOpacity
                style={[buttonStyles.secondary, styles.secondaryButton]}
                onPress={handleLogin}
              >
                <Text style={styles.secondaryButtonText}>Log In</Text>
              </TouchableOpacity>
            </View>
          </View>
        </SafeAreaView>
      </LinearGradient>
    </ImageBackground>
  );
}

const styles = StyleSheet.create({
  backgroundImage: {
    flex: 1,
    width: '100%',
    height: '100%',
  },
  overlay: {
    flex: 1,
  },
  content: {
    flex: 1,
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 32,
    paddingVertical: 60,
  },
  logoSection: {
    alignItems: 'center',
    marginTop: 80,
  },
  logo: {
    fontSize: 80,
    marginBottom: 16,
  },
  appName: {
    fontSize: 42,
    fontWeight: '700',
    color: colors.white,
    marginBottom: 8,
    textAlign: 'center',
  },
  tagline: {
    fontSize: 18,
    color: colors.white,
    textAlign: 'center',
    opacity: 0.9,
  },
  buttonSection: {
    width: '100%',
    gap: 16,
  },
  primaryButton: {
    width: '100%',
  },
  secondaryButton: {
    width: '100%',
    backgroundColor: colors.secondary,
  },
  primaryButtonText: {
    color: colors.white,
    fontSize: 18,
    fontWeight: '600',
  },
  secondaryButtonText: {
    color: colors.text,
    fontSize: 18,
    fontWeight: '600',
  },
});
