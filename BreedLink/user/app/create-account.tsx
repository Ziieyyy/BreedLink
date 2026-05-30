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
import { supabase } from 'supabase';
import AsyncStorage from '@react-native-async-storage/async-storage';
import countryCodes, { CountryCode, sortCountries, searchCountries } from '../utils/countryCodes';
import CustomAlert from '../components/CustomAlert';

export default function CreateAccountScreen() {
  const router = useRouter();
  const [step, setStep] = useState(1);
  const [formData, setFormData] = useState({
    name: '',
    phone: '',
    bio: '',
  });
  const [showGenderDropdown, setShowGenderDropdown] = useState(false);
  const [userConfirmed, setUserConfirmed] = useState(false);
  const [showCountryDropdown, setShowCountryDropdown] = useState(false);
  const [selectedCountry, setSelectedCountry] = useState<CountryCode>({
    code: "US",
    name: "United States",
    dial_code: "+1",
    flag: "🇺🇸"
  });
  const [searchQuery, setSearchQuery] = useState('');
  
  // Custom Alert State
  const [alertVisible, setAlertVisible] = useState(false);
  const [alertTitle, setAlertTitle] = useState('');
  const [alertMessage, setAlertMessage] = useState('');
  const [alertType, setAlertType] = useState<'success' | 'error' | 'warning' | 'info'>('info');

  // Function to show custom alert
  const showCustomAlert = (title: string, message: string, type: 'success' | 'error' | 'warning' | 'info' = 'info') => {
    setAlertTitle(title);
    setAlertMessage(message);
    setAlertType(type);
    setAlertVisible(true);
  };

  useEffect(() => {
    checkEmailConfirmation();
  }, []);

  const checkEmailConfirmation = async () => {
    try {
      const { data: { user }, error } = await supabase.auth.getUser();
      
      if (error || !user) {
        Alert.alert('Error', 'Please log in again.');
        router.replace('/(auth)/login');
        return;
      }
      
      setUserConfirmed(true);
    } catch (error) {
      console.error('Error checking user session:', error);
      Alert.alert('Error', 'Failed to verify user session.');
    }
  };

  const handleLocationAccess = async () => {
    try {
      Alert.alert(
        'Location Access',
        'BreedLink would like to access your location to find cats and matches near you.',
        [
          {
            text: 'Allow',
            onPress: () => {
              setFormData(prev => ({ ...prev, locationAccess: true }));
              Alert.alert('Success', 'Location access granted!');
            }
          },
          {
            text: 'Not Now',
            style: 'cancel',
            onPress: () => setFormData(prev => ({ ...prev, locationAccess: false }))
          }
        ]
      );
    } catch (error) {
      console.error('Error requesting location permission:', error);
    }
  };

  const handleNext = async () => {
    // Since we removed step 2, this function now handles the complete setup
    try {
      // Validate name field
      if (!formData.name.trim()) {
        showCustomAlert('Validation Error', 'Please enter your full name.', 'error');
        return;
      }
      
      // Validate name length
      if (formData.name.trim().length < 2) {
        showCustomAlert('Validation Error', 'Name must be at least 2 characters long.', 'error');
        return;
      }
      
      // Validate phone number
      if (!formData.phone.trim()) {
        showCustomAlert('Validation Error', 'Please enter your phone number.', 'error');
        return;
      }
      
      // Validate phone number format (basic validation - at least 7 digits)
      const phoneDigits = formData.phone.replace(/\D/g, '');
      if (phoneDigits.length < 7) {
        showCustomAlert('Validation Error', 'Please enter a valid phone number (at least 7 digits).', 'error');
        return;
      }
      
      // Get current logged-in user
      const { data: { user }, error: userError } = await supabase.auth.getUser();
      if (userError || !user) {
        showCustomAlert('Authentication Error', 'Could not find user session. Please log in again.', 'error');
        return;
      }

      // Combine country code with phone number
      const fullPhoneNumber = `${selectedCountry.dial_code}${formData.phone}`;

      console.log('Attempting to save owner data:', {
        owner_id: user.id,
        name: formData.name.trim(),
        email: user.email,
        phone: fullPhoneNumber
      });

      // Insert or update owner table using upsert
      const { data: upsertData, error: upsertError } = await supabase
        .from('owner')
        .upsert({
          owner_id: user.id,
          name: formData.name.trim(),
          email: user.email,
          phone: fullPhoneNumber,
        }, {
          onConflict: 'owner_id'
        })
        .select();

      if (upsertError) {
        console.error('Upsert error:', upsertError);
        // Check for specific error types
        if (upsertError.code === '23505') {
          showCustomAlert('Duplicate Entry', 'An account with this information already exists.', 'error');
        } else if (upsertError.code === '23503') {
          showCustomAlert('Database Error', 'Invalid user reference. Please try logging in again.', 'error');
        } else {
          showCustomAlert('Database Error', `Failed to save your account details: ${upsertError.message}`, 'error');
        }
        return;
      }

      // Verify that data was actually saved
      if (!upsertData || upsertData.length === 0) {
        showCustomAlert('Error', 'Failed to save account data. Please try again.', 'error');
        return;
      }
      
      // Verify the saved data contains name and phone
      const savedRecord = upsertData[0];
      if (!savedRecord.name || !savedRecord.phone) {
        showCustomAlert('Warning', 'Account created but some data may be missing. Please verify your profile.', 'warning');
      }

      console.log('Owner profile saved successfully:', upsertData);
      
      // Set session flag that profile is complete
      try {
        await AsyncStorage.setItem('profile_complete', 'true');
      } catch (storageError) {
        console.error('AsyncStorage error:', storageError);
        // Continue anyway as the data is saved in database
      }
      
      showCustomAlert('Success', '✅ Account created successfully! Your name and phone number have been saved.', 'success');

    } catch (err) {
      console.error('Unexpected error:', err);
      showCustomAlert('Unexpected Error', 'Something went wrong. Please try again.', 'error');
    }
  };

  const handleBack = () => {
    router.back();
  };

  const handleSkip = () => {
    // Skip functionality disabled
    return;
  };

  const handleGenderSelect = (gender: string) => {
    setFormData(prev => ({ ...prev, gender }));
    setShowGenderDropdown(false);
  };

  const handleCountrySelect = (country: CountryCode) => {
    setSelectedCountry(country);
    setShowCountryDropdown(false);
    setSearchQuery(''); // Clear search when selecting a country
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

  const renderStep = () => {
    // Only render step 1 since we removed step 2
    return (
      <View style={styles.stepContainer}>
        
        <View style={styles.inputGroup}>
          <Text style={styles.inputLabel}>Full Name</Text>
          <View style={styles.inputContainer}>
            <TextInput
              style={styles.textInput}
              placeholder="Your Name"
              placeholderTextColor={colors.textLight}
              value={formData.name}
              onChangeText={(text) => setFormData(prev => ({ ...prev, name: text }))}
            />
            <View style={styles.inputIcon}>
              <Icon name="person" size={20} color={colors.textLight} />
            </View>
          </View>
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
                value={formData.phone}
                onChangeText={(text) => setFormData(prev => ({ ...prev, phone: text }))}
                keyboardType="phone-pad"
              />
            </View>
            <View style={styles.inputIcon}>
              <Icon name="call" size={20} color={colors.textLight} />
            </View>
          </View>
        </View>
                   
        {/* Next Button - now completes the setup */}
        <TouchableOpacity
          style={[buttonStyles.primary, styles.nextButtonInCard]}
          onPress={handleNext}
        >
          <Text style={buttonStyles.primaryText}>
            Complete Setup
          </Text>
        </TouchableOpacity>
      </View>
    );
  };

  // Show a loading state while checking email confirmation
  if (!userConfirmed) {
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.centeredContainer}>
          <Text>Verifying email confirmation...</Text>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.container}>
      <KeyboardAvoidingView 
        style={styles.keyboardView}
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
      >
        <View style={styles.header}>
          <TouchableOpacity onPress={handleBack}>
            <Icon name="arrow-back" size={24} color={colors.text} />
          </TouchableOpacity>
          <Text style={styles.headerTitle}>
            Create Your Profile
          </Text>
          <View style={{ width: 40 }} />
        </View>

        <View style={styles.progressContainer}>
          <View style={styles.progressBar}>
            <View style={[styles.progressFill, { width: '100%' }]} />
          </View>
          <Text style={styles.progressText}>Step 1 of 1</Text>
        </View>

        <View style={styles.contentContainer}>
          {renderStep()}
        </View>

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
        
        {/* Custom Alert Component */}
        <CustomAlert
          visible={alertVisible}
          type={alertType}
          title={alertTitle}
          message={alertMessage}
          confirmText="OK"
          onConfirm={() => {
            setAlertVisible(false);
            if (alertType === 'success') {
              router.replace('/home');
            }
          }}
        />
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background,
  },
  centeredContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
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
  skipText: {
    fontSize: 16,
    color: colors.primary,
    fontWeight: '500',
  },
  progressContainer: {
    paddingHorizontal: 20,
    paddingVertical: 16,
    backgroundColor: colors.background,
  },
  progressBar: {
    height: 4,
    backgroundColor: colors.border,
    borderRadius: 2,
    marginBottom: 8,
  },
  progressFill: {
    height: '100%',
    backgroundColor: colors.primary,
    borderRadius: 2,
  },
  progressText: {
    fontSize: 12,
    color: colors.textLight,
    textAlign: 'center',
  },
  contentContainer: {
    flex: 1,
  },
  stepContainer: {
    paddingHorizontal: 20,
    paddingTop: 20,
    paddingBottom: 20,
  },

  profileImageSection: {
    alignItems: 'center',
    marginBottom: 24,
  },
  profileImageContainer: {
    alignItems: 'center',
    justifyContent: 'center',
  },
  profileImageWrapper: {
    position: 'relative',
    alignItems: 'center',
    justifyContent: 'center',
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
    top: -5,
    right: -5,
    width: 24,
    height: 24,
    borderRadius: 12,
    backgroundColor: colors.white,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: '#E0E0E0',
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 1,
    },
    shadowOpacity: 0.1,
    shadowRadius: 2,
    elevation: 2,
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
  locationAccessButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: '#F8F9FA',
    borderRadius: 8,
    borderWidth: 1,
    borderColor: colors.primary,
    paddingHorizontal: 16,
    paddingVertical: 12,
    marginTop: 8,
  },
  locationAccessButtonActive: {
    backgroundColor: colors.primary,
    borderColor: colors.primary,
  },
  locationAccessContent: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  locationAccessText: {
    fontSize: 16,
    color: colors.primary,
    fontWeight: '500',
  },
  locationAccessTextActive: {
    color: colors.white,
  },
  textAreaContainer: {
    alignItems: 'flex-start',
    paddingVertical: 12,
    minHeight: 100,
  },
  textArea: {
    height: 80,
    textAlignVertical: 'top',
  },
  nextButtonInCard: {
    width: '100%',
    marginTop: 24,
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
});