import React, { useState } from 'react';
import { View, Text, TouchableOpacity, StyleSheet, ScrollView, Image, Alert, Platform, TextInput } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter, useLocalSearchParams } from 'expo-router';
import DateTimePicker from '@react-native-community/datetimepicker';
import * as DocumentPicker from 'expo-document-picker';
import * as FileSystem from 'expo-file-system/legacy'; // Use legacy API to avoid deprecation
import { supabase } from '../supabase'; // Add Supabase import
import Icon from '../components/Icon';
import { colors, buttonStyles } from '../styles/commonStyles';
import BottomNavigation from '../components/BottomNavigation';
import { sendVaccinationReminder } from '../utils/notificationExamples';

interface VaccinationType {
  id: string;
  name: string;
}

export default function VaccinationUpdateScreen() {
  const router = useRouter();
  const params = useLocalSearchParams();
  
  const [currentStep, setCurrentStep] = useState<'select' | 'upload' | 'submit'>('select');
  const [selectedVaccine, setSelectedVaccine] = useState<VaccinationType>({ id: 'rabies', name: 'Rabies' });
  const [otherVaccineName, setOtherVaccineName] = useState('');
  const [uploadedImage, setUploadedImage] = useState<string | null>(null);
  const [uploadedFileName, setUploadedFileName] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

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

  // Get cat data from params
  const catId = params.catId as string;
  const catName = params.catName as string || 'Your Cat';
  const catBreed = params.catBreed as string || '';
  const catAge = params.catAge as string || '';
  const catImage = params.catImage as string || '';
  const catGender = params.catGender as string || '';
  
  // Parse the cat ID to determine gender table and extract actual ID
  const isFemale = catId?.startsWith('f-');
  const isMale = catId?.startsWith('m-');
  const actualId = catId ? catId.substring(2) : catId; // Remove the 'f-' or 'm-' prefix
  
  // If gender is not provided via params, determine it from the catId
  const determinedGender = catGender || (isFemale ? 'Female' : isMale ? 'Male' : '');

  // Vaccine types
  const vaccineTypes: VaccinationType[] = [
    { id: 'rabies', name: 'Rabies' },
    { id: 'fvrcp', name: 'FVRCP' },
    { id: 'felv', name: 'FeLV' },
    { id: 'other', name: 'Other' }
  ];

  const handleVaccineSelect = (vaccine: VaccinationType) => {
    setSelectedVaccine(vaccine);
    // If selecting "Other", clear the other vaccine name
    if (vaccine.id !== 'other') {
      setOtherVaccineName('');
    }
  };

  const handleDocumentUpload = async () => {
    try {
      const result = await DocumentPicker.getDocumentAsync({
        type: 'application/pdf',
        copyToCacheDirectory: true,
      });

      if (result.canceled === false && result.assets && result.assets[0]) {
        setUploadedImage(result.assets[0].uri);
        // Extract and set the file name
        const fileName = result.assets[0].name || result.assets[0].uri.split('/').pop() || 'document.pdf';
        setUploadedFileName(fileName);
        console.log('Document uploaded:', result.assets[0].uri);
      }
    } catch (error) {
      console.error('Error uploading document:', error);
      Alert.alert('Error', 'Failed to upload document. Please try again.');
    }
  };

  const handleSubmit = async () => {
    setIsSubmitting(true);
    
    try {
      // Get current logged-in user
      const { data: { user }, error: userError } = await supabase.auth.getUser();
      if (userError || !user) {
        Alert.alert('Error', 'You must be logged in to update vaccination records.');
        setIsSubmitting(false);
        return;
      }

      // Upload vaccination document if provided
      let vaccinationUrl = null;
      if (uploadedImage) {
        try {
          // Create a unique file name
          const fileName = `${user.id}/${Date.now()}_vaccination_${catName.replace(/\s+/g, '_')}.pdf`;
          
          // Upload to the vaccination bucket
          vaccinationUrl = await uploadFileFromUri('vaccination', uploadedImage, fileName, 'application/pdf');
        } catch (error) {
          console.error('Vaccination document upload failed:', error);
          Alert.alert('Error', 'Failed to upload vaccination document. Please try again.');
          setIsSubmitting(false);
          return;
        }
      }

      // Prepare vaccination data - using separate columns instead of JSON
      const vaccineName = selectedVaccine.id === 'other' 
        ? otherVaccineName 
        : selectedVaccine.name;

      // Update the cat's vaccination status in the database using separate columns
      // Use the determinedGender parameter to determine which table to update
      let updateError;
      
      if (determinedGender === 'Male') {
        const { error } = await supabase
          .from('male_cats')
          .update({ 
            vaccination_type: vaccineName,
            vaccination_status_url: vaccinationUrl // Store the document URL directly
          })
          .eq('male_cat_id', actualId);
        updateError = error;
      } else if (determinedGender === 'Female') {
        const { error } = await supabase
          .from('female_cats')
          .update({ 
            vaccination_type: vaccineName,
            vaccination_status_url: vaccinationUrl // Store the document URL directly
          })
          .eq('female_cat_id', actualId);
        updateError = error;
      } else {
        // If gender is not specified, try both tables
        const { error: maleError } = await supabase
          .from('male_cats')
          .update({ 
            vaccination_type: vaccineName,
            vaccination_status_url: vaccinationUrl // Store the document URL directly
          })
          .eq('male_cat_id', actualId);
        
        if (maleError) {
          // If that fails, try female_cats table
          const { error: femaleError } = await supabase
            .from('female_cats')
            .update({ 
              vaccination_type: vaccineName,
              vaccination_status_url: vaccinationUrl // Store the document URL directly
            })
            .eq('female_cat_id', actualId);
          
          updateError = femaleError;
        } else {
          updateError = maleError;
        }
      }

      if (updateError) {
        console.error('Database update error:', updateError);
        Alert.alert('Error', `Failed to update vaccination record: ${updateError.message}`);
        setIsSubmitting(false);
        return;
      }

      // Success - Send notification reminder
      const finalVaccineName = selectedVaccine.id === 'other' ? otherVaccineName : selectedVaccine.name;
      const nextDueDate = new Date();
      nextDueDate.setFullYear(nextDueDate.getFullYear() + 1); // Set reminder for 1 year from now
      
      await sendVaccinationReminder(
        catName, 
        finalVaccineName,
        nextDueDate.toLocaleDateString()
      );
      
      setCurrentStep('submit');
    } catch (error) {
      console.error('Unexpected error:', error);
      Alert.alert('Error', 'Something went wrong. Please try again.');
      setIsSubmitting(false);
    }
  };

  const handleBack = () => {
    if (currentStep === 'select') {
      router.back();
    } else if (currentStep === 'upload') {
      setCurrentStep('select');
    } else if (currentStep === 'submit') {
      // Go back to home or cat profile
      router.back();
    }
  };

  const renderSelectStep = () => (
    <View style={styles.stepContainer}>
      <Text style={styles.stepTitle}>Select Vaccination Details</Text>
      <Text style={styles.stepSubtitle}>Please provide vaccination information</Text>

      {/* Cat Profile */}
      <View style={styles.catProfileContainer}>
        {catImage ? (
          <Image source={{ uri: catImage }} style={styles.catImage} />
        ) : null}
        <Text style={styles.catName}>{catName}</Text>
        {catBreed && catAge ? (
          <Text style={styles.catDetails}>{catBreed}, {catAge} years old</Text>
        ) : null}
      </View>

      {/* Vaccine Type Selection */}
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Select Vaccine Type</Text>
        <View style={styles.vaccineTypeContainer}>
          {vaccineTypes.map((vaccine) => (
            <TouchableOpacity
              key={vaccine.id}
              style={[
                styles.vaccineTypeButton,
                selectedVaccine.id === vaccine.id && styles.selectedVaccineTypeButton
              ]}
              onPress={() => handleVaccineSelect(vaccine)}
            >
              <Text style={[
                styles.vaccineTypeText,
                selectedVaccine.id === vaccine.id && styles.selectedVaccineTypeText
              ]}>
                {vaccine.name}
              </Text>
            </TouchableOpacity>
          ))}
        </View>
        
        {selectedVaccine.id === 'other' && (
          <View style={styles.otherVaccineContainer}>
            <Text style={styles.otherVaccineLabel}>Specify Vaccine Type</Text>
            <TextInput
              style={styles.otherVaccineInput}
              placeholder="Enter vaccine type"
              value={otherVaccineName}
              onChangeText={setOtherVaccineName}
            />
          </View>
        )}
      </View>
    </View>
  );

  const renderUploadStep = () => (
    <View style={styles.stepContainer}>
      <Text style={styles.stepTitle}>Upload Certificate</Text>
      <Text style={styles.stepSubtitle}>Please provide proof of vaccination</Text>

      {/* Cat Profile */}
      <View style={styles.catProfileContainer}>
        {catImage ? (
          <Image source={{ uri: catImage }} style={styles.catImage} />
        ) : null}
        <Text style={styles.catName}>{catName}</Text>
        {catBreed && catAge ? (
          <Text style={styles.catDetails}>{catBreed}, {catAge} years old</Text>
        ) : null}
      </View>

      {/* Vaccine Info */}
      <View style={styles.vaccineInfoContainer}>
        <Text style={styles.vaccineInfoText}>
          Vaccine: <Text style={styles.vaccineInfoValue}>{selectedVaccine.id === 'other' && otherVaccineName ? otherVaccineName : selectedVaccine.name}</Text>
        </Text>
      </View>

      {/* Upload Options - Only PDF upload remains */}
      <View style={styles.uploadContainer}>
        {uploadedImage ? (
          <View style={styles.imagePreviewContainer}>
            <Text style={styles.previewTitle}>Preview</Text>
            <Image source={{ uri: uploadedImage }} style={styles.previewImage} />
            {uploadedFileName ? (
              <Text style={styles.fileNameText}>{uploadedFileName}</Text>
            ) : null}
            <TouchableOpacity 
              style={styles.retakeButton}
              onPress={() => {
                setUploadedImage(null);
                setUploadedFileName(null);
              }}
            >
              <Text style={styles.retakeButtonText}>Replace Document</Text>
            </TouchableOpacity>
          </View>
        ) : (
          <>
            <Text style={styles.uploadTitle}>Upload Certificate</Text>
            <View style={styles.uploadOptions}>
              <TouchableOpacity 
                style={[buttonStyles.secondary, styles.uploadOptionButton]}
                onPress={handleDocumentUpload}
              >
                <Icon name="document" size={24} color={colors.text} />
                <Text style={[buttonStyles.secondaryText, styles.uploadOptionText]}>Upload PDF</Text>
              </TouchableOpacity>
            </View>
          </>
        )}
      </View>
    </View>
  );

  const renderSubmitStep = () => (
    <View style={styles.stepContainer}>
      <View style={styles.successContainer}>
        <Icon name="checkmark-circle" size={64} color={colors.success} />
        <Text style={styles.successTitle}>Submission Successful!</Text>
        <Text style={styles.successMessage}>
          Your vaccination record for {catName} has been submitted. Waiting for admin approval.
        </Text>
        
        <View style={styles.pendingStatusContainer}>
          <Text style={styles.pendingStatusText}>
            {catName}'s vaccination update pending admin verification.
          </Text>
        </View>
      </View>
    </View>
  );

  return (
    <View style={styles.pageContainer}>
      <SafeAreaView style={styles.container}>
        {/* Header */}
        <View style={styles.header}>
          <TouchableOpacity style={styles.backButton} onPress={handleBack}>
            <Icon name="arrow-back" size={24} color={colors.text} />
          </TouchableOpacity>
          <Text style={styles.headerTitle}>Update Vaccination</Text>
          <View style={styles.headerSpacer} />
        </View>

        {/* Progress Indicator */}
        <View style={styles.progressContainer}>
          <View style={styles.progressBar}>
            <View style={[
              styles.progressFill,
              { 
                width: currentStep === 'select' ? '33%' : 
                       currentStep === 'upload' ? '66%' : '100%' 
              }
            ]} />
          </View>
          <View style={styles.progressLabels}>
            <Text style={[
              styles.progressLabel,
              currentStep === 'select' && styles.activeProgressLabel
            ]}>
              Vaccine
            </Text>
            <Text style={[
              styles.progressLabel,
              currentStep === 'upload' && styles.activeProgressLabel
            ]}>
              Upload
            </Text>
            <Text style={[
              styles.progressLabel,
              currentStep === 'submit' && styles.activeProgressLabel
            ]}>
              Submit
            </Text>
          </View>
        </View>

        <ScrollView style={styles.scrollView} showsVerticalScrollIndicator={false}>
          {currentStep === 'select' && renderSelectStep()}
          {currentStep === 'upload' && renderUploadStep()}
          {currentStep === 'submit' && renderSubmitStep()}
          
          {/* Action Buttons */}
          <View style={styles.actionContainer}>
            {currentStep === 'select' && (
              <TouchableOpacity
                style={buttonStyles.primary}
                onPress={() => setCurrentStep('upload')}
              >
                <Text style={buttonStyles.primaryText}>Next → Upload Certificate</Text>
              </TouchableOpacity>
            )}
            
            {currentStep === 'upload' && (
              <TouchableOpacity
                style={[buttonStyles.primary, uploadedImage ? {} : styles.disabledButton]}
                onPress={handleSubmit}
                disabled={!uploadedImage || isSubmitting}
              >
                <Text style={buttonStyles.primaryText}>
                  {isSubmitting ? 'Submitting...' : 'Submit for Verification'}
                </Text>
              </TouchableOpacity>
            )}
            
            {currentStep === 'submit' && (
              <TouchableOpacity
                style={buttonStyles.primary}
                onPress={() => router.back()}
              >
                <Text style={buttonStyles.primaryText}>Done</Text>
              </TouchableOpacity>
            )}
          </View>
        </ScrollView>
      </SafeAreaView>
      <BottomNavigation />
    </View>
  );
}

