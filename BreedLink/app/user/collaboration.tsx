import React from 'react';
import { View, Text, ScrollView, StyleSheet, Linking, TouchableOpacity, Image } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import Icon from '../components/Icon';
import { useRouter } from 'expo-router';

// Custom colors based on the refined design prompt
const COLORS = {
  background: '#FFF9F3',
  cardBackground: '#FFFFFF',
  accent: '#FF8A00',
  gray: '#6B7280',
  darkGray: '#333333',
  paleBlue: '#E0F2F1',
  beige: '#FAFAFA',
  lightYellow: '#FFF8E1',
  divider: '#E5E7EB',
  website: '#2D3748',
  instagram: '#E1306C',
  facebook: '#4267B2',
  tiktok: '#000000',
};

export default function CollaborationPage() {
  const router = useRouter();
  
  const openLink = (url: string) => {
    Linking.openURL(url).catch(() => {
      alert('Unable to open link');
    });
  };

  // Service tags data
  const services = [
    'Health Checkups',
    'Vaccination',
    'Dental',
    'Ultrasound',
    'Laser Therapy',
    'Blood Tests'
  ];

  return (
    <SafeAreaView style={styles.container}>
      {/* Header with Back Button */}
      <View style={styles.headerBar}>
        <TouchableOpacity 
          style={styles.backButton}
          onPress={() => router.back()}
        >
          <Icon name="arrow-back" size={20} color={COLORS.darkGray} />
        </TouchableOpacity>
        <Text style={styles.headerBarTitle}>Collaboration</Text>
        <View style={styles.headerSpacer} />
      </View>
      
      <ScrollView 
        contentContainerStyle={styles.scrollContainer}
        showsVerticalScrollIndicator={false}
      >
        {/* Logo Section */}
        <View style={styles.headerSection}>
          {/* Logos Row */}
          <View style={styles.logosRow}>
            {/* Clinic Logo */}
            <View style={styles.logoContainer}>
              <View style={styles.logoPlaceholder}>
                <Image 
                  source={require('../assets/clinic-logo.png')} 
                  style={styles.logoImage} 
                  resizeMode="contain"
                />
              </View>
            </View>
            
            {/* BreedLink Logo */}
            <View style={styles.logoContainer}>
              <View style={[styles.logoPlaceholder, styles.breedLinkLogo]}>
                <Image 
                  source={require('../assets/logo.png')} 
                  style={styles.logoImage} 
                  resizeMode="contain"
                />
              </View>
            </View>
          </View>
          
          <Text style={styles.headerTitle}>🎉 Recognizing Our Veterinary Partner</Text>
          <Text style={styles.clinicName}>Klinik Haiwan & Surgeri Ipoh Ville</Text>
          <Text style={styles.headerSubtitle}>
            "Ensuring every cat receives the best care — from checkups to breeding support."
          </Text>
        </View>

        {/* Divider */}
        <View style={styles.divider} />

        {/* Information Card */}
        <View style={styles.infoCard}>
          <View style={styles.infoRow}>
            <Icon name="location" size={20} color={COLORS.gray} />
            <Text style={styles.infoText}>
              No. 39 Jalan Ampang Baru 6A, Ampang Baru, 31350 Ipoh, Perak
            </Text>
          </View>
          
          <View style={styles.infoRow}>
            <Icon name="call" size={20} color={COLORS.gray} />
            <Text style={styles.infoText}>+6017-6691132</Text>
          </View>
          
          <View style={styles.infoRow}>
            <Icon name="time" size={20} color={COLORS.gray} />
            <Text style={styles.infoText}>
              Mon–Thu 9 AM–6 PM | Sat 9 AM–4 PM | Sun 9 AM–1 PM | Closed Fri
            </Text>
          </View>
          
          {/* Services Section */}
          <View style={styles.servicesSection}>
            <Text style={styles.servicesTitle}>Services:</Text>
            <View style={styles.servicesContainer}>
              {services.map((service, index) => (
                <View key={index} style={styles.serviceTag}>
                  <Text style={styles.serviceText}>{service}</Text>
                </View>
              ))}
            </View>
          </View>
          
          {/* Highlight Tag */}
          <View style={styles.highlightTag}>
            <Text style={styles.highlightText}>🐱 Cat-Friendly & Responsible Breeding Supporter</Text>
          </View>
        </View>

        {/* Divider */}
        <View style={styles.divider} />

        {/* Social Links Section */}
        <View style={styles.socialSection}>
          <Text style={styles.socialTitle}>Connect with Ipoh Ville Vet</Text>
          
          <View style={styles.socialIcons}>
            <TouchableOpacity 
              style={[styles.socialIcon, { backgroundColor: COLORS.website }]}
              onPress={() => openLink('https://ipohvillevet.carrd.co')}
            >
              <Icon name="globe" size={24} color="#FFFFFF" />
            </TouchableOpacity>
            
            <TouchableOpacity 
              style={[styles.socialIcon, { backgroundColor: COLORS.instagram }]}
              onPress={() => openLink('https://instagram.com/ipohvillevet')}
            >
              <Icon name="logo-instagram" size={24} color="#FFFFFF" />
            </TouchableOpacity>
            
            <TouchableOpacity 
              style={[styles.socialIcon, { backgroundColor: COLORS.facebook }]}
              onPress={() => openLink('https://facebook.com/KlinikHaiwanSurgeriIpohVille')}
            >
              <Icon name="logo-facebook" size={24} color="#FFFFFF" />
            </TouchableOpacity>
            
            <TouchableOpacity 
              style={[styles.socialIcon, { backgroundColor: COLORS.tiktok }]}
              onPress={() => openLink('https://tiktok.com/@ipohvillevet')}
            >
              <Icon name="logo-tiktok" size={24} color="#FFFFFF" />
            </TouchableOpacity>
          </View>
        </View>

        {/* Divider */}
        <View style={styles.divider} />

        {/* Appreciation Note */}
        <View style={styles.appreciationSection}>
          <Text style={styles.appreciationText}>
            ❤️ BreedLink proudly acknowledges Ipoh Ville Vet for their dedication to pet health and ethical breeding.
          </Text>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: COLORS.background,
  },
  headerBar: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 24,
    paddingVertical: 16,
    backgroundColor: COLORS.cardBackground,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.divider,
  },
  backButton: {
    padding: 8,
    borderRadius: 20,
  },
  headerBarTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: COLORS.darkGray,
  },
  headerSpacer: {
    width: 40, // Matches the back button width for centering
  },
  scrollContainer: {
    padding: 24,
    paddingBottom: 40,
  },
  headerSection: {
    alignItems: 'center',
    marginBottom: 24,
  },
  logosRow: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    gap: 30,
    marginBottom: 24,
  },
  logoContainer: {
    alignItems: 'center',
  },
  logoPlaceholder: {
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: COLORS.paleBlue,
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 4,
    },
    shadowOpacity: 0.1,
    shadowRadius: 10,
    elevation: 5,
  },
  breedLinkLogo: {
    backgroundColor: COLORS.beige,
  },
  logoImage: {
    width: 60,
    height: 60,
  },
  headerTitle: {
    fontSize: 22,
    fontWeight: '600',
    color: COLORS.darkGray,
    textAlign: 'center',
    marginBottom: 8,
  },
  clinicName: {
    fontSize: 20,
    fontWeight: '700',
    color: COLORS.accent,
    textAlign: 'center',
    marginBottom: 12,
  },
  headerSubtitle: {
    fontSize: 16,
    color: COLORS.gray,
    textAlign: 'center',
    lineHeight: 24,
  },
  divider: {
    height: 1,
    backgroundColor: COLORS.divider,
    marginVertical: 24,
  },
  infoCard: {
    backgroundColor: COLORS.cardBackground,
    borderRadius: 20,
    padding: 20,
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.05,
    shadowRadius: 8,
    elevation: 3,
    marginBottom: 24,
  },
  infoRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    marginBottom: 16,
  },
  infoText: {
    fontSize: 16,
    color: COLORS.darkGray,
    marginLeft: 12,
    flex: 1,
    lineHeight: 22,
  },
  servicesSection: {
    marginTop: 20,
  },
  servicesTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: COLORS.darkGray,
    marginBottom: 12,
  },
  servicesContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  serviceTag: {
    backgroundColor: COLORS.beige,
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 20,
  },
  serviceText: {
    fontSize: 14,
    color: COLORS.darkGray,
    fontWeight: '500',
  },
  highlightTag: {
    backgroundColor: COLORS.lightYellow,
    borderRadius: 20,
    paddingVertical: 12,
    paddingHorizontal: 16,
    marginTop: 20,
    borderWidth: 1,
    borderColor: '#FFECB3',
  },
  highlightText: {
    fontSize: 14,
    color: '#333',
    fontWeight: '500',
    textAlign: 'center',
  },
  socialSection: {
    alignItems: 'center',
    marginBottom: 24,
  },
  socialTitle: {
    fontSize: 16,
    color: COLORS.gray,
    marginBottom: 20,
  },
  socialIcons: {
    flexDirection: 'row',
    justifyContent: 'center',
    gap: 20,
  },
  socialIcon: {
    width: 50,
    height: 50,
    borderRadius: 25,
    justifyContent: 'center',
    alignItems: 'center',
  },
  appreciationSection: {
    backgroundColor: COLORS.beige,
    paddingVertical: 20,
    paddingHorizontal: 24,
    borderRadius: 12,
    marginBottom: 24,
  },
  appreciationText: {
    fontSize: 16,
    color: COLORS.darkGray,
    textAlign: 'center',
    fontWeight: '500',
    lineHeight: 24,
  },
});