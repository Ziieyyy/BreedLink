import React, { useState } from 'react';
import { 
  View, Text, TextInput, TouchableOpacity, StyleSheet, ScrollView, KeyboardAvoidingView, Platform, Alert
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import { colors, buttonStyles } from '../../styles/adminStyles';
import Icon from '../../components/Icon';
import { supabase } from '../../supabase';

export default function InsertOwnerScreen() {
  const router = useRouter();
  const [accountData, setAccountData] = useState({
    name: '',
    email: '',
    phone: '',
    password: '',
  });

  const handleSave = async () => {
    if (!accountData.email || !accountData.password) {
      Alert.alert('Error', 'Email and password are required');
      return;
    }

    try {
      // 1️⃣ Sign up user in Supabase Auth
      const { data: authData, error: authError } = await supabase.auth.signUp({
        email: accountData.email,
        password: accountData.password,
      });

      if (authError) throw authError;
      if (!authData.user) throw new Error('Failed to create user');

      const owner_id = authData.user.id;

      // 2️⃣ Insert into owner table
      const { error: ownerError } = await supabase.from('owner').insert([
        {
          owner_id,
          name: accountData.name,
          email: accountData.email,
          phone: accountData.phone,
        },
      ]);

      if (ownerError) throw ownerError;

      Alert.alert('Success', 'Owner added successfully!', [
        { text: 'OK', onPress: () => router.back() },
      ]);
    } catch (err: any) {
      Alert.alert('Error', err.message || 'Failed to add owner');
    }
  };

  const handleCancel = () => {
    router.back();
  };

  return (
    <SafeAreaView style={styles.container}>
      <KeyboardAvoidingView
        style={{ flex: 1 }}
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
      >
        {/* Header */}
        <View style={styles.header}>
          <TouchableOpacity onPress={handleCancel}>
            <Icon name="arrow-back" size={24} color={colors.text} />
          </TouchableOpacity>
          <Text style={styles.headerTitle}>Add New Owner</Text>
          <TouchableOpacity onPress={handleSave}>
            <Text style={styles.saveText}>Save</Text>
          </TouchableOpacity>
        </View>

        {/* Form */}
        <ScrollView style={styles.scrollView} showsVerticalScrollIndicator={false}>
          <View style={styles.contentSection}>
            {/* Name */}
            <View style={styles.inputGroup}>
              <Text style={styles.inputLabel}>Full Name</Text>
              <TextInput
                style={styles.textInput}
                placeholder="Full Name"
                value={accountData.name}
                onChangeText={(text) => setAccountData(prev => ({ ...prev, name: text }))}
              />
            </View>

            {/* Email */}
            <View style={styles.inputGroup}>
              <Text style={styles.inputLabel}>Email</Text>
              <TextInput
                style={styles.textInput}
                placeholder="Email"
                value={accountData.email}
                keyboardType="email-address"
                autoCapitalize="none"
                onChangeText={(text) => setAccountData(prev => ({ ...prev, email: text }))}
              />
            </View>

            {/* Password */}
            <View style={styles.inputGroup}>
              <Text style={styles.inputLabel}>Password</Text>
              <TextInput
                style={styles.textInput}
                placeholder="Password"
                value={accountData.password}
                secureTextEntry
                onChangeText={(text) => setAccountData(prev => ({ ...prev, password: text }))}
              />
            </View>

            {/* Phone */}
            <View style={styles.inputGroup}>
              <Text style={styles.inputLabel}>Phone</Text>
              <TextInput
                style={styles.textInput}
                placeholder="Phone Number"
                value={accountData.phone}
                keyboardType="phone-pad"
                onChangeText={(text) => setAccountData(prev => ({ ...prev, phone: text }))}
              />
            </View>

            {/* Buttons */}
            <View style={styles.buttonContainer}>
              <TouchableOpacity
                style={[buttonStyles.secondary, styles.cancelButton]}
                onPress={handleCancel}
              >
                <Text style={styles.cancelButtonText}>Cancel</Text>
              </TouchableOpacity>

              <TouchableOpacity
                style={[buttonStyles.primary, styles.saveButton]}
                onPress={handleSave}
              >
                <Text style={buttonStyles.primaryText}>Add Owner</Text>
              </TouchableOpacity>
            </View>
          </View>
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.background },
  header: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', padding: 16, backgroundColor: colors.card },
  headerTitle: { fontSize: 18, fontWeight: '600', color: colors.text },
  saveText: { fontSize: 16, color: colors.primary, fontWeight: '600' },
  scrollView: { flex: 1 },
  contentSection: { padding: 20 },
  inputGroup: { marginBottom: 20 },
  inputLabel: { fontSize: 14, fontWeight: '500', marginBottom: 8, color: colors.text },
  textInput: { backgroundColor: colors.backgroundAlt, padding: 12, borderRadius: 8, fontSize: 16, color: colors.text },
  buttonContainer: { flexDirection: 'row', gap: 12, marginTop: 24 },
  cancelButton: { flex: 1 },
  cancelButtonText: { color: colors.text, fontWeight: '600', fontSize: 16 },
  saveButton: { flex: 1 },
});