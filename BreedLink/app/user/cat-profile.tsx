import React, { useState, useEffect } from 'react';
import { View, Text, TouchableOpacity, StyleSheet, ScrollView, Image, Dimensions, Alert, Linking } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter, useLocalSearchParams } from 'expo-router';
import Icon from '../components/Icon';
import CatProfileMenu from '../components/CatProfileMenu';
import { colors, buttonStyles } from '../styles/commonStyles';
import BottomNavigation from '../components/BottomNavigation';
import { supabase } from '../supabase';
import * as DocumentPicker from 'expo-document-picker';
import * as Sharing from 'expo-sharing';
import { Platform } from 'react-native';

const { width } = Dimensions.get('window');

interface CatData {
  id: string;
  name: string;
  breed: string;
  age: string;
  gender: 'Male' | 'Female';
  personality: string[];
  image: string;
  vaccinations: {
    rabies: boolean;
    fvrcp: boolean;
    deworming: boolean;
  };
  vaccinationType: string | null; // Added vaccinationType field
  vaccinationDocumentUrl: string | null; // Added vaccinationDocumentUrl field
  description: string;
  owner: string;
  isInMatchmaking?: boolean;
  matchmakingStatus?: 'searching' | 'matched' | 'inactive';
  activeForBreeding?: boolean;
  location?: {
    latitude: number | null;
    longitude: number | null;
    address: string | null;
  };
}

const mockCatData: CatData = {
  id: '1',
  name: 'Luna',
  breed: 'Persian',
  age: '2 years',
  gender: 'Female',
  personality: ['Playful', 'Calm', 'Affectionate'],
  image: 'https://images.unsplash.com/photo-1514888286974-6c03e2ca1dba?w=400&h=400&fit=crop',
  vaccinations: {
    rabies: true,
    fvrcp: true,
    deworming: false,
  },
  vaccinationType: 'Rabies', // Added vaccinationType to mock data
  vaccinationDocumentUrl: null, // Added vaccinationDocumentUrl to mock data
  description: 'Beautiful Persian cat looking for a loving companion. Very gentle and loves to play.',
  owner: 'Owner Name', // Updated to match the default value in transformed data
  isInMatchmaking: true,
  matchmakingStatus: 'searching',
  activeForBreeding: true,
  location: {
    latitude: 40.7128,
    longitude: -74.0060,
    address: 'New York, NY'
  }
};

