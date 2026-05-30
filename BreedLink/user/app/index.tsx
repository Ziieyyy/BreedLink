
import { useEffect, useState } from 'react';
import { Platform, ActivityIndicator, View } from 'react-native';
import { Redirect } from 'expo-router';
import { supabase } from '../supabase';

export default function Index() {
  const [loading, setLoading] = useState(Platform.OS === 'web');

  useEffect(() => {
    if (Platform.OS === 'web') {
      const checkSessionAndRedirect = async () => {
        try {
          const { data: { session } } = await supabase.auth.getSession();
          if (!session) {
            window.location.href = 'http://localhost:3000';
          } else {
            setLoading(false);
          }
        } catch (error) {
          console.error('Error checking session on index:', error);
          window.location.href = 'http://localhost:3000';
        }
      };
      checkSessionAndRedirect();
    }
  }, []);

  if (loading) {
    return (
      <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: '#FFF' }}>
        <ActivityIndicator size="large" color="#FF7A00" />
      </View>
    );
  }

  return <Redirect href="/splash" />;
}
