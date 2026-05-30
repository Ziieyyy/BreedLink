import React, { useState, useEffect  } from 'react';
import { 
  View, 
  Text, 
  TextInput, 
  TouchableOpacity, 
  StyleSheet, 
  ScrollView, 
  KeyboardAvoidingView, 
  Platform, 
  Alert
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { colors, buttonStyles, commonStyles } from '../styles/commonStyles';
import Icon from '../components/Icon';
import { supabase } from 'supabase';
import AsyncStorage from '@react-native-async-storage/async-storage';
 

export default function EditOwnerScreen() { 
  const router = useRouter();
  const { owner_id } = useLocalSearchParams();
  const [accountData, setAccountData] = useState({
    name: '',
    email: '',
    phone: '',
  });

 useEffect(() => {
  if (!owner_id) return;
  const fetchOwnerData = async () => {
    const { data, error } = await supabase
      .from('owner')
      .select('name, email, phone')
      .eq('owner_id', owner_id)
      .single();

    if (data) {
      setAccountData({
        name: data.name || '',
        email: data.email || '',
        phone: data.phone || '',
      });
    }
  };
  fetchOwnerData();
}, [owner_id]);

    const handleSave = async () => {
    const { error } = await supabase
    .from('owner')
    .update({
      name: accountData.name,
      email: accountData.email,
      phone: accountData.phone,
    })
    .eq('owner_id', owner_id);

  if (error) {
    Alert.alert('Error', error.message);
  } else {
    Alert.alert('Success', 'Owner updated successfully!', [
      { text: 'OK', onPress: () => router.back() }
    ]);
  }
};

  const handleCancel = () => {
    router.back();
  };

  return (
    <SafeAreaView style={styles.container}>
      <KeyboardAvoidingView 
        style={styles.keyboardView}
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
      >
        {/* Header */}
        <View style={styles.header}>
          <TouchableOpacity onPress={handleCancel}>
            <Icon name="arrow-back" size={24} color={colors.text} />
          </TouchableOpacity>
          <Text style={styles.headerTitle}>Edit Account</Text>
          <TouchableOpacity onPress={handleSave}>
            <Text style={styles.saveText}>Save</Text>
          </TouchableOpacity>
        </View>

        {/* Scroll Content */}
        <ScrollView style={styles.scrollView} showsVerticalScrollIndicator={false}>
          <View style={styles.contentSection}>
            {/* Basic Information */}
            <Text style={styles.sectionTitle}>Basic Information</Text>
            
            <View style={styles.inputGroup}>
              <Text style={styles.inputLabel}>Full Name</Text>
              <View style={styles.inputContainer}>
                <TextInput
                  style={styles.textInput}
                  placeholder="Your Name"
                  placeholderTextColor={colors.textLight}
                  value={accountData.name}
                  onChangeText={(text) => setAccountData(prev => ({ ...prev, name: text }))}
                />
                <View style={styles.inputIcon}>
                  <Icon name="person" size={20} color={colors.textLight} />
                </View>
              </View>
            </View>

            <View style={styles.inputGroup}>
              <Text style={styles.inputLabel}>Email Address</Text>
              <View style={styles.inputContainer}>
                <TextInput
                  style={styles.textInput}
                  placeholder="example@your.email"
                  placeholderTextColor={colors.textLight}
                  value={accountData.email}
                  onChangeText={(text) => setAccountData(prev => ({ ...prev, email: text }))}
                  keyboardType="email-address"
                  autoCapitalize="none"
                />
                <View style={styles.inputIcon}>
                  <Icon name="mail" size={20} color={colors.textLight} />
                </View>
              </View>
            </View>

            <View style={styles.inputGroup}>
              <Text style={styles.inputLabel}>Phone Number</Text>
              <View style={styles.inputContainer}>
                <View style={styles.phoneInputContainer}>
                  <View style={styles.countryCode}>
                    <Text style={styles.flagText}>🇺🇸</Text>
                    <Text style={styles.countryCodeText}>+1</Text>
                    <Icon name="chevron-down" size={16} color={colors.textLight} />
                  </View>
                  <TextInput
                    style={styles.phoneInput}
                    placeholder="1234 5678 9101"
                    placeholderTextColor={colors.textLight}
                    value={accountData.phone.replace('+1 (555) ', '')}
                    onChangeText={(text) => setAccountData(prev => ({ ...prev, phone: `+1 (555) ${text}` }))}
                    keyboardType="phone-pad"
                  />
                </View>
                <View style={styles.inputIcon}>
                  <Icon name="call" size={20} color={colors.textLight} />
                </View>
              </View>
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
                <Text style={buttonStyles.primaryText}>Update Profile</Text>
              </TouchableOpacity>
            </View>
          </View>
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background,
  },
  keyboardView: {
    flex: 1,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
    paddingVertical: 16,
    backgroundColor: colors.card,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: colors.text,
  },
  saveText: {
    fontSize: 16,
    color: colors.primary,
    fontWeight: '600',
  },
  scrollView: {
    flex: 1,
  },
  contentSection: {
    paddingHorizontal: 20,
    paddingTop: 30,
    paddingBottom: 20,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: colors.text,
    marginBottom: 20,
  },
  inputGroup: {
    marginBottom: 20,
  },
  inputLabel: {
    fontSize: 14,
    fontWeight: '500',
    color: colors.text,
    marginBottom: 8,
  },
  inputContainer: {
    position: 'relative',
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#F8F9FA',
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#E9ECEF',
    paddingHorizontal: 16,
    paddingVertical: 12,
  },
  textInput: {
    flex: 1,
    fontSize: 16,
    color: colors.text,
    paddingVertical: 0,
  },
  inputIcon: {
    marginLeft: 12,
  },
  phoneInputContainer: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
  },
  countryCode: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingRight: 12,
    marginRight: 12,
    borderRightWidth: 1,
    borderRightColor: '#E9ECEF',
  },
  flagText: {
    fontSize: 16,
    marginRight: 6,
  },
  countryCodeText: {
    fontSize: 16,
    color: colors.text,
    marginRight: 4,
  },
  phoneInput: {
    flex: 1,
    fontSize: 16,
    color: colors.text,
    paddingVertical: 0,
  },
  buttonContainer: {
    flexDirection: 'row',
    gap: 12,
    marginTop: 24,
  },
  cancelButton: {
    flex: 1,
  },
  cancelButtonText: {
    color: colors.text,
    fontSize: 16,
    fontWeight: '600',
  },
  saveButton: {
    flex: 1,
  },
});