export default function CatProfileScreen() {
  const router = useRouter();
  const params = useLocalSearchParams();
  const [catData, setCatData] = useState<CatData | null>(null);
  const [loading, setLoading] = useState(true);

  const isOwner = params.isOwner === 'true';

  console.log('CatProfileScreen rendered with params:', params);

  // Fetch cat data when component mounts
  useEffect(() => {
    fetchCatData();
  }, []);

  const fetchCatData = async () => {
    try {
      setLoading(true);
      const catId = params.catId as string;
      
      if (!catId) {
        console.error('No cat ID provided');
        // Fallback to mock data
        setCatData(mockCatData);
        setLoading(false);
        return;
      }

      // Parse the cat ID to determine gender table
      const isFemale = catId.startsWith('f-');
      const actualId = catId.substring(2); // Remove the 'f-' or 'm-' prefix
      
      // Fetch from appropriate table
      let catDataFromDB;
      if (isFemale) {
        const { data, error } = await supabase
          .from('female_cats')
          .select('*')
          .eq('female_cat_id', actualId)
          .single();
        
        if (error) {
          console.error('Error fetching female cat:', error);
          // Fallback to mock data
          setCatData(mockCatData);
          setLoading(false);
          return;
        }
        
        catDataFromDB = data;
      } else {
        const { data, error } = await supabase
          .from('male_cats')
          .select('*')
          .eq('male_cat_id', actualId)
          .single();
        
        if (error) {
          console.error('Error fetching male cat:', error);
          // Fallback to mock data
          setCatData(mockCatData);
          setLoading(false);
          return;
        }
        
        catDataFromDB = data;
      }

      // Transform the database data to match our interface
      const transformedCatData: CatData = {
        id: catId,
        name: catDataFromDB.name,
        breed: catDataFromDB.breed,
        age: `${catDataFromDB.age} years`,
        gender: isFemale ? 'Female' : 'Male',
        personality: catDataFromDB.personality || [], // Use personality if available
        image: catDataFromDB.profile_image_url || 'https://images.unsplash.com/photo-1514888286974-6c03e2ca1dba?w=400&h=400&fit=crop',
        vaccinations: {
          rabies: catDataFromDB.rabies_vaccination || false,
          fvrcp: catDataFromDB.fvrcp_vaccination || false,
          deworming: catDataFromDB.deworming_vaccination || false,
        },
        vaccinationType: catDataFromDB.vaccination_type || null, // Added vaccinationType from database
        vaccinationDocumentUrl: catDataFromDB.vaccination_status_url || null, // Added vaccinationDocumentUrl from database
        description: catDataFromDB.health_status || 'No health information provided',
        owner: 'Owner Name', // Default value, will be updated with actual owner name
        isInMatchmaking: catDataFromDB.is_in_matchmaking !== undefined ? catDataFromDB.is_in_matchmaking : true,
        matchmakingStatus: catDataFromDB.matchmaking_status || 'searching',
        activeForBreeding: catDataFromDB.active_for_breeding !== undefined ? catDataFromDB.active_for_breeding : true,
        location: {
          latitude: catDataFromDB.latitude,
          longitude: catDataFromDB.longtitude,
          address: catDataFromDB.location_address || null
        }
      };

      // Always fetch the owner name from the owners table using owner_id
      try {
        const { data: ownerData, error: ownerError } = await supabase
          .from('owners')
          .select('name')
          .eq('id', catDataFromDB.owner_id)
          .single();

        if (!ownerError && ownerData) {
          transformedCatData.owner = ownerData.name;
        }
      } catch (ownerFetchError) {
        console.warn('Could not fetch owner name:', ownerFetchError);
      }

      setCatData(transformedCatData);
    } catch (error) {
      console.error('Unexpected error fetching cat data:', error);
      // Fallback to mock data
      setCatData(mockCatData);
      Alert.alert('Error', 'Failed to load cat profile. Showing sample data.');
    } finally {
      setLoading(false);
    }
  };

  const handleStartChat = () => {
    if (!catData) return;
    console.log('Starting chat with cat:', catData.name);
    router.push(`/chat?catId=${catData.id}&catName=${catData.name}&catImage=${encodeURIComponent(catData.image)}`);
  };

  const handleUpdateVaccination = () => {
    if (!catData) return;
    console.log('Updating vaccination for cat:', catData.name);
    router.push(`/vaccination-update?catId=${catData.id}`);
  };

  const handleCancelMatchmaking = () => {
    if (!catData) return;
    console.log('Canceling matchmaking for cat:', catData.name);
    Alert.alert(
      'Cancel Matchmaking',
      `Are you sure you want to stop searching for a mate for ${catData.name}?`,
      [
        { text: 'No', style: 'cancel' },
        {
          text: 'Yes, Cancel',
          style: 'destructive',
          onPress: () => {
            console.log('Matchmaking cancelled');
            Alert.alert('Success', 'Matchmaking has been cancelled.');
          }
        }
      ]
    );
  };

  const handleActivateMatchmaking = () => {
    if (!catData) return;
    console.log('Activating matchmaking for cat:', catData.name);
    Alert.alert(
      'Start Matchmaking',
      `Would you like to start searching for a mate for ${catData.name}?`,
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Start Search',
          onPress: () => {
            console.log('Matchmaking activated');
            Alert.alert('Success', 'Your cat is now available for matchmaking!');
          }
        }
      ]
    );
  };

  const renderVaccinationBadge = (type: string, isVaccinated: boolean) => {
    return (
      <View style={[styles.badge, isVaccinated ? styles.badgeSuccess : styles.badgeWarning]}>
        <Icon 
          name={isVaccinated ? 'checkmark-circle' : 'alert-circle'} 
          size={16} 
          color={isVaccinated ? colors.success : '#F39C12'} 
        />
        <Text style={[styles.badgeText, { color: isVaccinated ? colors.success : '#F39C12' }]}>
          {type} {isVaccinated ? '✓' : '!'}
        </Text>
      </View>
    );
  };

  // Function to view the PDF
  const viewPDF = () => {
    // Use the vaccination document URL from cat data instead of local state
    if (!catData?.vaccinationDocumentUrl) {
      Alert.alert('No PDF', 'No health records PDF available');
      return;
    }

    // On web, we can open the PDF directly in a new tab
    if (Platform.OS === 'web') {
      window.open(catData.vaccinationDocumentUrl, '_blank');
    } else {
      // On mobile, we use Linking to open the PDF URL
      Linking.openURL(catData.vaccinationDocumentUrl).catch(error => {
        console.error('Error opening PDF:', error);
        Alert.alert('Error', 'Unable to open PDF file. You can try copying the URL and pasting it in your browser.');
      });
    }
  };

  // Show loading state
  if (loading) {
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.loadingContainer}>
          <Text style={styles.loadingText}>Loading cat profile...</Text>
        </View>
      </SafeAreaView>
    );
  }

  // Show error state if no data
  if (!catData) {
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.loadingContainer}>
          <Text style={styles.loadingText}>Failed to load cat profile</Text>
          <TouchableOpacity 
            style={[buttonStyles.primary, styles.retryButton]} 
            onPress={fetchCatData}
          >
            <Text style={buttonStyles.primaryText}>Retry</Text>
          </TouchableOpacity>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.container}>
      {/* Header with back button and title */}
      <View style={styles.topHeader}>
        <TouchableOpacity style={styles.backButton} onPress={() => router.back()}>
          <Icon name="arrow-back" size={24} color={colors.text} />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Cat Profile</Text>
        <View style={styles.headerSpacer} />
      </View>

      <ScrollView style={styles.scrollView} showsVerticalScrollIndicator={false}>
        {/* Large cat image */}
        <View style={styles.imageContainer}>
          <Image source={{ uri: catData.image }} style={styles.catImage} />
        </View>

        {/* Cat info sections */}
        <View style={styles.contentContainer}>
          {/* Name and basic info */}
          <View style={styles.section}>
            <Text style={styles.catName}>{catData.name}</Text>
          </View>

          {/* Breed, Age, and Gender */}
          <View style={styles.infoRow}>
            <View style={styles.infoItem}>
              <Icon name="paw" size={20} color={colors.primary} />
              <Text style={styles.infoLabel}>Breed</Text>
              <Text style={styles.infoValue}>{catData.breed}</Text>
            </View>
            <View style={styles.infoItem}>
              <Icon name="time" size={20} color={colors.primary} />
              <Text style={styles.infoLabel}>Age</Text>
              <Text style={styles.infoValue}>{catData.age}</Text>
            </View>
            <View style={styles.infoItem}>
              <Icon name="male-female" size={20} color={colors.primary} />
              <Text style={styles.infoLabel}>Gender</Text>
              <Text style={styles.infoValue}>{catData.gender}</Text>
            </View>
          </View>

          {/* Location - Added section */}
          {catData.location && catData.location.address && (
            <View style={styles.section}>
              <View style={styles.sectionHeader}>
                <Icon name="location" size={20} color={colors.primary} />
                <Text style={styles.sectionTitle}>Location</Text>
              </View>
              <View style={styles.locationContainer}>
                <Text style={styles.locationText} numberOfLines={1}>
                  📍 {catData.location.address}
                </Text>
              </View>
            </View>
          )}

          {/* Health & Vaccinations - Moved up */}
          <View style={styles.section}>
            <View style={styles.sectionHeader}>
              <Icon name="medical" size={20} color={colors.primary} />
              <Text style={styles.sectionTitle}>Health & Vaccinations</Text>
            </View>
          
            {/* Display vaccination type if available */}
            {catData.vaccinationType && (
              <View style={styles.vaccinationTypeContainer}>
                <Text style={styles.vaccinationTypeLabel}>Vaccination Type:</Text>
                <Text style={styles.vaccinationTypeValue}>{catData.vaccinationType}</Text>
              </View>
            )}
          
            {/* PDF Section - Added below health and vaccination */}
            <View style={styles.pdfSection}>
              <View style={styles.sectionHeader}>
                <Icon name="document" size={20} color={colors.primary} />
                <Text style={styles.sectionTitle}>Health Records (PDF)</Text>
              </View>
              
              <TouchableOpacity style={styles.pdfContentContainer} onPress={viewPDF}>
                {catData?.vaccinationDocumentUrl ? (
                  <View style={styles.pdfContainer}>
                    <Text style={styles.pdfFileName}>
                      {catData.vaccinationDocumentUrl.split('/').pop() || 'health_records.pdf'}
                    </Text>
                  </View>
                ) : (
                  <View style={styles.pdfPlaceholder}>
                    <Icon name="document" size={40} color={colors.textLight} />
                    <Text style={styles.pdfPlaceholderText}>No health records PDF available</Text>
                  </View>
                )}
              </TouchableOpacity>
            </View>
          </View>

          {/* Description - Moved up */}
          <View style={styles.section}>
            <View style={styles.sectionHeader}>
              <Icon name="document-text" size={20} color={colors.primary} />
              <Text style={styles.sectionTitle}>About</Text>
            </View>
            <Text style={styles.description}>
              {catData.description || 'No description provided for this cat.'}
            </Text>
          </View>
        </View>
      </ScrollView>

      {/* Bottom Button - Moved above BottomNavigation to prevent overlap */}
      <View style={styles.bottomContainer}>
        {isOwner ? (
          <TouchableOpacity style={[buttonStyles.secondary, styles.chatButton]} onPress={handleUpdateVaccination}>
            <Icon name="medical" size={20} color={colors.text} />
            <Text style={[buttonStyles.secondaryText, styles.chatButtonText]}>Update Health Records</Text>
          </TouchableOpacity>
        ) : (
          <TouchableOpacity style={[buttonStyles.primary, styles.chatButton]} onPress={handleStartChat}>
            <Icon name="chatbubble" size={20} color={colors.white} />
            <Text style={[buttonStyles.primaryText, styles.chatButtonText]}>Start Chat</Text>
          </TouchableOpacity>
        )}
      </View>

      <BottomNavigation />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background,
  },
  // Added styles for the top header
  topHeader: {
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
  headerSpacer: {
    width: 24, // Same width as back button for alignment
  },
  backButton: {
    padding: 8,
    borderRadius: 20,
    backgroundColor: colors.backgroundAlt,
  },
  scrollView: {
    flex: 1,
  },
  imageContainer: {
    width: '100%',
    height: width * 0.6,
    marginBottom: 20,
    borderRadius: 16,
    overflow: 'hidden',
  },
  catImage: {
    width: '100%',
    height: '100%',
    borderRadius: 16,
  },
  contentContainer: {
    paddingHorizontal: 20,
    paddingBottom: 100,
  },
  section: {
    marginBottom: 24,
  },
  catName: {
    fontSize: 32,
    fontWeight: '700',
    color: colors.text,
    textAlign: 'center',
    marginBottom: 4,
  },
  ownerText: {
    fontSize: 16,
    color: colors.textLight,
    textAlign: 'center',
    marginBottom: 20,
  },
  infoRow: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    marginBottom: 24,
  },
  infoItem: {
    alignItems: 'center',
    flex: 1,
  },
  infoLabel: {
    fontSize: 14,
    color: colors.textLight,
    marginTop: 8,
    marginBottom: 4,
  },
  infoValue: {
    fontSize: 18,
    fontWeight: '600',
    color: colors.text,
  },
  sectionHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 12,
  },
  sectionTitle: {
    fontSize: 20,
    fontWeight: '600',
    color: colors.text,
    marginLeft: 8,
    flex: 1,
  },
  updateButton: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    backgroundColor: colors.secondary,
    borderRadius: 16,
  },
  updateButtonText: {
    fontSize: 14,
    fontWeight: '500',
    color: colors.primary,
  },
  badgeContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 12,
  },
  badge: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 20,
    borderWidth: 1,
  },
  badgeSuccess: {
    backgroundColor: '#E8F5E8',
    borderColor: colors.success,
  },
  badgeWarning: {
    backgroundColor: '#FEF3E2',
    borderColor: '#F39C12',
  },
  badgeText: {
    fontSize: 14,
    fontWeight: '500',
    marginLeft: 6,
  },
  // Added styles for vaccination type display
  vaccinationTypeContainer: {
    backgroundColor: colors.backgroundAlt,
    borderRadius: 12,
    padding: 16,
    marginBottom: 16,
    borderWidth: 1,
    borderColor: colors.border,
  },
  vaccinationTypeLabel: {
    fontSize: 16,
    fontWeight: '600',
    color: colors.text,
    marginBottom: 4,
  },
  vaccinationTypeValue: {
    fontSize: 16,
    color: colors.text,
    fontWeight: '500',
  },
  description: {
    fontSize: 16,
    lineHeight: 24,
    color: colors.text,
  },
  locationContainer: {
    backgroundColor: colors.backgroundAlt,
    borderRadius: 12,
    padding: 16,
    borderWidth: 1,
    borderColor: colors.border,
  },
  locationText: {
    fontSize: 16,
    color: colors.text,
    fontWeight: '500',
  },
  bottomContainer: {
    backgroundColor: colors.white,
    paddingHorizontal: 20,
    paddingVertical: 16,
    borderTopWidth: 1,
    borderTopColor: colors.border,
  },
  chatButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
  },
  chatButtonText: {
    marginLeft: 8,
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
    marginBottom: 20,
  },
  retryButton: {
    minWidth: 120,
  },
  noDataText: {
    fontSize: 14,
    color: colors.textLight,
    fontStyle: 'italic',
  },

  // Added styles for PDF section
  pdfSection: {
    marginTop: 20,
  },
  pdfContentContainer: {
    // Make the touchable area fill the container
  },
  pdfContainer: {
    backgroundColor: colors.backgroundAlt,
    borderRadius: 12,
    padding: 16,
    borderWidth: 1,
    borderColor: colors.border,
  },
  pdfFileName: {
    fontSize: 16,
    color: colors.text,
    fontWeight: '500',
    marginBottom: 0,
    textAlign: 'center',
  },
  pdfPlaceholder: {
    backgroundColor: colors.backgroundAlt,
    borderRadius: 12,
    padding: 24,
    borderWidth: 1,
    borderColor: colors.border,
    alignItems: 'center',
  },
  pdfPlaceholderText: {
    fontSize: 16,
    color: colors.textLight,
    marginTop: 12,
    marginBottom: 0,
    textAlign: 'center',
  },

});
