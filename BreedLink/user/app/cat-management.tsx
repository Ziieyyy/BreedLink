import React, { useState, useEffect, useCallback } from 'react';
import { View, Text, TouchableOpacity, StyleSheet, ScrollView, Image, Switch, Modal } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import { useFocusEffect } from '@react-navigation/native'; // Added useFocusEffect import
import QRCode from 'react-native-qrcode-svg';
import { supabase } from '../supabase';
import { colors, buttonStyles } from '../styles/commonStyles';
import Icon from '../components/Icon';
import CustomAlert, { AlertType } from '../components/CustomAlert';
import BottomNavigation from '../components/BottomNavigation';

interface ManagedCat {
  id: string;
  name: string;
  breed: string;
  age: string;
  gender: 'Male' | 'Female';
  image: string;
  isActive: boolean;
  searchingFor: 'mate' | 'companion' | 'both' | 'none';
  lastUpdated: string;
  matchesCount: number;
  location?: string; // Added location property
}

export default function CatManagementScreen() {
  const router = useRouter();
  const [cats, setCats] = useState<ManagedCat[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedCat, setSelectedCat] = useState<ManagedCat | null>(null);
  const [showQRCode, setShowQRCode] = useState(false);
  const [alert, setAlert] = useState<{ visible: boolean; type: AlertType; title: string; message: string; showCancelButton?: boolean; onConfirm?: () => void }>({ 
    visible: false, 
    type: 'error', 
    title: '', 
    message: '',
    showCancelButton: false 
  });

  // Fetch cats from Supabase when component mounts and when screen is focused
  useFocusEffect(
    useCallback(() => {
      fetchCats();
    }, [])
  );

  // Added function to fetch cats from Supabase
  const fetchCats = async () => {
    try {
      setLoading(true);
      
      // Get current logged-in user
      const { data: { user }, error: userError } = await supabase.auth.getUser();
      if (userError || !user) {
        setAlert({ visible: true, type: 'error', title: 'Error', message: 'You must be logged in to view your cats.' });
        setLoading(false);
        return;
      }

      const ownerId = user.id;

      // Fetch female cats with location data
      const { data: femaleCats, error: femaleError } = await supabase
        .from('female_cats')
        .select('female_cat_id, name, breed, age, profile_image_url, latitude, longtitude, location_address, active_status')
        .eq('owner_id', ownerId);

      if (femaleError) {
        console.error('Female cats fetch error:', femaleError);
      }

      // Fetch male cats with location data
      const { data: maleCats, error: maleError } = await supabase
        .from('male_cats')
        .select('male_cat_id, name, breed, age, profile_image_url, latitude, longtitude, location_address, active_status')
        .eq('owner_id', ownerId);

      if (maleError) {
        console.error('Male cats fetch error:', maleError);
      }

      // Combine both into one array
      const combinedCats = [
        ...(femaleCats || []).map((cat) => ({
          id: `f-${cat.female_cat_id}`,
          name: cat.name,
          breed: cat.breed,
          age: `${cat.age} years`,
          gender: 'Female' as const,
          image: cat.profile_image_url || 'https://images.unsplash.com/photo-1514888286974-6c03e2ca1dba?w=400&h=400&fit=crop',
          isActive: cat.active_status, // Default to active
          searchingFor: 'both' as const, // Default value
          lastUpdated: 'Just now', // Default value
          matchesCount: 0, // Default value
          location: cat.location_address || 'Location not set' // Added location
        })),
        ...(maleCats || []).map((cat) => ({
          id: `m-${cat.male_cat_id}`,
          name: cat.name,
          breed: cat.breed,
          age: `${cat.age} years`,
          gender: 'Male' as const,
          image: cat.profile_image_url || 'https://images.unsplash.com/photo-1514888286974-6c03e2ca1dba?w=400&h=400&fit=crop',
          isActive: cat.active_status, // Default to active
          searchingFor: 'both' as const, // Default value
          lastUpdated: 'Just now', // Default value
          matchesCount: 0, // Default value
          location: cat.location_address || 'Location not set' // Added location
        })),
      ];

      setCats(combinedCats);
    } catch (error) {
      console.error('Unexpected error:', error);
      setAlert({ visible: true, type: 'error', title: 'Error', message: 'Failed to fetch cats. Please try again.' });
    } finally {
      setLoading(false);
    }
  };

  const handleToggleActive = async (catId: string, newValue: boolean) => {
  const cat = cats.find(c => c.id === catId);
  if (!cat) return;

  const isFemale = catId.startsWith('f-'); // Determine if it's a female or male cat
  const tableName = isFemale ? 'female_cats' : 'male_cats';
  const columnId = isFemale ? 'female_cat_id' : 'male_cat_id';
  const actualId = parseInt(catId.split('-')[1], 10);

  setAlert({
    visible: true,
    type: 'warning',
    title: newValue ? 'Activate Cat Profile' : 'Deactivate Cat Profile',
    message: newValue
      ? `${cat.name} will be visible to other users and can receive matches.`
      : `${cat.name} will be hidden from search and won't receive new matches.`,
    showCancelButton: true,
    onConfirm: async () => {
      try {
        // Update active_status in Supabase
        const { error } = await supabase
          .from(tableName)
          .update({ active_status: newValue, updated_at: new Date().toISOString() })
          .eq(columnId, actualId);

        if (error) {
          console.error('Failed to update cat status:', error);
          setAlert({ visible: true, type: 'error', title: 'Error', message: 'Failed to update cat status. Please try again.' });
          return;
        }

        // Update local state
        setCats(prevCats =>
          prevCats.map(c => (c.id === catId ? { ...c, isActive: newValue } : c))
        );
        setAlert({ ...alert, visible: false });
      } catch (err) {
        console.error('Unexpected error:', err);
        setAlert({ visible: true, type: 'error', title: 'Error', message: 'Failed to update cat status. Please try again.' });
      }
    }
  });
};


  const handleEditCat = (catId: string) => {
    console.log('Edit cat:', catId);
    router.push(`/edit-cat-profile?catId=${catId}`);
  };

  const handleViewProfile = (catId: string) => {
    console.log('View profile:', catId);
    router.push(`/cat-profile?catId=${catId}&isOwner=true`);
  };

  const handleAddNewCat = () => {
    console.log('Add new cat');
    router.push('/create-profile');
  };

  const getSearchingColor = (searchingFor: string): string => {
    switch (searchingFor) {
      case 'mate':
        return '#FF6B6B';
      case 'companion':
        return '#4ECDC4';
      case 'both':
        return colors.primary;
      case 'none':
        return colors.textLight;
      default:
        return colors.textLight;
    }
  };

  const renderCatCard = (cat: ManagedCat) => (
    <View key={cat.id} style={styles.catCard}>
      <TouchableOpacity 
        style={styles.catImageContainer}
        onPress={() => handleViewProfile(cat.id)}
      >
        <Image source={{ uri: cat.image }} style={styles.catImage} />
        {!cat.isActive && <View style={styles.inactiveOverlay} />}
      </TouchableOpacity>

      <View style={styles.catInfo}>
        <View style={styles.catHeader}>
          <View style={styles.catBasicInfo}>
            <Text style={styles.catName}>{cat.name}</Text>
            <Text style={styles.catDetails}>{cat.breed} • {cat.age} • {cat.gender}</Text>
            {cat.location && (
              <Text style={styles.catLocation} numberOfLines={1}>📍 {cat.location}</Text>
            )}
          </View>
          
          <View style={styles.toggleContainer}>
            <Text style={[styles.toggleLabel, { color: cat.isActive ? colors.success : colors.textLight }]}>
              {cat.isActive ? 'Active' : 'Inactive'}
            </Text>
            <Switch
              value={cat.isActive}
              onValueChange={(value) => handleToggleActive(cat.id, value)}
              thumbColor={cat.isActive ? colors.white : colors.backgroundAlt}
              trackColor={{ false: colors.border, true: colors.success }}
            />
          </View>
        </View>

        <View style={styles.actionButtons}>
          <TouchableOpacity
            style={[styles.secondaryButton, styles.actionButton]}
            onPress={() => handleEditCat(cat.id)}
          >
            <Icon name="create" size={16} color={colors.text} />
            <Text style={[styles.secondaryButtonText, styles.actionButtonText]}>Edit</Text>
          </TouchableOpacity>
          
          <TouchableOpacity
            style={[styles.primaryButton, styles.actionButton]}
            onPress={() => handleViewProfile(cat.id)}
          >
            <Icon name="eye" size={16} color={colors.white} />
            <Text style={[styles.primaryButtonText, styles.actionButtonText]}>View</Text>
          </TouchableOpacity>
        </View>
      </View>
    </View>
  );

  return (
    <SafeAreaView style={styles.container}>
      <CustomAlert
        visible={alert.visible}
        type={alert.type}
        title={alert.title}
        message={alert.message}
        showCancelButton={alert.showCancelButton}
        confirmText={alert.showCancelButton ? (alert.type === 'warning' ? 'Confirm' : 'OK') : 'OK'}
        onConfirm={alert.onConfirm || (() => setAlert({ ...alert, visible: false }))}
        onCancel={() => setAlert({ ...alert, visible: false })}
      />
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()}>
          <Icon name="arrow-back" size={24} color={colors.text} />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>My Cats</Text>
        <TouchableOpacity onPress={handleAddNewCat}>
          <Icon name="add" size={24} color={colors.primary} />
        </TouchableOpacity>
      </View>

      <ScrollView style={styles.scrollView} showsVerticalScrollIndicator={false}>
        <View style={styles.content}>
          <View style={styles.summaryCard}>
            <Text style={styles.summaryTitle}>Overview</Text>
            <View style={styles.summaryStats}>
              <View style={styles.summaryItem}>
                <Text style={styles.summaryNumber}>{cats.length}</Text>
                <Text style={styles.summaryLabel}>Total Cats</Text>
              </View>
              <View style={styles.summaryItem}>
                <Text style={styles.summaryNumber}>{cats.filter(c => c.isActive).length}</Text>
                <Text style={styles.summaryLabel}>Active</Text>
              </View>
            </View>
          </View>

          <View style={styles.catsSection}>
            <View style={styles.sectionHeader}>
              <Text style={styles.sectionTitle}>Manage Your Cats</Text>
              <TouchableOpacity style={styles.addButton} onPress={handleAddNewCat}>
                <Icon name="add" size={16} color={colors.white} />
                <Text style={styles.addButtonText}>Add Cat</Text>
              </TouchableOpacity>
            </View>
            
            {loading ? (
              <Text style={styles.loadingText}>Loading your cats...</Text>
            ) : cats.length === 0 ? (
              <Text style={styles.emptyText}>No cats found. Add your first cat!</Text>
            ) : (
              cats.map(renderCatCard)
            )}
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
  scrollView: {
    flex: 1,
  },
  content: {
    paddingHorizontal: 20,
    paddingVertical: 20,
    paddingBottom: 100,
  },
  summaryCard: {
    backgroundColor: colors.white,
    borderRadius: 16,
    padding: 20,
    marginBottom: 24,
    borderWidth: 1,
    borderColor: colors.border,
  },
  summaryTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: colors.text,
    marginBottom: 16,
  },
  summaryStats: {
    flexDirection: 'row',
    justifyContent: 'space-around',
  },
  summaryItem: {
    alignItems: 'center',
  },
  summaryNumber: {
    fontSize: 24,
    fontWeight: '700',
    color: colors.primary,
    marginBottom: 4,
  },
  summaryLabel: {
    fontSize: 14,
    color: colors.textLight,
  },
  catsSection: {
    marginBottom: 20,
  },
  sectionHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 16,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: colors.text,
  },
  addButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.primary,
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 20,
  },
  addButtonText: {
    color: colors.white,
    fontWeight: '500',
    marginLeft: 4,
    fontSize: 14,
  },
  loadingText: {
    textAlign: 'center',
    fontSize: 16,
    color: colors.textLight,
    paddingVertical: 40,
  },
  emptyText: {
    textAlign: 'center',
    fontSize: 16,
    color: colors.textLight,
    paddingVertical: 40,
  },
  catCard: {
    backgroundColor: colors.white,
    borderRadius: 16,
    marginBottom: 16,
    borderWidth: 1,
    borderColor: colors.border,
    overflow: 'hidden',
  },
  catImageContainer: {
    position: 'relative',
  },
  catImage: {
    width: '100%',
    height: 120,
    resizeMode: 'cover',
  },
  inactiveOverlay: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: colors.textLight + '60',
    alignItems: 'center',
    justifyContent: 'center',
  },
  catInfo: {
    padding: 16,
  },
  catHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 12,
  },
  catBasicInfo: {
    flex: 1,
  },
  catName: {
    fontSize: 18,
    fontWeight: '600',
    color: colors.text,
    marginBottom: 4,
  },
  catDetails: {
    fontSize: 14,
    color: colors.textLight,
  },
  catLocation: {
    fontSize: 12,
    color: colors.textLight,
    marginTop: 4,
  },
  toggleContainer: {
    alignItems: 'center',
    gap: 4,
  },
  toggleLabel: {
    fontSize: 12,
    fontWeight: '500',
  },
  actionButtons: {
    flexDirection: 'row',
    gap: 12,
  },
  actionButton: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 12,
  },
  actionButtonText: {
    marginLeft: 6,
    fontSize: 14,
    fontWeight: '500',
  },
  primaryButton: {
    backgroundColor: colors.primary,
    paddingVertical: 16,
    paddingHorizontal: 24,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
  },
  secondaryButton: {
    backgroundColor: colors.secondary,
    paddingVertical: 16,
    paddingHorizontal: 24,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
  },
  primaryButtonText: {
    color: colors.white,
    fontSize: 16,
    fontWeight: '600',
  },
  secondaryButtonText: {
    color: colors.text,
    fontSize: 16,
    fontWeight: '600',
  },
});