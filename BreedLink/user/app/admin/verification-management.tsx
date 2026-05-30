import React, { useState, useEffect } from 'react';
import { Text, View, TouchableOpacity, TextInput, StyleSheet, ScrollView, Image, ActivityIndicator } from 'react-native';
import { commonStyles, colors, buttonStyles } from '../../styles/adminStyles';
import { SafeAreaView } from 'react-native-safe-area-context';
import { router } from 'expo-router';
import Icon from '../../components/Icon';
import { supabase } from '../../supabase';

export default function VerificationManagementScreen() {
  const [searchQuery, setSearchQuery] = useState('');
  const [certificates, setCertificates] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchCertificates();
  }, []);

  const fetchCertificates = async () => {
  try {
    setLoading(true);

    // Fetch female cats
    const { data: femaleCats, error: femaleError } = await supabase
      .from('female_cats')
      .select(`
        female_cat_id,
        name,
        breed,
        owner_id,
        vaccination_status_url,
        profile_image_url,
        created_at,
        owner (name)
      `)
      .not('vaccination_status_url', 'is', null)
      .neq('vaccination_status_url', '')
      .not('approval_status', 'is', true)
      .order('created_at', { ascending: false });

    if (femaleError) throw femaleError;

    // Fetch male cats
    const { data: maleCats, error: maleError } = await supabase
      .from('male_cats')
      .select(`
        male_cat_id,
        name,
        breed,
        owner_id,
        vaccination_status_url,
        profile_image_url,
        created_at,
        owner (name)
      `)
      .not('vaccination_status_url', 'is', null)
      .neq('vaccination_status_url', '')
      .not('approval_status', 'is', true)
      .order('created_at', { ascending: false });

    if (maleError) throw maleError;

    // Combine and transform data
    const allCertificates = [
  ...(femaleCats || []).map((cat: any) => ({
    id: cat.female_cat_id,
    catName: cat.name || 'Unnamed',
    breed: cat.breed || 'Unknown',
    ownerName: cat.owner?.name || 'Unknown Owner',
    vaccinationStatusUrl: cat.vaccination_status_url,
    avatar: cat.profile_image_url,
    gender: 'Female',
    createdAt: cat.created_at,
  })),
  ...(maleCats || []).map((cat: any) => ({
    id: cat.male_cat_id,
    catName: cat.name || 'Unnamed',
    breed: cat.breed || 'Unknown',
    ownerName: cat.owner?.name || 'Unknown Owner',
    vaccinationStatusUrl: cat.vaccination_status_url,
    avatar: cat.profile_image_url,
    gender: 'Male',
    createdAt: cat.created_at,
  })),
];

    // Sort globally by date (newest first)
    const sortedCertificates = allCertificates.sort(
      (a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
    );

    setCertificates(sortedCertificates);
  } catch (error) {
    console.error('Error fetching certificates:', error);
  } finally {
    setLoading(false);
  }
};


  const handleBack = () => {
    router.back();
  };

  const handleCertificatePress = (certificate: any) => {
    console.log('Certificate pressed:', certificate.id);
    // Navigate to certificate review screen with certificate data
    router.push({
      pathname: '/admin/certificate-review',
      params: {
        id: certificate.id,
        catName: certificate.catName,
        breed: certificate.breed,
        ownerName: certificate.ownerName,
        vaccinationStatusUrl: certificate.vaccinationStatusUrl,
        avatar: certificate.avatar,
        gender: certificate.gender
      }
    } as any);
  };

  const CertificateItem = ({ certificate }: { certificate: any }) => (
    <TouchableOpacity 
      style={styles.certificateItem}
      onPress={() => handleCertificatePress(certificate)}
    >
      <View style={styles.certificateHeader}>
        <Image source={{ uri: certificate.avatar }} style={styles.catAvatar} />
        <View style={styles.certificateInfo}>
          <Text style={styles.catName}>{certificate.catName}</Text>
          <Text style={styles.catBreed}>{certificate.breed}</Text>
          <Text style={styles.ownerName}>Owner: {certificate.ownerName}</Text>
        </View>
        <Icon name="chevron-forward" size={20} color={colors.textSecondary} />
      </View>
      
      <View style={styles.certificateDetails}>
        <View style={styles.detailRow}>
          <Icon name="document-text" size={16} color={colors.primary} />
          <Text style={styles.detailText}>Health Certificate</Text>
        </View>
      </View>
    </TouchableOpacity>
  );

  const NavItem = ({ icon, label, isActive, onPress }: { icon: string; label: string; isActive?: boolean; onPress: () => void }) => (
    <TouchableOpacity style={styles.navItem} onPress={onPress}>
      <Icon 
        name={icon as any} 
        size={24} 
        color={isActive ? colors.primary : colors.text} 
      />
      <Text style={[styles.navLabel, isActive && styles.navLabelActive]}>{label}</Text>
    </TouchableOpacity>
  );

  return (
    <View style={styles.screenContainer}>
      <SafeAreaView style={styles.safeArea}>
        <View style={styles.header}>
          <View style={styles.headerTop}>
            <TouchableOpacity onPress={handleBack} style={styles.backButton}>
              <Icon name="arrow-back" size={24} color={colors.text} />
            </TouchableOpacity>
          </View>
          <TextInput
            style={commonStyles.searchBar}
            placeholder="Search cat certificates"
            placeholderTextColor={colors.textLight}
            value={searchQuery}
            onChangeText={setSearchQuery}
          />
        </View>

        <ScrollView 
          style={styles.content} 
          contentContainerStyle={styles.scrollContent}
          showsVerticalScrollIndicator={true}
          bounces={true}
        >
          <Text style={styles.pageTitle}>Veterinary Certificates</Text>
          <Text style={styles.pageSubtitle}>Review and approve cat health certificates from veterinarians</Text>

          {loading ? (
            <View style={styles.loadingContainer}>
              <ActivityIndicator size="large" color={colors.primary} />
              <Text style={styles.loadingText}>Loading certificates...</Text>
            </View>
          ) : (
            <View style={styles.certificateList}>
              {certificates.map((certificate) => (
                <CertificateItem key={certificate.id} certificate={certificate} />
              ))}
            </View>
          )}
        </ScrollView>
      </SafeAreaView>

      <View style={styles.bottomNavigation}>
        <NavItem 
          icon="home" 
          label="Home" 
          onPress={() => router.push('/admin/dashboard' as any)} 
        />
        <NavItem 
          icon="people" 
          label="User" 
          onPress={() => router.push('/admin/user-management' as any)} 
        />
        <NavItem 
          icon="settings" 
          label="Settings" 
          onPress={() => router.push('/admin/settings' as any)} 
        />
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  screenContainer: {
    flex: 1,
    backgroundColor: colors.background,
  },
  safeArea: {
    flex: 1,
  },
  header: {
    paddingHorizontal: 20,
    paddingTop: 10,
  },
  headerTop: {
    marginBottom: 16,
  },
  backButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: colors.backgroundAlt,
    alignItems: 'center',
    justifyContent: 'center',
  },
  content: {
    flex: 1,
    paddingHorizontal: 20,
  },
  scrollContent: {
    paddingBottom: 100,
  },
  bottomNavigation: {
    flexDirection: 'row',
    backgroundColor: colors.card,
    paddingVertical: 12,
    paddingHorizontal: 20,
    borderTopWidth: 1,
    borderTopColor: colors.border,
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    boxShadow: '0px -2px 8px rgba(0, 0, 0, 0.1)',
    elevation: 8,
  },
  pageTitle: {
    fontSize: 28,
    fontWeight: '700',
    color: colors.text,
    marginBottom: 8,
  },
  pageSubtitle: {
    fontSize: 16,
    fontWeight: '400',
    color: colors.textSecondary,
    marginBottom: 24,
  },
  certificateList: {
    gap: 16,
    paddingBottom: 20,
  },
  certificateItem: {
    backgroundColor: colors.card,
    borderRadius: 12,
    padding: 16,
    boxShadow: '0px 2px 8px rgba(0, 0, 0, 0.1)',
    elevation: 2,
  },
  certificateHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 16,
  },
  catAvatar: {
    width: 60,
    height: 60,
    borderRadius: 30,
    marginRight: 12,
  },
  certificateInfo: {
    flex: 1,
  },
  catName: {
    fontSize: 18,
    fontWeight: '600',
    color: colors.text,
    marginBottom: 2,
  },
  catBreed: {
    fontSize: 14,
    fontWeight: '500',
    color: colors.primary,
    marginBottom: 2,
  },
  ownerName: {
    fontSize: 14,
    fontWeight: '400',
    color: colors.textSecondary,
  },
  certificateDetails: {
    gap: 8,
  },
  detailRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  detailText: {
    fontSize: 14,
    fontWeight: '400',
    color: colors.text,
  },
  navItem: {
    flex: 1,
    alignItems: 'center',
    paddingVertical: 8,
    gap: 4,
  },
  navLabel: {
    fontSize: 12,
    fontWeight: '500',
    color: colors.textSecondary,
  },
  navLabelActive: {
    color: colors.primary,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingVertical: 40,
  },
  loadingText: {
    marginTop: 10,
    fontSize: 16,
    color: colors.textSecondary,
  },
});