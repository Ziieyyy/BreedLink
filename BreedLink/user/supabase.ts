import AsyncStorage from '@react-native-async-storage/async-storage';
import { createClient } from '@supabase/supabase-js';
import "react-native-url-polyfill/auto";

const supabaseUrl = "https://ryduslvhbjiwzmweriln.supabase.co";
const supabaseAnonKey = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InJ5ZHVzbHZoYmppd3ptd2VyaWxuIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTYyNzEyNTAsImV4cCI6MjA3MTg0NzI1MH0.W-yyRwiJjfaF4ewJE4AM29IoWBe2A3aCGkgkyvyUqSY";

export const supabase = createClient(supabaseUrl, supabaseAnonKey, {
  auth: {
    storage: AsyncStorage,
    autoRefreshToken: true,
    persistSession: true,
    detectSessionInUrl: false,
  },
})