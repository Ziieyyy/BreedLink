import React, { useState, useEffect } from 'react';
import { View, Text, TextInput, TouchableOpacity, StyleSheet, ScrollView, Alert, Image, Platform } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter, useLocalSearchParams } from 'expo-router';
import DateTimePicker from '@react-native-community/datetimepicker';
import * as ImagePicker from 'expo-image-picker';
import * as Location from 'expo-location';
import { supabase } from '../supabase';
import { colors, buttonStyles } from '../styles/commonStyles';
import Icon from '../components/Icon';
import BottomNavigation from '../components/BottomNavigation';

interface CatFormData {
  name: string;
  breed: string;
  dateOfBirth: Date;
  personality: string[];
  description: string;
  profileImage: string;
  searchingFor: 'mate' | 'companion' | 'both' | 'none';
  vaccinations: {
    rabies: boolean;
    fvrcp: boolean;
    deworming: boolean;
  };
  vaccinationType: string | null; // Added vaccinationType field
  location: {
    latitude: number | null;
    longitude: number | null;
    address: string | null;
  };
}

const personalityOptions = [
  'Playful', 'Calm', 'Affectionate', 'Independent', 'Social', 'Gentle', 
  'Energetic', 'Curious', 'Friendly', 'Quiet', 'Active', 'Loyal'
];

