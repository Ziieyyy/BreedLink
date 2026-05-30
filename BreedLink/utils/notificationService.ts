import * as Notifications from 'expo-notifications';
import * as Device from 'expo-device';
import { Platform } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { supabase } from '../supabase';
import Constants from 'expo-constants';

const PUSH_TOKEN_KEY = 'push_token';
const NOTIFICATION_ENABLED_KEY = 'notifications_enabled';

// Check if running in Expo Go
const isExpoGo = Constants.appOwnership === 'expo';

// Configure how notifications should be handled when the app is in the foreground
// Only set handler if not in Expo Go
if (!isExpoGo) {
  Notifications.setNotificationHandler({
    handleNotification: async () => ({
      shouldShowAlert: true,
      shouldPlaySound: true,
      shouldSetBadge: true,
      shouldShowBanner: true,
      shouldShowList: true,
    }),
  });
}

/**
 * Register for push notifications and get the token
 */
export async function registerForPushNotificationsAsync(): Promise<string | null> {
  let token: string | null = null;

  // Don't register for push notifications in Expo Go
  if (isExpoGo) {
    console.log('Push notifications are not available in Expo Go. Please use a development build.');
    return 'expo-go-mode';
  }

  if (Platform.OS === 'android') {
    await Notifications.setNotificationChannelAsync('default', {
      name: 'default',
      importance: Notifications.AndroidImportance.MAX,
      vibrationPattern: [0, 250, 250, 250],
      lightColor: '#FF231F7C',
    });
  }

  if (Device.isDevice) {
    const { status: existingStatus } = await Notifications.getPermissionsAsync();
    let finalStatus = existingStatus;
    
    if (existingStatus !== 'granted') {
      const { status } = await Notifications.requestPermissionsAsync();
      finalStatus = status;
    }
    
    if (finalStatus !== 'granted') {
      console.log('Failed to get push token for push notification!');
      return null;
    }
    
    try {
      // Get push token (works for local notifications without projectId)
      const tokenData = await Notifications.getExpoPushTokenAsync();
      token = tokenData.data;
      
      // Store token locally
      await AsyncStorage.setItem(PUSH_TOKEN_KEY, token);
      
      // Store token in database
      await savePushTokenToDatabase(token);
    } catch (error) {
      console.error('Error getting push token:', error);
      // Even if token fails, we can still use local notifications
      token = 'local-only';
      await AsyncStorage.setItem(PUSH_TOKEN_KEY, token);
    }
  } else {
    console.log('Must use physical device for Push Notifications');
  }

  return token;
}

/**
 * Save push token to database for the current user
 */
async function savePushTokenToDatabase(token: string) {
  try {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return;

    // Update owner table with push token
    const { error } = await supabase
      .from('owner')
      .update({ push_token: token })
      .eq('owner_id', user.id);

    if (error) {
      console.error('Error saving push token to database:', error);
    }
  } catch (error) {
    console.error('Error in savePushTokenToDatabase:', error);
  }
}

/**
 * Enable push notifications
 */
export async function enablePushNotifications(): Promise<boolean> {
  try {
    const token = await registerForPushNotificationsAsync();
    if (token) {
      await AsyncStorage.setItem(NOTIFICATION_ENABLED_KEY, 'true');
      return true;
    }
    return false;
  } catch (error) {
    console.error('Error enabling push notifications:', error);
    return false;
  }
}

/**
 * Disable push notifications
 */
export async function disablePushNotifications(): Promise<void> {
  try {
    await AsyncStorage.setItem(NOTIFICATION_ENABLED_KEY, 'false');
    
    // Remove token from database
    const { data: { user } } = await supabase.auth.getUser();
    if (user) {
      await supabase
        .from('owner')
        .update({ push_token: null })
        .eq('owner_id', user.id);
    }
  } catch (error) {
    console.error('Error disabling push notifications:', error);
  }
}

/**
 * Check if notifications are enabled
 */
export async function areNotificationsEnabled(): Promise<boolean> {
  try {
    const enabled = await AsyncStorage.getItem(NOTIFICATION_ENABLED_KEY);
    return enabled === 'true';
  } catch (error) {
    console.error('Error checking notification status:', error);
    return false;
  }
}

/**
 * Send a local notification (for testing)
 */
export async function scheduleLocalNotification(title: string, body: string, data?: any) {
  const enabled = await areNotificationsEnabled();
  if (!enabled) return;
  
  // Don't send notifications in Expo Go
  if (isExpoGo) {
    console.log('Local notifications are not available in Expo Go. Please use a development build.');
    return;
  }
  
  await Notifications.scheduleNotificationAsync({
    content: {
      title,
      body,
      data,
      sound: true,
    },
    trigger: null, // Send immediately
  });
}

/**
 * Cancel all scheduled notifications
 */
export async function cancelAllNotifications() {
  await Notifications.cancelAllScheduledNotificationsAsync();
}

/**
 * Get notification permission status
 */
export async function getNotificationPermissionStatus(): Promise<'granted' | 'denied' | 'undetermined'> {
  const { status } = await Notifications.getPermissionsAsync();
  return status;
}
