import React, { useState, useEffect } from 'react';
import { View, Text, TouchableOpacity, StyleSheet, ScrollView, Switch, ActivityIndicator, Platform } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import Icon from '../components/Icon';
import CustomAlert, { AlertType } from '../components/CustomAlert';
import { colors } from '../styles/commonStyles';
import BottomNavigation from '../components/BottomNavigation';
import AsyncStorage from '@react-native-async-storage/async-storage';
import Constants from 'expo-constants';
import { 
  enablePushNotifications, 
  disablePushNotifications, 
  areNotificationsEnabled,
  scheduleLocalNotification 
} from '../utils/notificationService';
import { supabase } from '../supabase';

interface SettingItem {
  id: string;
  title: string;
  subtitle?: string;
  icon: keyof typeof import('@expo/vector-icons').Ionicons.glyphMap;
  type: 'navigation' | 'toggle' | 'action';
  value?: boolean;
  onPress?: () => void;
  onToggle?: (value: boolean) => void;
}

export default function SettingsScreen() {
  const router = useRouter();
  
  const [pushNotifications, setPushNotifications] = useState(false);
  const [locationServices, setLocationServices] = useState(true);
  const [profileVisibility, setProfileVisibility] = useState(true);
  const [loading, setLoading] = useState(true);
  const [alert, setAlert] = useState<{ visible: boolean; type: AlertType; title: string; message: string; showCancelButton?: boolean; onConfirm?: () => void }>({ 
    visible: false, 
    type: 'error', 
    title: '', 
    message: '',
    showCancelButton: false 
  });

  // Check if user is admin - prevent admin access to user settings
  useEffect(() => {
    const checkUserRole = async () => {
      try {
        const userRole = await AsyncStorage.getItem('user_role');
        
        if (userRole === 'admin') {
          console.log('Admin detected, redirecting to admin settings');
          router.replace('/admin/settings');
          return;
        }
        
        // Verify with database if user has active session
        const { data: { user }, error: userError } = await supabase.auth.getUser();
        
        if (userError || !user) {
          console.log('No authenticated user, redirecting to splash');
          router.replace('/splash');
          return;
        }
        
        // Double-check user is not an admin in database
        const { data: adminData, error: adminError } = await supabase
          .from('admins')
          .select('*')
          .eq('admin_id', user.id)
          .single();
        
        if (!adminError && adminData) {
          console.log('Admin account detected, redirecting to admin settings');
          await AsyncStorage.setItem('user_role', 'admin');
          router.replace('/admin/settings');
          return;
        }
        
        // User is confirmed as regular user, continue loading settings
        loadSettings();
      } catch (error) {
        console.error('Error checking user role:', error);
        router.replace('/splash');
      }
    };
    
    checkUserRole();
  }, []);

  const loadSettings = async () => {
    try {
      // Load push notification setting
      const pushEnabled = await areNotificationsEnabled();
      setPushNotifications(pushEnabled);


      // Load location services setting
      const locationEnabled = await AsyncStorage.getItem('location_services_enabled');
      setLocationServices(locationEnabled !== 'false'); // Default to true

      // Load profile visibility setting
      const profileVisible = await AsyncStorage.getItem('profile_visibility_enabled');
      setProfileVisibility(profileVisible !== 'false'); // Default to true
    } catch (error) {
      console.error('Error loading settings:', error);
    } finally {
      setLoading(false);
    }
  };

  const handlePushNotificationToggle = async (value: boolean) => {
    // Check if running in Expo Go
    const isExpoGo = Constants.appOwnership === 'expo';
    
    if (isExpoGo && value) {
      setAlert({ 
        visible: true, 
        type: 'info', 
        title: 'Development Build Required', 
        message: 'Push notifications require a development build. They are not available in Expo Go. Run "npx expo run:android" or "npx expo run:ios" to create a development build.' 
      });
      return;
    }
    
    setPushNotifications(value);
    
    if (value) {
      // Enable push notifications
      const success = await enablePushNotifications();
      if (success) {
        setAlert({ 
          visible: true, 
          type: 'success', 
          title: 'Push Notifications Enabled', 
          message: 'You will now receive push notifications for matches and messages.' 
        });
        
        // Send a test notification
        setTimeout(() => {
          scheduleLocalNotification(
            'Notifications Enabled!',
            'You will now receive updates from BreedLink'
          );
        }, 1000);
      } else {
        setPushNotifications(false);
        setAlert({ 
          visible: true, 
          type: 'error', 
          title: 'Permission Denied', 
          message: 'Please enable notifications in your device settings.' 
        });
      }
    } else {
      // Disable push notifications
      await disablePushNotifications();
      setAlert({ 
        visible: true, 
        type: 'info', 
        title: 'Push Notifications Disabled', 
        message: 'You will no longer receive push notifications.' 
      });
    }
  };


  const handleLocationServicesToggle = async (value: boolean) => {
    setLocationServices(value);
    await AsyncStorage.setItem('location_services_enabled', value.toString());
  };

  const handleProfileVisibilityToggle = async (value: boolean) => {
    setProfileVisibility(value);
    await AsyncStorage.setItem('profile_visibility_enabled', value.toString());
  };

  console.log('SettingsScreen rendered');

  const handleAccountPress = () => {
    console.log('Account settings pressed');
    router.push('/edit-account');
  };

  const handleMyCatsPress = () => {
    console.log('My Cats pressed');
    router.push('/cat-management');
  };

  const handleCompletedCatsPress = () => {
  console.log('Completed Matches pressed');
  router.push('/cat-complete-list');
};

  const handlePrivacyPress = () => {
    console.log('Privacy settings pressed');
    setAlert({ visible: true, type: 'info', title: 'Privacy Settings', message: 'Privacy settings would open here' });
  };

  const handleCollaborationPress = () => {
  console.log('Collaboration pressed');
  router.push('/collaboration');
};


  const handleHelpPress = () => {
    console.log('Help pressed');
    router.push('/support');
  };

  const handleLogoutPress = () => {
    console.log('Logout pressed');
    setAlert({
      visible: true,
      type: 'warning',
      title: 'Logout',
      message: 'Are you sure you want to logout?',
      showCancelButton: true,
      onConfirm: async () => {
        setAlert({ ...alert, visible: false });
        
        // Sign out from Supabase
        const { error } = await supabase.auth.signOut();
        if (error) {
          console.error('Error signing out:', error.message);
        }
        
        // Clear all stored data
        await AsyncStorage.removeItem('user_role');
        await AsyncStorage.removeItem('profile_complete');
        await AsyncStorage.removeItem('profile_incomplete');
        
        // Redirect to splash screen or landing page if on web
        if (Platform.OS === 'web') {
          window.location.href = 'http://localhost:3000';
        } else {
          router.replace('/splash');
        }
      }
    });
  };

  const accountSettings: SettingItem[] = [
    {
      id: 'account',
      title: 'Account Information',
      subtitle: 'Edit your profile and account details',
      icon: 'person-circle',
      type: 'navigation',
      onPress: handleAccountPress,
    },
    {
      id: 'my-cats',
      title: 'My Cats',
      subtitle: 'Manage your cat profiles',
      icon: 'paw',
      type: 'navigation',
      onPress: handleMyCatsPress,
    },
    {
      id: 'completed-cats',
      title: 'Completed Matches',
      subtitle: 'View your past successful breeding matches',
      icon: 'checkmark-done-circle',
      type: 'navigation',
      onPress: handleCompletedCatsPress,
    },
  ];

  const notificationSettings: SettingItem[] = [
    {
      id: 'push-notifications',
      title: 'Push Notifications',
      subtitle: 'Receive notifications about matches and messages',
      icon: 'notifications',
      type: 'toggle',
      value: pushNotifications,
      onToggle: handlePushNotificationToggle,
    },
  ];


  const supportSettings: SettingItem[] = [
    {
      id: 'collaboration',
      title: 'Collaboration',
      subtitle: 'View our industry collaborators',
      icon: 'business',
      type: 'navigation',
      onPress: handleCollaborationPress,
    },
    {
      id: 'help',
      title: 'Help & Support',
      subtitle: 'Get help and contact support',
      icon: 'help-circle',
      type: 'navigation',
      onPress: handleHelpPress,
    },
    {
      id: 'logout',
      title: 'Logout',
      subtitle: 'Sign out of your account',
      icon: 'log-out',
      type: 'action',
      onPress: handleLogoutPress,
    },
  ];

  const renderSettingItem = (item: SettingItem) => {
    return (
      <TouchableOpacity
        key={item.id}
        style={styles.settingItem}
        onPress={item.onPress}
        disabled={item.type === 'toggle'}
      >
        <View style={styles.settingIcon}>
          <Icon name={item.icon} size={24} color={colors.primary} />
        </View>
        
        <View style={styles.settingContent}>
          <Text style={styles.settingTitle}>{item.title}</Text>
          {item.subtitle && (
            <Text style={styles.settingSubtitle}>{item.subtitle}</Text>
          )}
        </View>
        
        <View style={styles.settingAction}>
          {item.type === 'toggle' && item.onToggle && (
            <Switch
              value={item.value}
              onValueChange={item.onToggle}
              trackColor={{ false: colors.border, true: colors.primary }}
              thumbColor={colors.white}
            />
          )}
          {item.type === 'navigation' && (
            <Icon name="chevron-forward" size={20} color={colors.textLight} />
          )}
          {item.type === 'action' && item.id === 'logout' && (
            <Icon name="chevron-forward" size={20} color={colors.error} />
          )}
        </View>
      </TouchableOpacity>
    );
  };

  const renderSection = (title: string, items: SettingItem[]) => {
    return (
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>{title}</Text>
        <View style={styles.sectionContent}>
          {items.map(renderSettingItem)}
        </View>
      </View>
    );
  };

  return (
    <SafeAreaView style={styles.container}>
      <CustomAlert
        visible={alert.visible}
        type={alert.type}
        title={alert.title}
        message={alert.message}
        showCancelButton={alert.showCancelButton}
        confirmText="OK"
        onConfirm={alert.onConfirm || (() => setAlert({ ...alert, visible: false }))}
        onCancel={() => setAlert({ ...alert, visible: false })}
      />
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity style={styles.backButton} onPress={() => router.back()}>
          <Icon name="arrow-back" size={24} color={colors.text} />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Settings</Text>
        <View style={styles.headerSpacer} />
      </View>

      {loading ? (
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color={colors.primary} />
        </View>
      ) : (
        <ScrollView style={styles.scrollView} showsVerticalScrollIndicator={false}>
          {renderSection('Account', accountSettings)}
          {renderSection('Notifications', notificationSettings)}
          {renderSection('Support', supportSettings)}
          
          {/* App Version */}
          <View style={styles.versionContainer}>
            <Text style={styles.versionText}>BreedLink v1.0.0</Text>
          </View>
        </ScrollView>
      )}

      <BottomNavigation />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingVertical: 16,
    backgroundColor: colors.white,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
  },
  backButton: {
    padding: 8,
    marginRight: 8,
  },
  headerTitle: {
    flex: 1,
    fontSize: 20,
    fontWeight: '600',
    color: colors.text,
    textAlign: 'center',
  },
  headerSpacer: {
    width: 40,
  },
  scrollView: {
    flex: 1,
    backgroundColor: colors.backgroundAlt,
  },
  section: {
    marginTop: 24,
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: colors.text,
    marginBottom: 12,
    marginHorizontal: 20,
  },
  sectionContent: {
    backgroundColor: colors.white,
    marginHorizontal: 20,
    borderRadius: 12,
    overflow: 'hidden',
  },
  settingItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 16,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
  },
  settingIcon: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: colors.backgroundAlt,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 16,
  },
  settingContent: {
    flex: 1,
  },
  settingTitle: {
    fontSize: 16,
    fontWeight: '500',
    color: colors.text,
    marginBottom: 2,
  },
  settingSubtitle: {
    fontSize: 14,
    color: colors.textLight,
    lineHeight: 18,
  },
  settingAction: {
    alignItems: 'center',
    justifyContent: 'center',
  },
  versionContainer: {
    alignItems: 'center',
    paddingVertical: 32,
  },
  versionText: {
    fontSize: 14,
    color: colors.textLight,
  },
});