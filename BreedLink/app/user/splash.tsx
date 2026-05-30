import React, { useEffect } from 'react';
import { View, Text, TouchableOpacity, ImageBackground, StyleSheet } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import { colors, buttonStyles, commonStyles } from '../styles/commonStyles';
import { LinearGradient } from 'expo-linear-gradient';
import { supabase } from '../supabase';
import AsyncStorage from '@react-native-async-storage/async-storage';

export default function SplashScreen() {
  const router = useRouter();

  useEffect(() => {
    const checkExistingSession = async () => {
      // Check if user has an active session
      const { data: { session } } = await supabase.auth.getSession();
      
      if (session) {
        // Check if profile is complete
        const profileComplete = await AsyncStorage.getItem('profile_complete');
        
        if (profileComplete === 'true') {
          // Redirect to home if profile is complete
          router.replace('/home');
        } else {
          // Redirect to create account if profile is incomplete
          router.replace('/create-account');
        }
        return;
      }
      
      // If no session, stay on splash screen
    };
    
    checkExistingSession();
  }, []);

  return (
    <ImageBackground
      source={{ uri: 'https://images.unsplash.com/photo-1514888286974-6c03e2ca1dba?ixlib=rb-4.0.3&auto=format&fit=crop&w=1000&q=80' }}
      style={styles.backgroundImage}
    >
      <LinearGradient
        colors={['rgba(0,0,0,0.6)', 'rgba(0,0,0,0.4)']}
        style={styles.overlay}
      >
        <SafeAreaView style={styles.container}>
          <View style={styles.content}>
            <View style={styles.logoSection}>
              <Text style={styles.logo}>🐱</Text>
              <Text style={styles.appName}>BreedLink</Text>
              <Text style={styles.tagline}>Connect cats with trusted breeders</Text>
            </View>

            <View style={styles.buttonContainer}>
              <TouchableOpacity
                style={[buttonStyles.primary, styles.button]}
                onPress={() => router.push('/(auth)/signup')}
              >
                <Text style={buttonStyles.primaryText}>Create Account</Text>
              </TouchableOpacity>

              <TouchableOpacity
                style={[buttonStyles.secondary, styles.button]}
                onPress={() => router.push('/(auth)/login')}
              >
                <Text style={buttonStyles.secondaryText}>Log In</Text>
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
    resizeMode: 'cover',
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
    alignItems: 'center',
    paddingHorizontal: 32,
    paddingVertical: 60,
  },
  logoSection: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  logo: {
    fontSize: 80,
    marginBottom: 16,
  },
  appName: {
    fontSize: 36,
    fontWeight: '700',
    color: colors.white,
    marginBottom: 8,
    textAlign: 'center',
  },
  tagline: {
    fontSize: 16,
    color: colors.white,
    textAlign: 'center',
    opacity: 0.9,
  },
  buttonContainer: {
    width: '100%',
    gap: 16,
  },
  button: {
    width: '100%',
  },
});