const styles = StyleSheet.create({
  pageContainer: {
    flex: 1,
  },
  container: {
    flex: 1,
    backgroundColor: colors.background,
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
  progressContainer: {
    paddingHorizontal: 20,
    paddingVertical: 16,
    backgroundColor: colors.white,
  },
  progressBar: {
    height: 4,
    backgroundColor: colors.border,
    borderRadius: 2,
    overflow: 'hidden',
    marginBottom: 8,
  },
  progressFill: {
    height: '100%',
    backgroundColor: colors.primary,
    borderRadius: 2,
  },
  progressLabels: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  progressLabel: {
    fontSize: 12,
    color: colors.textLight,
  },
  activeProgressLabel: {
    color: colors.primary,
    fontWeight: '600',
  },
  scrollView: {
    flex: 1,
    backgroundColor: colors.backgroundAlt,
  },
  stepContainer: {
    padding: 20,
    paddingBottom: 20, // Add extra padding at the bottom of each step
  },
  stepTitle: {
    fontSize: 24,
    fontWeight: '700',
    color: colors.text,
    textAlign: 'center',
    marginBottom: 8,
  },
  stepSubtitle: {
    fontSize: 16,
    color: colors.textLight,
    textAlign: 'center',
    marginBottom: 32,
  },
  catProfileContainer: {
    alignItems: 'center',
    marginBottom: 32,
  },
  catImage: {
    width: 100,
    height: 100,
    borderRadius: 50,
    marginBottom: 16,
    borderWidth: 1,
    borderColor: colors.border,
  },
  catName: {
    fontSize: 20,
    fontWeight: '700',
    color: colors.text,
    marginBottom: 4,
  },
  catDetails: {
    fontSize: 16,
    color: colors.textLight,
  },
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
  datePickerContainer: {
    marginBottom: 20,
  },
  dateLabel: {
    fontSize: 16,
    fontWeight: '500',
    color: colors.text,
    marginBottom: 8,
  },
  dateButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: colors.white,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: colors.border,
    paddingHorizontal: 16,
    paddingVertical: 12,
  },
  dateText: {
    fontSize: 16,
    color: colors.text,
  },
  vaccineInfoContainer: {
    backgroundColor: colors.white,
    borderRadius: 16,
    padding: 20,
    borderWidth: 1,
    borderColor: colors.border,
    marginBottom: 32,
  },
  vaccineInfoText: {
    fontSize: 16,
    color: colors.text,
    marginBottom: 8,
  },
  vaccineInfoValue: {
    fontWeight: '600',
    color: colors.primary,
  },
  uploadContainer: {
    alignItems: 'center',
  },
  uploadTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: colors.text,
    marginBottom: 24,
  },
  uploadOptions: {
    flexDirection: 'row',
    gap: 16,
    width: '100%',
  },
  uploadOptionButton: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 16,
  },
  uploadOptionText: {
    marginLeft: 8,
  },
  imagePreviewContainer: {
    width: '100%',
    alignItems: 'center',
  },
  previewTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: colors.text,
    marginBottom: 16,
  },
  previewImage: {
    width: '100%',
    height: 200,
    borderRadius: 16,
    marginBottom: 16,
  },
  retakeButton: {
    paddingHorizontal: 24,
    paddingVertical: 12,
    backgroundColor: colors.secondary,
    borderRadius: 24,
  },
  retakeButtonText: {
    fontSize: 16,
    fontWeight: '500',
    color: colors.primary,
  },
  successContainer: {
    alignItems: 'center',
    paddingVertical: 40,
  },
  successTitle: {
    fontSize: 24,
    fontWeight: '700',
    color: colors.text,
    marginTop: 24,
    marginBottom: 16,
    textAlign: 'center',
  },
  successMessage: {
    fontSize: 16,
    color: colors.text,
    textAlign: 'center',
    lineHeight: 24,
    marginBottom: 32,
  },
  pendingStatusContainer: {
    backgroundColor: colors.backgroundAlt,
    borderRadius: 16,
    padding: 20,
    borderWidth: 1,
    borderColor: colors.border,
  },
  pendingStatusText: {
    fontSize: 16,
    color: colors.text,
    textAlign: 'center',
    fontWeight: '500',
  },
  actionContainer: {
    padding: 20,
    backgroundColor: colors.white,
    borderTopWidth: 1,
    borderTopColor: colors.border,
    paddingBottom: 100, // Add padding to account for bottom navigation
  },
  disabledButton: {
    opacity: 0.5,
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
  fileNameText: {
    fontSize: 16,
    color: colors.text,
    fontWeight: '500',
    marginBottom: 16,
    textAlign: 'center',
  }
});