export default function EditCatProfileScreen() {
  const router = useRouter();
  const params = useLocalSearchParams();
  const catId = params.catId as string;
  const isFemale = params.isFemale === 'true'; // Added to determine which table to use

  // Initialize with empty data
  const [formData, setFormData] = useState<CatFormData>({
    name: '',
    breed: '',
    dateOfBirth: new Date(),
    personality: [],
    description: '',
    profileImage: 'https://images.unsplash.com/photo-1514888286974-6c03e2ca1dba?w=400&h=400&fit=crop',
    searchingFor: 'none',
    vaccinations: {
      rabies: false,
      fvrcp: false,
      deworming: false,
    },
    vaccinationType: null, // Added vaccinationType field
    location: {
      latitude: null,
      longitude: null,
      address: null,
    }
  });

  const [showDatePicker, setShowDatePicker] = useState(false);
  const [profileImageUri, setProfileImageUri] = useState<string | null>(null);
  const [locationLoading, setLocationLoading] = useState(false);
  const [loading, setLoading] = useState(true); // Added loading state

  useEffect(() => {
    if (catId) {
      fetchCatData();
    }
  }, [catId]);

  const fetchCatData = async () => {
    try {
      setLoading(true);
      
      // Parse the cat ID to determine gender table
      const isFemaleCat = catId.startsWith('f-');
      const actualId = catId.substring(2); // Remove the 'f-' or 'm-' prefix
      
      // Fetch from appropriate table
      let catDataFromDB;
      let error;
      if (isFemaleCat) {
        const result = await supabase
          .from('female_cats')
          .select('*')
          .eq('female_cat_id', actualId)
          .single();
        
        catDataFromDB = result.data;
        error = result.error;
      } else {
        const result = await supabase
          .from('male_cats')
          .select('*')
          .eq('male_cat_id', actualId)
          .single();
        
        catDataFromDB = result.data;
        error = result.error;
      }
      
      if (error) {
        throw error;
      }
      
      if (!catDataFromDB) {
        throw new Error('Cat data not found');
      }

      // Transform database data to form data
      const transformedData: CatFormData = {
        name: catDataFromDB.name,
        breed: catDataFromDB.breed,
        dateOfBirth: new Date(), // We'll calculate this from age
        personality: catDataFromDB.personality || [],
        description: catDataFromDB.health_status || '', // Use health_status instead of description
        profileImage: catDataFromDB.profile_image_url || 'https://images.unsplash.com/photo-1514888286974-6c03e2ca1dba?w=400&h=400&fit=crop',
        searchingFor: 'none', // Default value
        vaccinations: {
          rabies: false,
          fvrcp: false,
          deworming: false,
        },
        vaccinationType: catDataFromDB.vaccination_type || null, // Added vaccinationType from database
        location: {
          latitude: catDataFromDB.latitude,
          longitude: catDataFromDB.longtitude,
          address: catDataFromDB.location_address || null,
        }
      };

      // Parse vaccination data from vaccination_status_url
      if (catDataFromDB.vaccination_status_url) {
        try {
          const vaccinationData = JSON.parse(catDataFromDB.vaccination_status_url);
          transformedData.vaccinations = {
            rabies: vaccinationData.rabies || false,
            fvrcp: vaccinationData.fvrcp || false,
            deworming: vaccinationData.deworming || false,
          };
        } catch (parseError) {
          console.warn('Failed to parse vaccination data:', parseError);
        }
      }

      // Calculate date of birth from age (approximate)
      if (catDataFromDB.age) {
        const today = new Date();
        const birthYear = today.getFullYear() - catDataFromDB.age;
        transformedData.dateOfBirth = new Date(birthYear, today.getMonth(), today.getDate());
      }

      setFormData(transformedData);
      setProfileImageUri(transformedData.profileImage);
    } catch (error: any) {
      console.error('Error fetching cat data:', error);
      Alert.alert('Error', `Failed to load cat profile: ${error.message || error.toString() || 'Please try again.'}`);
    } finally {
      setLoading(false);
    }
  };

  const calculateAge = (birthDate: Date): string => {
    const today = new Date();
    const diffTime = Math.abs(today.getTime() - birthDate.getTime());
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
    
    const years = Math.floor(diffDays / 365);
    const months = Math.floor((diffDays % 365) / 30);
    
    if (years === 0) {
      return `${months} month${months !== 1 ? 's' : ''}`;
    } else if (months === 0) {
      return `${years} year${years !== 1 ? 's' : ''}`;
    } else {
      return `${years} year${years !== 1 ? 's' : ''}, ${months} month${months !== 1 ? 's' : ''}`;
    }
  };

  const getCurrentLocation = async () => {
    try {
      setLocationLoading(true);
      
      // Request location permissions
      const { status } = await Location.requestForegroundPermissionsAsync();
      if (status !== 'granted') {
        Alert.alert('Permission Denied', 'Location permission is required to get your cat\'s location.');
        setLocationLoading(false);
        return;
      }

      // Get current location
      const location = await Location.getCurrentPositionAsync({});
      
      // Reverse geocode to get address
      const reverseGeocode = await Location.reverseGeocodeAsync({
        latitude: location.coords.latitude,
        longitude: location.coords.longitude,
      });

      let address = '';
      if (reverseGeocode.length > 0) {
        const place = reverseGeocode[0];
        address = `${place.city || place.region || ''}, ${place.country || ''}`.trim();
        if (address.startsWith(',')) {
          address = address.substring(2);
        }
      }

      // Update form data with location
      setFormData(prev => ({
        ...prev,
        location: {
          latitude: location.coords.latitude,
          longitude: location.coords.longitude,
          address: address || 'Current Location'
        }
      }));

      Alert.alert('Success', 'Cat location updated successfully!');
    } catch (error) {
      console.error('Error getting location:', error);
      Alert.alert('Error', 'Failed to get location. Please try again.');
    } finally {
      setLocationLoading(false);
    }
  };

  const handleImagePicker = async () => {
    try {
      const permissionResult = await ImagePicker.requestMediaLibraryPermissionsAsync();
      if (permissionResult.granted === false) {
        Alert.alert('Permission Required', 'Permission to access camera roll is required!');
        return;
      }

      Alert.alert(
        'Update Profile Picture',
        'Choose an option',
        [
          {
            text: 'Camera',
            onPress: async () => {
              const cameraPermission = await ImagePicker.requestCameraPermissionsAsync();
              if (cameraPermission.granted) {
                const result = await ImagePicker.launchCameraAsync({
                  mediaTypes: ImagePicker.MediaTypeOptions.Images,
                  allowsEditing: true,
                  aspect: [1, 1],
                  quality: 0.8,
                });
                
                if (!result.canceled) {
                  setProfileImageUri(result.assets[0].uri);
                  setFormData(prev => ({ ...prev, profileImage: result.assets[0].uri }));
                }
              }
            }
          },
          {
            text: 'Photo Library',
            onPress: async () => {
              const result = await ImagePicker.launchImageLibraryAsync({
                mediaTypes: ImagePicker.MediaTypeOptions.Images,
                allowsEditing: true,
                aspect: [1, 1],
                quality: 0.8,
              });
              
              if (!result.canceled) {
                setProfileImageUri(result.assets[0].uri);
                setFormData(prev => ({ ...prev, profileImage: result.assets[0].uri }));
              }
            }
          },
          { text: 'Cancel', style: 'cancel' }
        ]
      );
    } catch (error) {
      console.error('Error picking image:', error);
      Alert.alert('Error', 'Failed to pick image. Please try again.');
    }
  };

  const handleDateChange = (event: any, selectedDate?: Date) => {
    setShowDatePicker(Platform.OS === 'ios');
    if (selectedDate) {
      setFormData(prev => ({ ...prev, dateOfBirth: selectedDate }));
    }
  };

  const togglePersonality = (trait: string) => {
    setFormData(prev => ({
      ...prev,
      personality: prev.personality.includes(trait)
        ? prev.personality.filter(p => p !== trait)
        : [...prev.personality, trait]
    }));
  };

  const handleSave = async () => {
    if (!formData.name.trim()) {
      Alert.alert('Error', 'Please enter a name for your cat');
      return;
    }

    if (!formData.breed.trim()) {
      Alert.alert('Error', 'Please enter your cat\'s breed');
      return;
    }

    try {
      // Parse the cat ID to determine gender table
      const isFemaleCat = catId.startsWith('f-');
      const actualId = catId.substring(2); // Remove the 'f-' or 'm-' prefix
      
      // Calculate age from date of birth
      const today = new Date();
      const birthDate = formData.dateOfBirth;
      const diffTime = Math.abs(today.getTime() - birthDate.getTime());
      const age = Math.floor(diffTime / (1000 * 60 * 60 * 24 * 365.25)); // Approximate age in years

      // Prepare data for update - excluding vaccination_status_url and using separate columns
      const updateData = {
        name: formData.name,
        breed: formData.breed,
        age: age,
        health_status: formData.description, // Save description to health_status column
        profile_image_url: profileImageUri,
        // Removed vaccination_status_url from update
        // Note: vaccination_type is not updated here as it's managed separately in vaccination-update
        latitude: formData.location.latitude,
        longtitude: formData.location.longitude,
        location_address: formData.location.address,
        updated_at: new Date().toISOString()
      };

      // Update appropriate table based on gender
      let updateError;
      if (isFemaleCat) {
        const { error } = await supabase
          .from('female_cats')
          .update(updateData)
          .eq('female_cat_id', actualId);
        updateError = error;
      } else {
        const { error } = await supabase
          .from('male_cats')
          .update(updateData)
          .eq('male_cat_id', actualId);
        updateError = error;
      }

      if (updateError) {
        throw updateError;
      }

      // After successful update, also update the local state to ensure consistency
      // This ensures that if the user navigates away and back, they see the updated data
      setFormData(prev => ({
        ...prev,
        ...updateData
      }));

      Alert.alert(
        'Success',
        'Cat profile updated successfully!',
        [{ text: 'OK', onPress: () => router.replace('/cat-management') }] // Navigate back to cat management
      );
    } catch (error: any) {
      console.error('Error saving cat profile:', error);
      Alert.alert('Error', `Failed to save profile: ${error.message || error.toString() || 'Please try again.'}`);
    }
  };

  const handleUpdateVaccination = () => {
    router.push(`/vaccination-update?catId=${catId || '1'}`);
  };

  if (loading) {
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.header}>
          <TouchableOpacity onPress={() => router.back()}>
            <Icon name="arrow-back" size={24} color={colors.text} />
          </TouchableOpacity>
          <Text style={styles.headerTitle}>Edit Cat Profile</Text>
          <View style={{ width: 24 }} />
        </View>
        <View style={styles.loadingContainer}>
          <Text style={styles.loadingText}>Loading cat profile...</Text>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()}>
          <Icon name="arrow-back" size={24} color={colors.text} />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Edit Cat Profile</Text>
        <TouchableOpacity onPress={handleSave}>
          <Text style={styles.saveButton}>Save</Text>
        </TouchableOpacity>
      </View>

      <ScrollView style={styles.scrollView} showsVerticalScrollIndicator={false}>
        <View style={styles.content}>
          
          {/* Profile Picture */}
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Profile Picture</Text>
            <TouchableOpacity style={styles.imageContainer} onPress={handleImagePicker}>
              <View style={styles.imageWrapper}>
                {profileImageUri ? (
                  <Image source={{ uri: profileImageUri }} style={styles.profileImage} />
                ) : (
                  <View style={styles.placeholderImage}>
                    <Icon name="camera" size={40} color={colors.textLight} />
                  </View>
                )}
                <View style={styles.editImageOverlay}>
                  <Icon name="pencil" size={16} color={colors.white} />
                </View>
              </View>
            </TouchableOpacity>
          </View>

          {/* Basic Information */}
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Basic Information</Text>
            
            <View style={styles.inputGroup}>
              <Text style={styles.inputLabel}>Name</Text>
              <TextInput
                style={styles.textInput}
                value={formData.name}
                onChangeText={(text) => setFormData(prev => ({ ...prev, name: text }))}
                placeholder="Enter cat's name"
                placeholderTextColor={colors.textLight}
              />
            </View>

            <View style={styles.inputGroup}>
              <Text style={styles.inputLabel}>Breed</Text>
              <TextInput
                style={styles.textInput}
                value={formData.breed}
                onChangeText={(text) => setFormData(prev => ({ ...prev, breed: text }))}
                placeholder="Enter cat's breed"
                placeholderTextColor={colors.textLight}
              />
            </View>

            <View style={styles.inputGroup}>
              <Text style={styles.inputLabel}>Date of Birth</Text>
              <TouchableOpacity 
                style={styles.dateInput}
                onPress={() => setShowDatePicker(true)}
              >
                <Text style={styles.dateText}>
                  {formData.dateOfBirth.toLocaleDateString()}
                </Text>
                <Icon name="calendar" size={20} color={colors.textLight} />
              </TouchableOpacity>
              
              {showDatePicker && (
                <DateTimePicker
                  value={formData.dateOfBirth}
                  mode="date"
                  display="default"
                  onChange={handleDateChange}
                  maximumDate={new Date()}
                />
              )}
              
              <View style={styles.ageDisplay}>
                <Icon name="time" size={16} color={colors.primary} />
                <Text style={styles.ageText}>Age: {calculateAge(formData.dateOfBirth)}</Text>
              </View>
            </View>

            {/* Location Section - Modified to look like a text box with GPS icon */}
            <View style={styles.inputGroup}>
              <Text style={styles.inputLabel}>Location</Text>
              <View style={styles.locationInputContainer}>
                <TextInput
                  style={styles.locationInput}
                  placeholder="Cat's location"
                  placeholderTextColor={colors.textLight}
                  value={formData.location.address || ''}
                  editable={false}
                />
                <TouchableOpacity 
                  style={styles.locationButton}
                  onPress={getCurrentLocation}
                  disabled={locationLoading}
                >
                  <Icon 
                    name={locationLoading ? "refresh" : "location"} 
                    size={20} 
                    color={colors.primary} 
                  />
                </TouchableOpacity>
              </View>
              <Text style={styles.locationDescription}>Tap the GPS icon to get your current location</Text>
            </View>
          </View>

          {/* Description - Moved up from lower position */}
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Description</Text>
            <Text style={styles.sectionSubtitle}>Tell others about your cat</Text>
            
            <TextInput
              style={styles.textArea}
              value={formData.description}
              onChangeText={(text) => setFormData(prev => ({ ...prev, description: text }))}
              placeholder="Describe your cat's personality, habits, and what makes them special..."
              placeholderTextColor={colors.textLight}
              multiline
              textAlignVertical="top"
            />
          </View>

          {/* Vaccination Records - Moved up from lower position */}
          <View style={styles.section}>
            <View style={styles.sectionHeader}>
              <Icon name="medical" size={20} color={colors.primary} />
              <Text style={styles.sectionTitle}>Health & Vaccinations</Text>
            </View>
            <Text style={styles.sectionSubtitle}>Keep your cat's vaccination records up to date</Text>
            
            {/* Vaccination Information */}
            <View style={styles.vaccinationInfoContainer}>
              <Text style={styles.vaccinationInfoText}>
                Current vaccines: <Text style={styles.vaccineList}>
                  {Object.entries(formData.vaccinations)
                    .filter(([_, isVaccinated]) => isVaccinated)
                    .map(([vaccine]) => vaccine.charAt(0).toUpperCase() + vaccine.slice(1))
                    .join(', ') || formData.vaccinationType || 'None'}
                </Text>
              </Text>
            </View>
            
            <TouchableOpacity 
              style={[buttonStyles.primary, styles.updateVaccinationButton]}
              onPress={handleUpdateVaccination}
            >
              <Icon name="medical" size={20} color={colors.white} />
              <Text style={buttonStyles.primaryText}>Update Vaccination Records</Text>
            </TouchableOpacity>
          </View>
        </View>
      </ScrollView>

      <BottomNavigation />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background,
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
    fontSize: 20,
    fontWeight: '600',
    color: colors.text,
  },
  saveButton: {
    fontSize: 16,
    fontWeight: '600',
    color: colors.primary,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  loadingText: {
    fontSize: 18,
    color: colors.textLight,
  },
  scrollView: {
    flex: 1,
  },
  content: {
    paddingHorizontal: 20,
    paddingVertical: 20,
    paddingBottom: 100,
  },
  section: {
    marginBottom: 32,
  },
  sectionHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 8,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: colors.text,
    marginLeft: 8,
    flex: 1,
  },
  sectionSubtitle: {
    fontSize: 14,
    color: colors.textLight,
    marginBottom: 16,
  },
  imageContainer: {
    alignItems: 'center',
    marginBottom: 16,
  },
  imageWrapper: {
    position: 'relative',
  },
  profileImage: {
    width: 120,
    height: 120,
    borderRadius: 60,
  },
  placeholderImage: {
    width: 120,
    height: 120,
    borderRadius: 60,
    backgroundColor: colors.backgroundAlt,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 2,
    borderColor: colors.border,
    borderStyle: 'dashed',
  },
  editImageOverlay: {
    position: 'absolute',
    bottom: 0,
    right: 0,
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: colors.primary,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 3,
    borderColor: colors.white,
  },
  inputGroup: {
    marginBottom: 20,
  },
  inputLabel: {
    fontSize: 16,
    fontWeight: '500',
    color: colors.text,
    marginBottom: 8,
  },
  textInput: {
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: 12,
    paddingHorizontal: 16,
    paddingVertical: 12,
    fontSize: 16,
    color: colors.text,
    backgroundColor: colors.white,
  },
  dateInput: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: 12,
    paddingHorizontal: 16,
    paddingVertical: 12,
    backgroundColor: colors.white,
  },
  dateText: {
    fontSize: 16,
    color: colors.text,
  },
  ageDisplay: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 8,
    paddingHorizontal: 16,
    paddingVertical: 8,
    backgroundColor: colors.secondary,
    borderRadius: 8,
    alignSelf: 'flex-start',
  },
  ageText: {
    fontSize: 14,
    fontWeight: '500',
    color: colors.primary,
    marginLeft: 6,
  },
  // Modified location styles to look like a text box with GPS icon
  locationInputContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.backgroundAlt,
    borderColor: colors.border,
    borderWidth: 1,
    borderRadius: 12,
    marginBottom: 8,
  },
  locationInput: {
    flex: 1,
    paddingVertical: 16,
    paddingHorizontal: 16,
    fontSize: 16,
    color: colors.text,
    backgroundColor: 'transparent',
  },
  locationButton: {
    paddingHorizontal: 16,
    paddingVertical: 16,
  },
  locationDescription: {
    fontSize: 12,
    color: colors.textLight,
    textAlign: 'center',
  },
  personalityGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 12,
  },
  personalityChip: {
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderRadius: 20,
    borderWidth: 1,
    borderColor: colors.border,
    backgroundColor: colors.white,
  },
  selectedPersonalityChip: {
    backgroundColor: colors.primary,
    borderColor: colors.primary,
  },
  personalityText: {
    fontSize: 14,
    fontWeight: '500',
    color: colors.text,
  },
  selectedPersonalityText: {
    color: colors.white,
  },
  searchingOptions: {
    gap: 12,
  },
  searchingOption: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: colors.border,
    backgroundColor: colors.white,
  },
  selectedSearchingOption: {
    backgroundColor: colors.primary,
    borderColor: colors.primary,
  },
  searchingOptionText: {
    fontSize: 14,
    fontWeight: '500',
    color: colors.text,
    marginLeft: 12,
  },
  selectedSearchingOptionText: {
    color: colors.white,
  },
  textArea: {
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: 12,
    paddingHorizontal: 16,
    paddingVertical: 12,
    fontSize: 16,
    color: colors.text,
    backgroundColor: colors.white,
    height: 100,
  },
  vaccinationInfoContainer: {
    backgroundColor: colors.backgroundAlt,
    borderRadius: 12,
    padding: 16,
    marginBottom: 16,
    borderWidth: 1,
    borderColor: colors.border,
  },
  vaccinationInfoText: {
    fontSize: 14,
    color: colors.text,
    marginBottom: 8,
  },
  vaccinationDate: {
    fontWeight: '600',
    color: colors.primary,
  },
  vaccineList: {
    fontWeight: '500',
  },
  expiredText: {
    color: colors.error,
  },
  updateVaccinationButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 12,
  },
  bottomContainer: {
    backgroundColor: colors.white,
    paddingHorizontal: 20,
    paddingVertical: 16,
    borderTopWidth: 1,
    borderTopColor: colors.border,
  },
  saveButtonContainer: {
    marginBottom: 0,
  },
});