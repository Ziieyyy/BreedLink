import React, { useState, useEffect } from 'react';
import { View, Text, TouchableOpacity, StyleSheet, ScrollView, Image, Dimensions } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter, useLocalSearchParams } from 'expo-router';
import Icon from '../components/Icon';
import CustomAlert, { AlertType } from '../components/CustomAlert';
import { colors, buttonStyles } from '../styles/commonStyles';
import BottomNavigation from '../components/BottomNavigation';
import { supabase } from '../supabase'; // Added Supabase import

const { width } = Dimensions.get('window');

interface CatData {
  id: string;
  name: string;
  breed: string;
  age: string;
  personality: string[];
  image: string;
  vaccinations: {
    rabies: boolean;
    fvrcp: boolean;
    deworming: boolean;
  };
  description: string;
  owner: string;
  isInMatchmaking?: boolean;
  matchmakingStatus?: 'searching' | 'matched' | 'inactive';
  activeForBreeding?: boolean;
  location?: {
    latitude: number | null;
    longitude: number | null;
    address: string | null;
  }; // Added location property
}

// Removed mockCatData as we'll fetch real data

export default function CatProfileScreen() {
  const router = useRouter();
  const params = useLocalSearchParams();
  const [catData, setCatData] = useState<CatData | null>(null);
  const [loading, setLoading] = useState(true);
  const [alert, setAlert] = useState<{ visible: boolean; type: AlertType; title: string; message: string; showCancelButton?: boolean; onConfirm?: () => void }>({ 
    visible: false, 
    type: 'error', 
    title: '', 
    message: '',
    showCancelButton: false 
  });
  
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
        personality: [], // We don't have personality data in DB yet
        image: catDataFromDB.profile_image_url || 'https://images.unsplash.com/photo-1514888286974-6c03e2ca1dba?w=400&h=400&fit=crop',
        vaccinations: {
          rabies: false, // Default values as we don't have vaccination data in DB yet
          fvrcp: false,
          deworming: false,
        },
        description: 'No description provided', // Default as we don't have description in DB yet
        owner: 'Owner Name', // We would need to fetch owner data separately
        isInMatchmaking: true, // Default value
        matchmakingStatus: 'searching', // Default value
        activeForBreeding: true, // Default value
        location: {
          latitude: catDataFromDB.latitude,
          longitude: catDataFromDB.longtitude,
          address: catDataFromDB.location_address || null
        }
      };

      setCatData(transformedCatData);
    } catch (error) {
      console.error('Unexpected error fetching cat data:', error);
      setAlert({ visible: true, type: 'error', title: 'Error', message: 'Failed to load cat profile. Please try again.' });
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
    // In a real app, this would update the database
    setAlert({
      visible: true,
      type: 'warning',
      title: 'Cancel Matchmaking',
      message: `Are you sure you want to stop searching for a mate for ${catData.name}?`,
      showCancelButton: true,
      onConfirm: () => {
        console.log('Matchmaking cancelled');
        setAlert({ visible: true, type: 'success', title: 'Success', message: 'Matchmaking has been cancelled.' });
      }
    });
  };

  const handleActivateMatchmaking = () => {
    if (!catData) return;
    console.log('Activating matchmaking for cat:', catData.name);
    setAlert({
      visible: true,
      type: 'info',
      title: 'Start Matchmaking',
      message: `Would you like to start searching for a mate for ${catData.name}?`,
      showCancelButton: true,
      onConfirm: () => {
        console.log('Matchmaking activated');
        setAlert({ visible: true, type: 'success', title: 'Success', message: 'Your cat is now available for matchmaking!' });
      }
    });
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

  const renderPersonalityChip = (trait: string) => {
    return (
      <View key={trait} style={styles.personalityChip}>
        <Text style={styles.personalityText}>{trait}</Text>
      </View>
    );
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
      <CustomAlert
        visible={alert.visible}
        type={alert.type}
        title={alert.title}
        message={alert.message}
        showCancelButton={alert.showCancelButton}
        confirmText="OK"
        onConfirm={alert.onConfirm || (() => setAlert({ ...alert, visible: false }))}
        onCancel={() => setAlert({ ...alert, visible: false })}
      />
      <ScrollView style={styles.scrollView} showsVerticalScrollIndicator={false}>
        {/* Header with back button */}
        <View style={styles.header}>
          <TouchableOpacity style={styles.backButton} onPress={() => router.back()}>
            <Icon name="arrow-back" size={24} color={colors.text} />
          </TouchableOpacity>
          <TouchableOpacity style={styles.moreButton}>
            <Icon name="ellipsis-horizontal" size={24} color={colors.text} />
          </TouchableOpacity>
        </View>

        {/* Large cat image */}
        <View style={styles.imageContainer}>
          <Image source={{ uri: catData.image }} style={styles.catImage} />
        </View>

        {/* Cat info sections */}
        <View style={styles.contentContainer}>
          {/* Name and basic info */}
          <View style={styles.section}>
            <Text style={styles.catName}>{catData.name}</Text>
            <Text style={styles.ownerText}>Owned by {catData.owner}</Text>
          </View>

          {/* Breed and Age */}
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

          {/* Personality */}
          <View style={styles.section}>
            <View style={styles.sectionHeader}>
              <Icon name="heart" size={20} color={colors.primary} />
              <Text style={styles.sectionTitle}>Personality</Text>
            </View>
            <View style={styles.personalityContainer}>
              {catData.personality.length > 0 ? (
                catData.personality.map(renderPersonalityChip)
              ) : (
                <Text style={styles.noDataText}>No personality traits provided</Text>
              )}
            </View>
          </View>

          {/* Matchmaking Status - Only show for owner */}
          {isOwner && (
            <View style={styles.section}>
              <View style={styles.sectionHeader}>
                <Icon name="heart" size={20} color={colors.primary} />
                <Text style={styles.sectionTitle}>Matchmaking Status</Text>
              </View>
              
              {catData.isInMatchmaking ? (
                <View style={styles.matchmakingContainer}>
                  <View style={[styles.statusBadge, { backgroundColor: colors.success + '20' }]}>
                    <Icon name="search" size={16} color={colors.success} />
                    <Text style={[styles.statusText, { color: colors.success }]}>
                      Actively searching for a mate
                    </Text>
                  </View>
                  <TouchableOpacity
                    style={[buttonStyles.secondary, styles.matchmakingButton]}
                    onPress={handleCancelMatchmaking}
                  >
                    <Icon name="stop-circle" size={16} color={colors.error} />
                    <Text style={[styles.matchmakingButtonText, { color: colors.error }]}>
                      Cancel Matchmaking
                    </Text>
                  </TouchableOpacity>
                </View>
              ) : (
                <View style={styles.matchmakingContainer}>
                  <View style={[styles.statusBadge, { backgroundColor: colors.textLight + '20' }]}>
                    <Icon name="pause-circle" size={16} color={colors.textLight} />
                    <Text style={[styles.statusText, { color: colors.textLight }]}>
                      Not currently searching
                    </Text>
                  </View>
                  <TouchableOpacity
                    style={[buttonStyles.primary, styles.matchmakingButton]}
                    onPress={handleActivateMatchmaking}
                  >
                    <Icon name="heart" size={16} color={colors.white} />
                    <Text style={[styles.matchmakingButtonText, { color: colors.white }]}>
                      Start Matchmaking
                    </Text>
                  </TouchableOpacity>
                </View>
              )}
            </View>
          )}
          <View style={styles.section}>
            <View style={styles.sectionHeader}>
              <Icon name="medical" size={20} color={colors.primary} />
              <Text style={styles.sectionTitle}>Health & Vaccinations</Text>
            </View>
            <View style={styles.badgeContainer}>
              {renderVaccinationBadge('Rabies', catData.vaccinations.rabies)}
              {renderVaccinationBadge('FVRCP', catData.vaccinations.fvrcp)}
              {renderVaccinationBadge('Deworming', catData.vaccinations.deworming)}
            </View>
          </View>

          {/* Description */}
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

// ... existing styles ...
const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background,
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
  scrollView: {
    flex: 1,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
    paddingVertical: 16,
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    zIndex: 10,
  },
  backButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: 'rgba(255, 255, 255, 0.9)',
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  moreButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: 'rgba(255, 255, 255, 0.9)',
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  imageContainer: {
    width: width,
    height: width,
    backgroundColor: colors.backgroundAlt,
  },
  catImage: {
    width: '100%',
    height: '100%',
  },
  contentContainer: {
    padding: 20,
  },
  section: {
    marginBottom: 24,
  },
  catName: {
    fontSize: 28,
    fontWeight: '700',
    color: colors.text,
    marginBottom: 4,
  },
  ownerText: {
    fontSize: 14,
    color: colors.textLight,
    marginBottom: 16,
  },
  infoRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 12,
  },
  infoItem: {
    flex: 1,
    alignItems: 'center',
    padding: 12,
    backgroundColor: colors.backgroundAlt,
    borderRadius: 8,
    marginHorizontal: 4,
  },
  infoLabel: {
    fontSize: 12,
    color: colors.textLight,
    marginBottom: 4,
  },
  infoValue: {
    fontSize: 16,
    fontWeight: '600',
    color: colors.text,
  },
  sectionHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 12,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: colors.text,
    marginLeft: 8,
  },
  badgeContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  badge: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 16,
    gap: 6,
  },
  badgeSuccess: {
    backgroundColor: colors.success + '20',
  },
  badgeWarning: {
    backgroundColor: '#F39C12' + '20',
  },
  badgeText: {
    fontSize: 14,
    fontWeight: '500',
  },
  personalityContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  personalityChip: {
    paddingHorizontal: 16,
    paddingVertical: 8,
    backgroundColor: colors.primary + '20',
    borderRadius: 20,
  },
  personalityText: {
    fontSize: 14,
    color: colors.primary,
    fontWeight: '500',
  },
  matchmakingContainer: {
    padding: 16,
    backgroundColor: colors.backgroundAlt,
    borderRadius: 12,
  },
  statusBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 20,
    alignSelf: 'flex-start',
    marginBottom: 12,
    gap: 6,
  },
  statusText: {
    fontSize: 14,
    fontWeight: '500',
  },
  matchmakingButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
  },
  matchmakingButtonText: {
    fontSize: 16,
    fontWeight: '600',
  },
  description: {
    fontSize: 15,
    color: colors.text,
    lineHeight: 22,
  },
  bottomContainer: {
    padding: 16,
    backgroundColor: colors.white,
    borderTopWidth: 1,
    borderTopColor: colors.border,
  },
  chatButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
  },
  chatButtonText: {
    fontSize: 16,
    fontWeight: '600',
  },
  locationContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  locationText: {
    fontSize: 14,
    color: colors.text,
    flex: 1,
  },
});