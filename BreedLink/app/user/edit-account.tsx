import React, { useState, useEffect, useMemo } from 'react';
import { 
  View, 
  Text, 
  TextInput, 
  TouchableOpacity, 
  StyleSheet, 
  ScrollView, 
  KeyboardAvoidingView, 
  Platform, 
  Alert, 
  Modal,
  FlatList
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import { colors, buttonStyles } from '../styles/commonStyles';
import Icon from '../components/Icon';
import { supabase } from '../supabase';
import AsyncStorage from '@react-native-async-storage/async-storage';
import BottomNavigation from '../components/BottomNavigation';
import countryCodes, { CountryCode, sortCountries, searchCountries } from '../utils/countryCodes';

export default function EditAccountScreen() {
  const router = useRouter();
  const [accountData, setAccountData] = useState({
    name: '',
    email: '',
    phone: '',
  });
  const [showCountryDropdown, setShowCountryDropdown] = useState(false);
  const [selectedCountry, setSelectedCountry] = useState<CountryCode>({
    code: "US",
    name: "United States",
    dial_code: "+1",
    flag: "🇺🇸"
  });
  const [searchQuery, setSearchQuery] = useState('');
  const [originalPhone, setOriginalPhone] = useState('');

  useEffect(() => {
  const fetchOwnerData = async () => {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return;

    const { data } = await supabase
      .from('owner')
      .select('name, email, phone')
      .eq('owner_id', user.id)
      .single();

    if (data) {
      // Parse the phone number
      let phoneWithoutCode = '';
      let detectedCountry = selectedCountry;
      
      if (data.phone) {
        // Extract dial code from phone number
        const dialCode = data.phone.match(/^\+\d+/)?.[0];
        if (dialCode) {
          const country = countryCodes.find(c => c.dial_code === dialCode);
          if (country) {
            detectedCountry = country;
            phoneWithoutCode = data.phone.substring(dialCode.length);
          } else {
            phoneWithoutCode = data.phone;
          }
        } else {
          phoneWithoutCode = data.phone;
        }
      }

      setAccountData({
        name: data.name || '',
        email: data.email || '',
        phone: phoneWithoutCode, // Store only the number without country code
      });
      
      setOriginalPhone(data.phone || ''); // Store original full phone
      setSelectedCountry(detectedCountry);
    }
  };

  fetchOwnerData();
}, []);

 const handleSave = async () => {
  try {
    const { data: { user }, error: userError } = await supabase.auth.getUser();
    if (userError || !user) {
      Alert.alert('Error', 'You must be logged in to update profile.');
      return;
    }

    // Build the full phone number
    let fullPhoneNumber = accountData.phone;
    if (fullPhoneNumber && !fullPhoneNumber.startsWith('+')) {
      fullPhoneNumber = `${selectedCountry.dial_code}${accountData.phone}`;
    }

    console.log('Saving phone:', fullPhoneNumber); // Debug log

    const { error } = await supabase
      .from('owner')
      .update({
        name: accountData.name,
        phone: fullPhoneNumber,
      })
      .eq('owner_id', user.id);

    if (error) {
      console.error(error);
      Alert.alert('Error', 'Failed to update account');
    } else {
      Alert.alert('Success', 'Account information updated successfully!', [
        { text: 'OK', onPress: () => router.back() }
      ]);
    }
  } catch (err) {
    console.error(err);
    Alert.alert('Error', 'Something went wrong');
  }
};

  const handleCancel = () => {
    router.back();
  };

  const handleCountrySelect = (country: CountryCode) => {
  console.log('Selected country:', country);
  setSelectedCountry(country);
  setShowCountryDropdown(false);
  setSearchQuery('');
};

  // Memoized sorted and filtered country list
  const filteredAndSortedCountries = useMemo(() => {
    const sortedCountries = sortCountries(countryCodes);
    return searchCountries(sortedCountries, searchQuery);
  }, [searchQuery]);

  const renderCountryItem = ({ item }: { item: CountryCode }) => (
    <TouchableOpacity 
      style={styles.countryItem}
      onPress={() => handleCountrySelect(item)}
    >
      <Text style={styles.flagText}>{item.flag}</Text>
      <Text style={styles.countryName}>{item.name}</Text>
      <Text style={styles.countryCodeText}>{item.dial_code}</Text>
    </TouchableOpacity>
  );

  // Extract phone number without country code for display
  

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
  <View style={[styles.inputContainer, styles.disabledInput]}>
    <TextInput
      style={[styles.textInput, styles.disabledText]}
      placeholder="example@your.email"
      placeholderTextColor={colors.textLight}
      value={accountData.email}
      editable={false}
      keyboardType="email-address"
      autoCapitalize="none"
    />
    <View style={styles.inputIcon}>
      <Icon name="mail" size={20} color={colors.textLight} />
    </View>
  </View>
  <Text style={styles.helperText}>Email cannot be changed</Text>
</View>

<View style={styles.inputGroup}>
  <Text style={styles.inputLabel}>Phone Number</Text>
  <View style={styles.inputContainer}>
    <View style={styles.phoneInputContainer}>
      <TouchableOpacity 
        style={styles.countryCode}
        onPress={() => setShowCountryDropdown(true)}
      >
        <Text style={styles.flagText}>{selectedCountry.flag}</Text>
        <Text style={styles.countryCodeText}>{selectedCountry.dial_code}</Text>
        <Icon name="chevron-down" size={16} color={colors.textLight} />
      </TouchableOpacity>
      <TextInput
        style={styles.phoneInput}
        placeholder="1234 5678 9101"
        placeholderTextColor={colors.textLight}
        value={accountData.phone}
        onChangeText={(text) => setAccountData(prev => ({ ...prev, phone: text }))}
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

        {/* Country Dropdown Modal */}
        <Modal
          visible={showCountryDropdown}
          transparent={true}
          animationType="fade"
          onRequestClose={() => {
            setShowCountryDropdown(false);
            setSearchQuery(''); // Clear search when closing
          }}
        >
          <TouchableOpacity 
            style={styles.modalOverlay}
            onPress={() => {
              setShowCountryDropdown(false);
              setSearchQuery(''); // Clear search when closing
            }}
          >
            <View style={styles.dropdownContainer}>
              <View style={styles.dropdownHeader}>
                <Text style={styles.dropdownTitle}>Select Country</Text>
                <TouchableOpacity onPress={() => {
                  setShowCountryDropdown(false);
                  setSearchQuery(''); // Clear search when closing
                }}>
                  <Icon name="close" size={24} color={colors.text} />
                </TouchableOpacity>
              </View>
              
              {/* Search Bar */}
              <View style={styles.searchContainer}>
                <Icon name="search" size={20} color={colors.textLight} style={styles.searchIcon} />
                <TextInput
                  style={styles.searchInput}
                  placeholder="Search countries..."
                  placeholderTextColor={colors.textLight}
                  value={searchQuery}
                  onChangeText={setSearchQuery}
                  autoFocus
                />
                {searchQuery ? (
                  <TouchableOpacity onPress={() => setSearchQuery('')}>
                    <Icon name="close" size={20} color={colors.textLight} />
                  </TouchableOpacity>
                ) : null}
              </View>
              
              <FlatList
                data={filteredAndSortedCountries}
                keyExtractor={(item) => item.code}
                renderItem={renderCountryItem}
                style={styles.countryList}
                showsVerticalScrollIndicator={false}
                keyboardShouldPersistTaps="handled"
              />
            </View>
          </TouchableOpacity>
        </Modal>

        <BottomNavigation />
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
    backgroundColor: colors.white,
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
  profileImageWrapper: {
    position: 'relative',
    alignSelf: 'center',
    marginBottom: 30,
  },
  profileImageCircle: {
    width: 100,
    height: 100,
    borderRadius: 50,
    backgroundColor: '#A8A8A8',
    alignItems: 'center',
    justifyContent: 'center',
    overflow: 'hidden',
  },
  profileImage: {
    width: '100%',
    height: '100%',
    borderRadius: 50,
  },
  addIconContainer: {
    position: 'absolute',
    bottom: 0,
    right: 0,
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: colors.white,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: '#E0E0E0',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
    elevation: 2,
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
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  dropdownContainer: {
    backgroundColor: colors.white,
    borderRadius: 12,
    width: '90%',
    maxHeight: '70%',
    overflow: 'hidden',
  },
  dropdownHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 16,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
  },
  dropdownTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: colors.text,
  },
  searchContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#F8F9FA',
    borderRadius: 8,
    margin: 16,
    paddingHorizontal: 12,
    paddingVertical: 8,
  },
  searchIcon: {
    marginRight: 8,
  },
  searchInput: {
    flex: 1,
    fontSize: 16,
    color: colors.text,
    paddingVertical: 0,
  },
  countryList: {
    maxHeight: 300,
  },
  countryItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 12,
    paddingHorizontal: 16,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
  },
  countryName: {
    flex: 1,
    fontSize: 16,
    color: colors.text,
    marginLeft: 12,
  },
  disabledInput: {
  backgroundColor: '#F0F0F0',
  opacity: 0.7,
},
disabledText: {
  color: colors.textLight,
},
helperText: {
  fontSize: 12,
  color: colors.textLight,
  marginTop: 4,
  fontStyle: 'italic',
},
});