import React, { useState, useEffect } from 'react';
import { View, Text, TextInput, TouchableOpacity, StyleSheet, ScrollView, KeyboardAvoidingView, Platform, Alert, Image, Switch } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import * as ImagePicker from 'expo-image-picker';
import * as Location from 'expo-location';
import * as FileSystem from 'expo-file-system/legacy'; // Use legacy API to avoid deprecation
import DateTimePicker from '@react-native-community/datetimepicker';
import * as DocumentPicker from 'expo-document-picker';
import { supabase } from '../supabase';
import { colors, buttonStyles } from '../styles/commonStyles';
import Icon from '../components/Icon';
import BottomNavigation from '../components/BottomNavigation';
import CustomAlert from '../components/CustomAlert'; // Added CustomAlert import

// Helper function to decode base64
const decodeBase64 = (base64String: string): Uint8Array => {
  try {
    // Remove data URL prefix if present
    const base64 = base64String.replace(/^data:image\/\w+;base64,/, '');
    
    const binaryString = atob(base64);
    const bytes = new Uint8Array(binaryString.length);
    for (let i = 0; i < binaryString.length; i++) {
      bytes[i] = binaryString.charCodeAt(i);
    }
    return bytes;
  } catch (error) {
    console.error('Error decoding base64:', error);
    throw new Error('Failed to decode base64 image data');
  }
};

// Helper function to upload base64 file to Supabase Storage
const uploadBase64File = async (bucket: string, base64Data: string, fileName: string, contentType: string) => {
  try {
    // Remove data URL prefix if present
    const base64 = base64Data.replace(/^data:image\/\w+;base64,/, '');
    
    // Decode base64 to binary string
    const binaryString = atob(base64);
    
    // Convert binary string to array buffer
    const arrayBuffer = new ArrayBuffer(binaryString.length);
    const uint8Array = new Uint8Array(arrayBuffer);
    for (let i = 0; i < binaryString.length; i++) {
      uint8Array[i] = binaryString.charCodeAt(i);
    }
    
    // Upload to Supabase Storage using the array buffer directly
    const { data, error } = await supabase.storage
      .from(bucket)
      .upload(fileName, uint8Array, {
        contentType: contentType,
        cacheControl: '3600',
        upsert: false
      });

    if (error) {
      throw error;
    }

    // Get public URL
    const { data: { publicUrl } } = await supabase.storage
      .from(bucket)
      .getPublicUrl(fileName);

    return publicUrl;
  } catch (error) {
    console.error('Error uploading file:', error);
    throw error;
  }
};

// Helper function to upload file from URI to Supabase Storage using legacy FileSystem API
const uploadFileFromUri = async (bucket: string, fileUri: string, fileName: string, contentType: string) => {
  try {
    // Read the file as base64 using legacy API
    const fileData = await FileSystem.readAsStringAsync(fileUri, {
      encoding: FileSystem.EncodingType.Base64
    });
    
    // Convert base64 to binary
    const binaryString = atob(fileData);
    const arrayBuffer = new ArrayBuffer(binaryString.length);
    const uint8Array = new Uint8Array(arrayBuffer);
    for (let i = 0; i < binaryString.length; i++) {
      uint8Array[i] = binaryString.charCodeAt(i);
    }
    
    // Upload to Supabase Storage
    const { data, error } = await supabase.storage
      .from(bucket)
      .upload(fileName, uint8Array, {
        contentType: contentType,
        cacheControl: '3600',
        upsert: false
      });

    if (error) {
      throw error;
    }

    // Get public URL
    const { data: { publicUrl } } = await supabase.storage
      .from(bucket)
      .getPublicUrl(fileName);

    return publicUrl;
  } catch (error) {
    console.error('Error uploading file from URI:', error);
    throw error;
  }
};

interface VaccinationType {
  id: string;
  name: string;
}

const catBreeds = [
  'Domestic Shorthair',
  'Persian',
  'Maine Coon',
  'Ragdoll',
  'British Shorthair',
  'Siamese',
  'Bengal',
  'Scottish Fold',
  'Exotic Shorthair',
  'Sphynx'
];

const genders = ['Male', 'Female'];

