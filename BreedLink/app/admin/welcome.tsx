import React from 'react';
import { Text, View, TouchableOpacity, StyleSheet, ImageBackground } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { SafeAreaView } from 'react-native-safe-area-context';
import { router } from 'expo-router';
import { colors, buttonStyles } from '../styles/commonStyles';

export default function WelcomeScreen() {
  const handleLogin = () => {
    console.log('Login pressed');
    router.push('/login');
  };

  return (
    <ImageBackground
      source={{ uri: 'https://images.unsplash.com/photo-1514888286974-6c03e2ca1dba?w=1200&h=1600&fit=crop&crop=center' }}
      style={styles.backgroundImage}
      resizeMode="cover"
    >
      <LinearGradient
        colors={['rgba(0,0,0,0.3)', 'rgba(0,0,0,0.7)']}
        style={styles.overlay}
      >
        <SafeAreaView style={styles.container}>
          <View style={styles.content}>
            {/* App Branding */}
            <View style={styles.brandingSection}>
              <Text style={styles.logo}>🐱</Text>
              <Text style={styles.appName}>BreedLink Admin</Text>
              <Text style={styles.tagline}>Connect with cat lovers worldwide</Text>
            </View>

            {/* Bottom Action Section */}
            <View style={styles.actionSection}>
              <TouchableOpacity 
                style={[buttonStyles.outline, styles.loginButton]}
                onPress={handleLogin}
              >
                <Text style={styles.loginText}>Log In</Text>
              </TouchableOpacity>

              <Text style={styles.footerText}>
                By continuing, you agree to our Terms of Service and Privacy Policy
              </Text>
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
  container: {
    flex: 1,
  },
  content: {
    flex: 1,
    justifyContent: 'space-between',
    paddingHorizontal: 24,
    paddingTop: 60,
    paddingBottom: 40,
  },
  brandingSection: {
    alignItems: 'center',
    marginTop: 80,
  },
  logo: {
    fontSize: 80,
    marginBottom: 16,
  },
  appName: {
    fontSize: 40,
    fontWeight: '800',
    color: '#FFFFFF',
    textAlign: 'center',
    marginBottom: 12,
    textShadowColor: 'rgba(0, 0, 0, 0.5)',
    textShadowOffset: { width: 0, height: 2 },
    textShadowRadius: 4,
  },
  tagline: {
    fontSize: 18,
    fontWeight: '400',
    color: '#FFFFFF',
    textAlign: 'center',
    opacity: 0.9,
    textShadowColor: 'rgba(0, 0, 0, 0.5)',
    textShadowOffset: { width: 0, height: 1 },
    textShadowRadius: 2,
  },
  actionSection: {
    gap: 16,
  },
  loginButton: {
    backgroundColor: '#FF8C00',
    borderColor: '#FF8C00',
    borderWidth: 2,
    paddingVertical: 18,
    borderRadius: 14,
    backdropFilter: 'blur(10px)',
  },
  loginText: {
    color: '#FFFFFF',
    fontSize: 18,
    fontWeight: '600',
    textAlign: 'center',
  },
  footerText: {
    color: 'rgba(255, 255, 255, 0.7)',
    fontSize: 12,
    textAlign: 'center',
    marginTop: 8,
    lineHeight: 18,
  },
});