export default function CreateProfileScreen() {
  const router = useRouter();
  const [step, setStep] = React.useState(1);
  const [formData, setFormData] = React.useState({
    name: '',
    breed: '',
    gender: '',
    dateOfBirth: new Date(), // Changed from age to dateOfBirth
    health: '', // Added health field
    location: {
      latitude: null as number | null,
      longitude: null as number | null,
      address: null as string | null,
    }, // Added location to form data
  });
  
  // Added state for date picker visibility
  const [showDatePicker, setShowDatePicker] = useState(false);
  
  // Added vaccination state
  const [vaccinationData, setVaccinationData] = useState({
    isVaccinated: false,
    selectedVaccine: { id: 'rabies', name: 'Rabies' } as VaccinationType,
    otherVaccineName: '',
    proofImage: null as string | null,
    proofFileName: null as string | null, // Added to store file name
  });
  
  // Added state to store profile image file name
  const [profileImageFileName, setProfileImageFileName] = useState<string | null>(null);
  
  // Added state for custom alert
  const [alertVisible, setAlertVisible] = useState(false);
  const [alertTitle, setAlertTitle] = useState('');
  const [alertMessage, setAlertMessage] = useState('');
  const [alertType, setAlertType] = useState<'success' | 'error' | 'warning' | 'info'>('info');
  
  // Vaccine types
  const vaccineTypes: VaccinationType[] = [
    { id: 'rabies', name: 'Rabies' },
    { id: 'fvrcp', name: 'FVRCP' },
    { id: 'felv', name: 'FeLV' },
    { id: 'other', name: 'Other' }
  ];
  
  // Handle vaccine selection
  const handleVaccineSelect = (vaccine: VaccinationType) => {
    setVaccinationData(prev => ({
      ...prev,
      selectedVaccine: vaccine,
      // If selecting "Other", clear the other vaccine name
      otherVaccineName: vaccine.id !== 'other' ? '' : prev.otherVaccineName
    }));
  };
  
  const [showBreedDropdown, setShowBreedDropdown] = React.useState(false);
  const [showGenderDropdown, setShowGenderDropdown] = React.useState(false);
  const [locationLoading, setLocationLoading] = useState(false); // Added location loading state
  const [profileImageUri, setProfileImageUri] = useState<string | null>(null); // Added profile image state
  const [profileImageBase64, setProfileImageBase64] = useState<string | null>(null); // Added profile image base64 state
  const [uploading, setUploading] = useState(false); // Added uploading state

  // Function to show custom alert
  const showCustomAlert = (title: string, message: string, type: 'success' | 'error' | 'warning' | 'info' = 'info') => {
    setAlertTitle(title);
    setAlertMessage(message);
    setAlertType(type);
    setAlertVisible(true);
  };

  // Function to hide custom alert
  const hideCustomAlert = () => {
    setAlertVisible(false);
  };

  // Get current location when component mounts
  useEffect(() => {
    getCurrentLocation();
  }, []);

  // Added function to handle image picker
  const handleImagePicker = async () => {
    try {
      const permissionResult = await ImagePicker.requestMediaLibraryPermissionsAsync();
      if (permissionResult.granted === false) {
        Alert.alert('Permission Required', 'Permission to access camera roll is required!');
        return;
      }

      Alert.alert(
        'Add Profile Picture',
        'Choose an option',
        [
          {
            text: 'Camera',
            onPress: async () => {
              const cameraPermission = await ImagePicker.requestCameraPermissionsAsync();
              if (cameraPermission.granted) {
                const result = await ImagePicker.launchCameraAsync({
                  mediaTypes: ImagePicker.MediaTypeOptions.Images,
                  allowsEditing: true, // Re-enable editing/cropping
                  aspect: [1, 1],
                  quality: 0.8,
                  base64: true // Enable base64
                });
                if (!result.canceled && result.assets[0]) {
                  setProfileImageUri(result.assets[0].uri);
                  setProfileImageFileName(result.assets[0].fileName || 'captured_image.jpg');
                  if (result.assets[0].base64) {
                    setProfileImageBase64(result.assets[0].base64);
                  }
                }
              }
            }
          },
          {
            text: 'Photo Library',
            onPress: async () => {
              const result = await ImagePicker.launchImageLibraryAsync({
                mediaTypes: ImagePicker.MediaTypeOptions.Images,
                allowsEditing: true, // Re-enable editing/cropping
                aspect: [1, 1],
                quality: 0.8,
                base64: true // Enable base64
              });
              if (!result.canceled && result.assets[0]) {
                setProfileImageUri(result.assets[0].uri);
                setProfileImageFileName(result.assets[0].fileName || 'selected_image.jpg');
                if (result.assets[0].base64) {
                  setProfileImageBase64(result.assets[0].base64);
                }
              }
            }
          },
          { text: 'Cancel', style: 'cancel' }
        ]
      );
    } catch (error) {
      Alert.alert('Error', 'Something went wrong while selecting image');
    }
  };

  // Added function to upload image to Supabase storage
  const uploadImage = async () => {
    try {
      setUploading(true);
      
      // Check if we have base64 data
      if (!profileImageBase64) {
        throw new Error('No image data available');
      }
      
      // Get current logged-in user
      const { data: { user }, error: userError } = await supabase.auth.getUser();
      if (userError || !user) {
        throw new Error('User not found');
      }

      // Create a unique file name
      const fileName = `${user.id}/${Date.now()}_${formData.name.replace(/\s+/g, '_')}.jpg`;
      
      // Use our helper function to upload base64 data to the cat-profile-image bucket
      const publicUrl = await uploadBase64File('cat-profile-image', profileImageBase64, fileName, 'image/jpeg');

      return publicUrl;
    } catch (error) {
      console.error('Error in uploadImage function:', error);
      throw error;
    } finally {
      setUploading(false);
    }
  };

  // Added function to upload vaccination PDF to Supabase storage
  const uploadVaccinationPdf = async () => {
    try {
      setUploading(true);
      
      // Check if we have a vaccination proof image/PDF
      if (!vaccinationData.proofImage) {
        throw new Error('No vaccination document available');
      }
      
      // Get current logged-in user
      const { data: { user }, error: userError } = await supabase.auth.getUser();
      if (userError || !user) {
        throw new Error('User not found');
      }

      // Create a unique file name
      const fileName = `${user.id}/${Date.now()}_vaccination_${formData.name.replace(/\s+/g, '_')}.pdf`;
      
      // Use our helper function to upload file from URI to the vaccination bucket
      const publicUrl = await uploadFileFromUri('vaccination', vaccinationData.proofImage, fileName, 'application/pdf');

      return publicUrl;
    } catch (error) {
      console.error('Error in uploadVaccinationPdf function:', error);
      throw error;
    } finally {
      setUploading(false);
    }
  };

  // Added function to get current device location
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
    } catch (error) {
      console.error('Error getting location:', error);
      Alert.alert('Error', 'Failed to get location. Please try again.');
    } finally {
      setLocationLoading(false);
    }
  };

  // Added function to save cat profile to Supabase
  const saveCatProfile = async () => {
    try {
      // Get current logged-in user
      const { data: { user }, error: userError } = await supabase.auth.getUser();
      if (userError || !user) {
        showCustomAlert('Error', 'You must be logged in to create a cat profile.', 'error');
        return;
      }

      const ownerId = user.id;

      // Validate required fields
      if (!formData.name.trim()) {
        showCustomAlert('Validation Error', 'Please enter your cat\'s name.', 'error');
        return;
      }
      
      // Validate cat name length
      if (formData.name.trim().length < 2) {
        showCustomAlert('Validation Error', 'Cat\'s name must be at least 2 characters long.', 'error');
        return;
      }

      if (!formData.breed) {
        showCustomAlert('Validation Error', 'Please select your cat\'s breed.', 'error');
        return;
      }

      if (!formData.gender) {
        showCustomAlert('Validation Error', 'Please select your cat\'s gender.', 'error');
        return;
      }

      // Validate date of birth
      if (!formData.dateOfBirth) {
        showCustomAlert('Validation Error', 'Please select your cat\'s date of birth.', 'error');
        return;
      }

      // Check if date of birth is not in the future
      const today = new Date();
      if (formData.dateOfBirth > today) {
        showCustomAlert('Validation Error', 'Date of birth cannot be in the future.', 'error');
        return;
      }

      // Calculate age from date of birth
      const age = calculateAge(formData.dateOfBirth);

      // Upload image if selected
      let imageUrl = 'https://images.unsplash.com/photo-1514888286974-6c03e2ca1dba?w=400&h=400&fit=crop'; // Default image
      if (profileImageBase64) {
        try {
          imageUrl = await uploadImage();
        } catch (error) {
          console.error('Image upload failed:', error);
          showCustomAlert('Warning', 'Failed to upload image. Using default image instead.', 'warning');
        }
      }

      // Upload vaccination document if provided
      let vaccinationUrl = null;
      if (vaccinationData.isVaccinated && vaccinationData.proofImage) {
        try {
          vaccinationUrl = await uploadVaccinationPdf();
        } catch (error) {
          console.error('Vaccination document upload failed:', error);
          showCustomAlert('Warning', 'Failed to upload vaccination document.', 'warning');
        }
      }

      // Prepare vaccination data for separate columns
      let vaccinationType = null;
      if (vaccinationData.isVaccinated) {
        // Determine the vaccine name to use
        vaccinationType = vaccinationData.selectedVaccine.id === 'other' 
          ? vaccinationData.otherVaccineName 
          : vaccinationData.selectedVaccine.name;
      }

      // Prepare data for insertion based on gender (with health_status column)
      const catData = {
        name: formData.name.trim(),
        breed: formData.breed,
        age: age,
        owner_id: ownerId,
        latitude: formData.location.latitude,
        longtitude: formData.location.longitude,
        location_address: formData.location.address,
        health_status: formData.health, // Added health_status column
        profile_image_url: imageUrl, // Added profile image URL
        // Vaccination data in separate columns
        is_vaccinated: vaccinationData.isVaccinated,
        vaccination_type: vaccinationType,
        vaccination_status_url: vaccinationUrl || vaccinationData.proofImage  // Using correct column name
      };

      console.log('Attempting to insert cat data:', {
        ...catData,
        gender: formData.gender,
        table: formData.gender === 'Male' ? 'male_cats' : 'female_cats'
      });

      // Insert into appropriate table based on gender
      let insertError;
      let insertData;
      
      if (formData.gender === 'Male') {
        const { data, error } = await supabase
          .from('male_cats')
          .insert([catData])
          .select();
        insertError = error;
        insertData = data;
      } else if (formData.gender === 'Female') {
        const { data, error } = await supabase
          .from('female_cats')
          .insert([catData])
          .select();
        insertError = error;
        insertData = data;
      } else {
        showCustomAlert('Error', 'Invalid cat gender. Please select Male or Female.', 'error');
        return;
      }

      if (insertError) {
        console.error('Insert error:', insertError);
        
        // Handle specific database errors
        if (insertError.code === '23505') {
          showCustomAlert('Duplicate Entry', 'A cat profile with this information already exists.', 'error');
        } else if (insertError.code === '23503') {
          showCustomAlert('Database Error', 'Invalid owner reference. Please make sure you have created your account first.', 'error');
        } else if (insertError.code === '23502') {
          showCustomAlert('Missing Data', 'Some required fields are missing. Please check all fields and try again.', 'error');
        } else if (insertError.message.includes('name')) {
          showCustomAlert('Name Error', 'There was an error saving the cat\'s name. Please try again.', 'error');
        } else {
          showCustomAlert('Database Error', `Failed to create cat profile: ${insertError.message}`, 'error');
        }
        return;
      }
      
      // Verify that data was actually saved
      if (!insertData || insertData.length === 0) {
        showCustomAlert('Error', 'Failed to save cat profile data. Please try again.', 'error');
        return;
      }
      
      // Verify the saved data contains name and critical fields
      const savedRecord = insertData[0];
      if (!savedRecord.name) {
        showCustomAlert('Warning', 'Cat profile created but name may be missing. Please verify the profile.', 'warning');
        return;
      }
      
      console.log('Cat profile saved successfully:', insertData);

      showCustomAlert(
        'Success', 
        `✅ Your cat profile has been created successfully!

Name: ${savedRecord.name}
Breed: ${savedRecord.breed}
Age: ${savedRecord.age} years`, 
        'success'
      );
    } catch (error) {
      console.error('Unexpected error:', error);
      showCustomAlert('Unexpected Error', `Something went wrong: ${error instanceof Error ? error.message : 'Unknown error'}. Please try again.`, 'error');
    }
  };

  const handleNext = () => {
    // Add validation for each step
    if (step === 1) {
      // Validate basic information
      if (!formData.name.trim()) {
        showCustomAlert('Error', 'Please enter your cat\'s name.', 'error');
        return;
      }
      
      if (!formData.breed) {
        showCustomAlert('Error', 'Please select your cat\'s breed.', 'error');
        return;
      }
      
      if (!formData.gender) {
        showCustomAlert('Error', 'Please select your cat\'s gender.', 'error');
        return;
      }
      
      // Validate date of birth
      if (!formData.dateOfBirth) {
        showCustomAlert('Error', 'Please select your cat\'s date of birth.', 'error');
        return;
      }
      
      // Check if date of birth is not in the future
      const today = new Date();
      if (formData.dateOfBirth > today) {
        showCustomAlert('Error', 'Date of birth cannot be in the future.', 'error');
        return;
      }
    } else if (step === 2) {
      // Validate photo upload
      if (!profileImageBase64) {
        showCustomAlert('Error', 'Please upload one picture of your cat.', 'error');
        return;
      }
    } else if (step === 3) {
      // Validate vaccination data if vaccinated
      if (vaccinationData.isVaccinated) {
        // Check if vaccine name is provided (either selected or "other" specified)
        if (vaccinationData.selectedVaccine.id === 'other' && !vaccinationData.otherVaccineName.trim()) {
          showCustomAlert('Error', 'Please specify the vaccine name.', 'error');
          return;
        }
      }
    }
    
    if (step < 3) {
      setStep(step + 1);
    } else {
      // Save profile to database and navigate back
      saveCatProfile();
    }
  };

  const handleBack = () => {
    if (step > 1) {
      setStep(step - 1);
    } else {
      router.back();
    }
  };

  const handleBreedSelect = (breed: string) => {
    setFormData((prev: any) => ({ ...prev, breed }));
    setShowBreedDropdown(false);
  };

  const handleGenderSelect = (gender: string) => {
    setFormData((prev: any) => ({ ...prev, gender }));
    setShowGenderDropdown(false);
  };

  // Added function to handle vaccination image picker - Modified to only allow PDF uploads
  const handleVaccinationImagePicker = async () => {
    try {
      Alert.alert(
        'Upload Vaccine Proof',
        'Choose an option',
        [
          {
            text: 'Documents (PDF)',
            onPress: async () => {
              // Use document picker specifically for PDF files
              try {
                const result = await DocumentPicker.getDocumentAsync({
                  type: 'application/pdf',
                  copyToCacheDirectory: true,
                });
                
                if (result.canceled === false && result.assets && result.assets[0]) {
                  setVaccinationData(prev => ({
                    ...prev,
                    proofImage: result.assets[0].uri,
                    proofFileName: result.assets[0].name || result.assets[0].uri.split('/').pop() || 'vaccination_document.pdf'
                  }));
                }
              } catch (error) {
                console.error('Document picker error:', error);
                Alert.alert('Error', 'Failed to pick document. Please try again.');
              }
            }
          },
          { text: 'Cancel', style: 'cancel' }
        ]
      );
    } catch (error) {
      Alert.alert('Error', 'Something went wrong while selecting document');
    }
  };

  const renderStep = () => {
    switch (step) {
      case 1:
        return (
          <ScrollView 
            style={styles.stepScrollView}
            contentContainerStyle={styles.stepContentContainer}
            showsVerticalScrollIndicator={false}
          >
            <View style={styles.stepContent}>
              <Text style={styles.stepTitle}>Basic Information</Text>
              <Text style={styles.stepDescription}>Tell us about your cat</Text>

              <TextInput
                style={styles.input}
                placeholder="Cat's name"
                placeholderTextColor={colors.textLight}
                value={formData.name}
                onChangeText={(text: string) => setFormData((prev: any) => ({ ...prev, name: text }))}
              />

              {/* Breed Dropdown */}
              <View style={styles.dropdownContainer}>
                <TouchableOpacity
                  style={styles.input}
                  onPress={() => {
                    setShowGenderDropdown(false); // Close gender dropdown if open
                    setShowBreedDropdown(!showBreedDropdown);
                  }}
                >
                  <View style={styles.dropdownContent}>
                    <Text style={[styles.dropdownText, formData.breed ? {} : { color: colors.textLight }]}>
                      {formData.breed || 'Select Breed'}
                    </Text>
                    <Icon name="chevron-down" size={20} color={colors.textLight} />
                  </View>
                </TouchableOpacity>
                
                {showBreedDropdown && (
                  <View style={styles.dropdownMenu}>
                    <ScrollView style={styles.dropdownScroll} nestedScrollEnabled={true}>
                      {catBreeds.map((breed, index) => (
                        <TouchableOpacity
                          key={breed}
                          style={[
                            styles.dropdownOption,
                            index === catBreeds.length - 1 && styles.dropdownOptionLast
                          ]}
                          onPress={() => handleBreedSelect(breed)}
                        >
                          <Text style={styles.dropdownOptionText}>{breed}</Text>
                        </TouchableOpacity>
                      ))}
                    </ScrollView>
                  </View>
                )}
              </View>

              {/* Gender Dropdown */}
              <View style={[styles.dropdownContainer, { zIndex: 999 }]}>
                <TouchableOpacity
                  style={styles.input}
                  onPress={() => {
                    setShowBreedDropdown(false); // Close breed dropdown if open
                    setShowGenderDropdown(!showGenderDropdown);
                  }}
                >
                  <View style={styles.dropdownContent}>
                    <Text style={[styles.dropdownText, formData.gender ? {} : { color: colors.textLight }]}>
                      {formData.gender || 'Select Gender'}
                    </Text>
                    <Icon name="chevron-down" size={20} color={colors.textLight} />
                  </View>
                </TouchableOpacity>
                
                {showGenderDropdown && (
                  <View style={styles.dropdownMenu}>
                    {genders.map((gender, index) => (
                      <TouchableOpacity
                        key={gender}
                        style={[
                          styles.dropdownOption,
                          index === genders.length - 1 && styles.dropdownOptionLast
                        ]}
                        onPress={() => handleGenderSelect(gender)}
                      >
                        <Text style={styles.dropdownOptionText}>{gender}</Text>
                      </TouchableOpacity>
                    ))}
                  </View>
                )}
              </View>

              {/* Date of Birth Picker */}
              <View style={styles.inputGroup}>
                <Text style={styles.inputLabel}>Date of Birth</Text>
                <TouchableOpacity 
                  style={styles.dateButton}
                  onPress={() => setShowDatePicker(true)}
                >
                  <Text style={styles.dateText}>
                    {formData.dateOfBirth ? formData.dateOfBirth.toLocaleDateString() : 'Select Date'}
                  </Text>
                  <Icon name="calendar" size={20} color={colors.textLight} />
                </TouchableOpacity>
                
                {showDatePicker && (
                  <DateTimePicker
                    value={formData.dateOfBirth}
                    mode="date"
                    display="default"
                    maximumDate={new Date()}
                    onChange={(event, selectedDate) => {
                      setShowDatePicker(false);
                      if (selectedDate) {
                        setFormData(prev => ({ ...prev, dateOfBirth: selectedDate }));
                      }
                    }}
                  />
                )}
                
                {/* Display calculated age - matching edit-cat-profile.tsx design */}
                <View style={styles.ageDisplay}>
                  <Icon name="time" size={16} color={colors.primary} />
                  <Text style={styles.ageText}>Age: {calculateAge(formData.dateOfBirth)}</Text>
                </View>
              </View>

              {/* Location Section - Modified to look like a text box with GPS icon */}
              <View style={styles.locationSection}>
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
              
              {/* Next Button - Positioned within the panel content */}
              <View style={styles.panelButtonContainer}>
                <TouchableOpacity
                  style={[buttonStyles.primary, styles.nextButton]}
                  onPress={handleNext}
                  disabled={uploading}
                >
                  <Text style={buttonStyles.primaryText}>
                    {uploading ? 'Uploading...' : 'Next'}
                  </Text>
                </TouchableOpacity>
              </View>
            </View>
          </ScrollView>
        );

      case 2:  // Photo Upload Step
        return (
          <ScrollView 
            style={styles.stepScrollView}
            contentContainerStyle={styles.stepContentContainer}
            showsVerticalScrollIndicator={false}
          >
            <View style={styles.stepContent}>
              <Text style={styles.stepTitle}>Upload Cat Photos</Text>
              <Text style={styles.stepDescription}>Upload your cat's photos</Text>

              {/* Photo Upload Section */}
              <View style={styles.photoSection}>
                <Text style={styles.inputLabel}>Profile Photo</Text>
                <TouchableOpacity style={styles.photoUploadContainer} onPress={handleImagePicker}>
                  {profileImageUri ? (
                    <Image source={{ uri: profileImageUri }} style={styles.profileImage} />
                  ) : (
                    <View style={styles.photoUpload}>
                      <Icon name="camera" size={32} color={colors.textLight} />
                      <Text style={styles.photoUploadText}>Add Photo</Text>
                    </View>
                  )}
                  {uploading && (
                    <View style={styles.uploadingOverlay}>
                      <Text style={styles.uploadingText}>Uploading...</Text>
                    </View>
                  )}
                </TouchableOpacity>
                <Text style={styles.photoDescription}>Tap to add or change photo</Text>
                
                {/* Display selected file name */}
                {profileImageFileName && (
                  <View style={styles.fileNameContainer}>
                    <Text style={styles.fileNameText}>Selected: {profileImageFileName}</Text>
                  </View>
                )}
                
                {!profileImageUri && (
                  <Text style={styles.errorText}>Please upload one picture of your cat.</Text>
                )}
              </View>
              
              {/* Next Button - Positioned within the panel content */}
              <View style={styles.panelButtonContainer}>
                <TouchableOpacity
                  style={[buttonStyles.primary, styles.nextButton]}
                  onPress={handleNext}
                  disabled={uploading}
                >
                  <Text style={buttonStyles.primaryText}>
                    {uploading ? 'Uploading...' : 'Next'}
                  </Text>
                </TouchableOpacity>
              </View>
            </View>
          </ScrollView>
        );
        
      case 3:  // Vaccination Details Step
        return (
          <ScrollView 
            style={styles.stepScrollView}
            contentContainerStyle={styles.stepContentContainer}
            showsVerticalScrollIndicator={false}
          >
            <View style={styles.stepContent}>
              <Text style={styles.stepTitle}>Vaccination Details</Text>
              <Text style={styles.stepDescription}>Add your cat's vaccination information</Text>
              
              {/* Vaccination Toggle */}
              <View style={styles.vaccinationSection}>
                <View style={styles.toggleContainer}>
                  <Text style={styles.toggleLabel}>Has your cat been vaccinated?</Text>
                  <Switch
                    trackColor={{ false: colors.border, true: colors.primary }}
                    thumbColor={vaccinationData.isVaccinated ? colors.white : colors.white}
                    onValueChange={(value) => setVaccinationData(prev => ({ ...prev, isVaccinated: value }))}
                    value={vaccinationData.isVaccinated}
                  />
                </View>
                
                {vaccinationData.isVaccinated && (
                  <>
                    {/* Vaccine Type Selection */}
                    <View style={styles.section}>
                      <Text style={styles.sectionTitle}>Select Vaccine Type</Text>
                      <View style={styles.vaccineTypeContainer}>
                        {vaccineTypes.map((vaccine) => (
                          <TouchableOpacity
                            key={vaccine.id}
                            style={[
                              styles.vaccineTypeButton,
                              vaccinationData.selectedVaccine.id === vaccine.id && styles.selectedVaccineTypeButton
                            ]}
                            onPress={() => handleVaccineSelect(vaccine)}
                          >
                            <Text style={[
                              styles.vaccineTypeText,
                              vaccinationData.selectedVaccine.id === vaccine.id && styles.selectedVaccineTypeText
                            ]}>
                              {vaccine.name}
                            </Text>
                          </TouchableOpacity>
                        ))}
                      </View>
                      
                      {vaccinationData.selectedVaccine.id === 'other' && (
                        <View style={styles.otherVaccineContainer}>
                          <Text style={styles.otherVaccineLabel}>Specify Vaccine Type</Text>
                          <TextInput
                            style={styles.otherVaccineInput}
                            placeholder="Enter vaccine type"
                            value={vaccinationData.otherVaccineName}
                            onChangeText={(text) => setVaccinationData(prev => ({ ...prev, otherVaccineName: text }))}
                          />
                        </View>
                      )}
                    </View>
                    
                    {/* Vaccine Proof Upload - Enhanced Section - Only PDF uploads allowed */}
                    <View style={styles.inputGroup}>
                      <Text style={styles.inputLabel}>Upload Vaccine Documents</Text>
                      <Text style={styles.inputDescription}>Please upload your cat's vaccination certificate (PDF only)</Text>
                      <TouchableOpacity style={styles.photoUploadContainer} onPress={handleVaccinationImagePicker}>
                        {vaccinationData.proofImage ? (
                          // Check if it's a PDF file based on file extension or name
                          vaccinationData.proofFileName && vaccinationData.proofFileName.toLowerCase().endsWith('.pdf') ? (
                            <View style={styles.pdfPreviewContainer}>
                              <Icon name="document" size={48} color={colors.primary} />
                              <Text style={styles.pdfPreviewText}>PDF Document</Text>
                            </View>
                          ) : (
                            <Image source={{ uri: vaccinationData.proofImage }} style={styles.vaccineProofImage} />
                          )
                        ) : (
                          <View style={styles.photoUpload}>
                            <Icon name="document" size={32} color={colors.textLight} />
                            <Text style={styles.photoUploadText}>Upload PDF Document</Text>
                            <Text style={styles.photoUploadSubtext}>Tap to select PDF vaccination certificate</Text>
                          </View>
                        )}
                      </TouchableOpacity>
                      <Text style={styles.photoDescription}>Supported format: PDF only</Text>
                      
                      {/* Display selected file name */}
                      {vaccinationData.proofFileName && (
                        <View style={styles.fileNameContainer}>
                          <Text style={styles.fileNameText}>Selected: {vaccinationData.proofFileName}</Text>
                        </View>
                      )}
                    </View>
                  </>
                )}
              </View>
              
              {/* Create Profile Button - Positioned within the panel content */}
              <View style={styles.panelButtonContainer}>
                <TouchableOpacity
                  style={[buttonStyles.primary, styles.nextButton]}
                  onPress={handleNext}
                  disabled={uploading}
                >
                  <Text style={buttonStyles.primaryText}>
                    {uploading ? 'Uploading...' : 'Create Profile'}
                  </Text>
                </TouchableOpacity>
              </View>
            </View>
          </ScrollView>
        );

      default:
        return null;
    }
  };

  return (
    <SafeAreaView style={styles.container} edges={['bottom']}>
      <View style={{ flex: 1, backgroundColor: colors.background }}>
        <KeyboardAvoidingView 
          style={styles.keyboardView}
          behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
          keyboardVerticalOffset={Platform.OS === 'ios' ? 0 : 100}
        >
          <View style={styles.header}>
            <TouchableOpacity onPress={handleBack}>
              <Icon name="arrow-back" size={24} color={colors.text} />
            </TouchableOpacity>
            <Text style={styles.headerTitle}>Add Cat Profile</Text>
            <View style={{ width: 24 }} />
          </View>

          <View style={styles.progressContainer}>
            <View style={styles.progressBar}>
              <View style={[styles.progressFill, { width: `${(step / 3) * 100}%` }]} />
            </View>
            <Text style={styles.progressText}>Step {step} of 3</Text>
          </View>

          <View style={styles.contentContainer}>
            {renderStep()}
          </View>
        </KeyboardAvoidingView>
      </View>

      <BottomNavigation />
      
      {/* Custom Alert Component */}
      <CustomAlert
        visible={alertVisible}
        type={alertType}
        title={alertTitle}
        message={alertMessage}
        confirmText="OK"
        onConfirm={() => {
          hideCustomAlert();
          if (alertType === 'success') {
            router.back();
          }
        }}
      />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background,
    // Ensure no padding or margin
    padding: 0,
    margin: 0,
  },
  keyboardView: {
    flex: 1,
    // Ensure no padding at the top
    paddingTop: 0,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
    paddingVertical: 16, // As specified in the project requirements
    backgroundColor: colors.white,
    // Increase marginTop to lower the header position more
    marginTop: 20, // Increased from 10px to 20px to make it more lower
    minHeight: 0,
    // Keep the explicit height
    height: 56, // Standard header height (16px top + 24px content + 16px bottom)
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: colors.text,
  },
  progressContainer: {
    paddingHorizontal: 20,
    marginBottom: 20,
    // Ensure no padding at the top
    paddingTop: 0,
    marginTop: 0,
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
  scrollView: {
    flex: 1,
  },
  contentContainer: {
    flex: 1,
    paddingHorizontal: 20,
    paddingBottom: 20,
    // Remove any paddingTop that might cause white space
    paddingTop: 0,
    // No need to adjust for the header since it's now lowered
  },
  stepScrollView: {
    flex: 1,
  },
  stepContentContainer: {
    flexGrow: 1,
    justifyContent: 'flex-start',
    paddingTop: 0,
    paddingBottom: 40,
  },
  stepContent: {
    flex: 1,
  },
  stepTitle: {
    fontSize: 24,
    fontWeight: '700',
    color: colors.text,
    marginBottom: 8,
    textAlign: 'center',
  },
  stepDescription: {
    fontSize: 16,
    color: colors.textLight,
    marginBottom: 32,
    textAlign: 'center',
  },
  input: {
    backgroundColor: colors.backgroundAlt,
    borderColor: colors.border,
    borderWidth: 1,
    borderRadius: 12,
    paddingVertical: 16,
    paddingHorizontal: 16,
    fontSize: 16,
    color: colors.text,
    width: '100%',
    marginBottom: 16,
  },
  inputLabel: {
    fontSize: 16,
    fontWeight: '500',
    color: colors.text,
    marginBottom: 8,
  },
  inputDescription: {
    fontSize: 14,
    color: colors.textLight,
    marginBottom: 16,
    lineHeight: 20,
  },
  textArea: {
    height: 100,
    textAlignVertical: 'top',
  },
  // Photo Upload Styles
  photoSection: {
    marginBottom: 16,
  },
  photoUploadContainer: {
    position: 'relative',
  },
  photoUpload: {
    backgroundColor: colors.backgroundAlt,
    borderWidth: 2,
    borderColor: colors.border,
    borderStyle: 'dashed',
    borderRadius: 12,
    paddingVertical: 40,
    alignItems: 'center',
    justifyContent: 'center',
  },
  profileImage: {
    width: '100%',
    height: 200,
    borderRadius: 12,
    resizeMode: 'cover',
  },
  vaccineProofImage: {
    width: '100%',
    height: 200,
    borderRadius: 12,
    resizeMode: 'contain', // Changed to contain to show full image
  },
  photoUploadText: {
    fontSize: 16,
    color: colors.textLight,
    marginTop: 8,
  },
  photoUploadSubtext: {
    fontSize: 14,
    color: colors.textLight,
    marginTop: 4,
  },
  uploadingOverlay: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
  },
  uploadingText: {
    color: colors.white,
    fontSize: 16,
    fontWeight: '600',
  },
  photoDescription: {
    fontSize: 12,
    color: colors.textLight,
    textAlign: 'center',
    marginTop: 8,
  },
  // New styles for file name display
  fileNameContainer: {
    backgroundColor: colors.backgroundAlt,
    borderRadius: 8,
    padding: 12,
    marginTop: 8,
    borderWidth: 1,
    borderColor: colors.border,
  },
  fileNameText: {
    fontSize: 14,
    color: colors.text,
    fontWeight: '500',
    textAlign: 'center',
  },
  errorText: {
    fontSize: 14,
    color: colors.error,
    textAlign: 'center',
    marginTop: 8,
  },
  buttonContainer: {
    paddingHorizontal: 20,
    paddingVertical: 20,
    backgroundColor: colors.white,
    borderTopWidth: 1,
    borderTopColor: colors.border,
  },
  panelButtonContainer: {
    marginTop: 20,
    marginBottom: 30,
    alignItems: 'center',
  },
  nextButton: {
    width: '100%',
  },
  dropdownContainer: {
    position: 'relative',
    marginBottom: 16,
  },
  dropdownContent: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    width: '100%',
  },
  dropdownText: {
    fontSize: 16,
    color: colors.text,
    flex: 1,
  },
  dropdownMenu: {
    position: 'absolute',
    top: '100%',
    left: 0,
    right: 0,
    backgroundColor: colors.white,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: colors.border,
    zIndex: 1000,
    maxHeight: 200,
    elevation: 3, // for Android shadow
    shadowColor: '#000', // for iOS shadow
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.1,
    shadowRadius: 3,
  },
  dropdownScroll: {
    maxHeight: 200,
  },
  dropdownOption: {
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
  },
  dropdownOptionText: {
    fontSize: 16,
    color: colors.text,
  },
  dropdownOptionLast: {
    borderBottomWidth: 0,
  },
  // Modified location styles to look like a text box with GPS icon
  locationSection: {
    marginBottom: 16,
  },
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
  // Vaccination Styles
  vaccinationSection: {
    marginBottom: 16,
  },
  toggleContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: colors.backgroundAlt,
    borderColor: colors.border,
    borderWidth: 1,
    borderRadius: 12,
    paddingVertical: 16,
    paddingHorizontal: 16,
    marginBottom: 16,
  },
  toggleLabel: {
    fontSize: 16,
    fontWeight: '500',
    color: colors.text,
    flex: 1,
    marginRight: 16,
  },
  inputGroup: {
    marginBottom: 16,
  },
  dateButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: colors.white,
    borderColor: colors.border,
    borderWidth: 1,
    borderRadius: 12,
    paddingHorizontal: 16,
    paddingVertical: 12,
  },
  dateText: {
    fontSize: 16,
    color: colors.text,
  },
  // Added style for age display - matching edit-cat-profile.tsx design
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
  // Vaccine Type Selection Styles
  section: {
    marginBottom: 32,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: colors.text,
    marginBottom: 16,
  },
  vaccineTypeContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 12,
  },
  vaccineTypeButton: {
    paddingHorizontal: 20,
    paddingVertical: 12,
    backgroundColor: colors.backgroundAlt,
    borderRadius: 20,
    borderWidth: 1,
    borderColor: colors.border,
  },
  selectedVaccineTypeButton: {
    backgroundColor: colors.primary,
    borderColor: colors.primary,
  },
  vaccineTypeText: {
    fontSize: 14,
    fontWeight: '500',
    color: colors.text,
  },
  selectedVaccineTypeText: {
    color: colors.white,
  },
  otherVaccineContainer: {
    marginTop: 16,
    width: '100%',
  },
  otherVaccineLabel: {
    fontSize: 16,
    fontWeight: '500',
    color: colors.text,
    marginBottom: 8,
  },
  otherVaccineInput: {
    backgroundColor: colors.white,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: colors.border,
    paddingHorizontal: 16,
    paddingVertical: 12,
    fontSize: 16,
    color: colors.text,
  },
  // New style for PDF preview
  pdfPreviewContainer: {
    backgroundColor: colors.backgroundAlt,
    borderWidth: 2,
    borderColor: colors.border,
    borderStyle: 'dashed',
    borderRadius: 12,
    paddingVertical: 40,
    alignItems: 'center',
    justifyContent: 'center',
    height: 200,
  },
  pdfPreviewText: {
    fontSize: 16,
    color: colors.text,
    marginTop: 8,
    fontWeight: '500',
  },

});

// Helper function to calculate age from date of birth
const calculateAge = (dateOfBirth: Date): number => {
  const today = new Date();
  let age = today.getFullYear() - dateOfBirth.getFullYear();
  const monthDiff = today.getMonth() - dateOfBirth.getMonth();
  
  // If birthday hasn't occurred this year yet, subtract one year
  if (monthDiff < 0 || (monthDiff === 0 && today.getDate() < dateOfBirth.getDate())) {
    age--;
  }
  
  return age;
};
