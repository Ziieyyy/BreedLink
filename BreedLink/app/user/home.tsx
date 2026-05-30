import React, { useState, useEffect } from 'react';
import { View, Text, TouchableOpacity, StyleSheet, Image, ScrollView, ActivityIndicator } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import { colors, buttonStyles } from '../styles/commonStyles';
import Icon from '../components/Icon';
import BottomNavigation from '../components/BottomNavigation';
import { supabase } from '../supabase';

interface PendingMatch {
  id: string;
  name: string;
  breed: string;
  age: number;
  gender: 'male' | 'female';
  image: string;
  catId: number;
}

export default function HomeScreen() {
  const router = useRouter();
  const [userId, setUserId] = useState<string | null>(null);
  const [pendingMatches, setPendingMatches] = useState<PendingMatch[]>([]);
  const [loading, setLoading] = useState(true);

  const navigateToSearchPartner = () => {
    router.push('/search-partner');
  };

  const navigateToDiscover = () => {
    router.push('/discover');
  };

  const navigateToCatManagement = () => {
    router.push('/cat-management');
  };

  // Function to navigate to AI chat bot
  const navigateToAIChat = () => {
    router.push('/ai-chat');
  };

  // Fetch logged-in user
  useEffect(() => {
    const fetchUser = async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (user) {
        setUserId(user.id);
        await fetchPendingMatches(user.id);
      } else {
        setLoading(false);
      }
    };

    fetchUser();
  }, []);

  // Fetch pending match requests
  const fetchPendingMatches = async (currentUserId: string) => {
    try {
      setLoading(true);
      const { data: matches, error } = await supabase
        .from('matchmaking')
        .select(`
          match_id,
          male_cat_id,
          female_cat_id,
          requester_id
        `)
        .eq('receiver_id', currentUserId)
        .eq('status', 'pending')
        .limit(3);

      if (error) {
        console.error('Error fetching matches:', error);
        setLoading(false);
        return;
      }

      const detailedMatches: PendingMatch[] = [];

      for (const match of matches || []) {
        const { data: maleCat } = await supabase
          .from('male_cats')
          .select('name, breed, age, profile_image_url, owner_id')
          .eq('male_cat_id', match.male_cat_id)
          .single();

        const { data: femaleCat } = await supabase
          .from('female_cats')
          .select('name, breed, age, profile_image_url, owner_id')
          .eq('female_cat_id', match.female_cat_id)
          .single();

        const requesterCat = match.requester_id === maleCat?.owner_id ? maleCat : femaleCat;
        const requesterCatId = match.requester_id === maleCat?.owner_id ? match.male_cat_id : match.female_cat_id;
        const requesterGender = match.requester_id === maleCat?.owner_id ? 'male' : 'female';

        if (requesterCat) {
          detailedMatches.push({
            id: match.match_id.toString(),
            name: requesterCat.name,
            breed: requesterCat.breed,
            age: requesterCat.age,
            gender: requesterGender as 'male' | 'female',
            image: requesterCat.profile_image_url,
            catId: requesterCatId,
          });
        }
      }

      setPendingMatches(detailedMatches);
    } catch (err) {
      console.error('Unexpected error:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleViewMatch = (match: PendingMatch) => {
    router.push(`/cat-profile-view?catId=${match.catId}&gender=${match.gender}&matchId=${match.id}`);
  };

  return (
    <View style={styles.mainContainer}>
      {/* Fixed Header Bar */}
      <View style={styles.headerBar}>
        <SafeAreaView style={styles.headerContent}>
          {/* App Logo */}
          <TouchableOpacity style={styles.logoContainer} onPress={() => router.push('/home')}>
            <Image 
              source={require('../assets/logo.png')} 
              style={styles.logoImage}
              resizeMode="contain"
            />
          </TouchableOpacity>

          {/* App Title */}
          <Text style={styles.headerTitle}>BreedLink</Text>

          {/* Profile Icon - Following project specification pattern */}
          <TouchableOpacity 
            style={styles.profileButton}
            onPress={() => router.push('/settings')}
          >
            <View style={styles.profileImageContainer}>
              <Icon name="person-circle" size={32} color={colors.primary} />
            </View>
          </TouchableOpacity>
        </SafeAreaView>
      </View>
      
      {/* Main Content */}
      <SafeAreaView style={styles.container}>
        {/* Scrollable content to accommodate all screen sizes */}
        <ScrollView 
          style={styles.scrollContainer}
          contentContainerStyle={styles.content}
          showsVerticalScrollIndicator={false}
        >
        <View style={styles.dashboardHeader}>
          <Text style={styles.dashboardTitle}>BreedLink Dashboard</Text>
          <Text style={styles.dashboardSubtitle}>Find the perfect match for your feline friend</Text>
        </View>

        <View style={styles.quickActions}>
          <TouchableOpacity
            style={styles.actionCard}
            onPress={navigateToCatManagement}
          >
            <Text style={styles.actionEmoji}>🐱</Text>
            <Text style={styles.actionTitle}>My Cats</Text>
            <Text style={styles.actionDescription}>Manage your cat profiles</Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={styles.actionCard}
            onPress={navigateToDiscover}
          >
            <Text style={styles.actionEmoji}>🔍</Text>
            <Text style={styles.actionTitle}>Discover Matches</Text>
            <Text style={styles.actionDescription}>Find compatible cats nearby</Text>
          </TouchableOpacity>
        </View>

        <TouchableOpacity
          style={styles.searchPartnerCard}
          onPress={navigateToSearchPartner}
        >
          <Text style={styles.searchPartnerEmoji}>💕</Text>
          <Text style={styles.searchPartnerTitle}>Search for Partner</Text>
          <Text style={styles.searchPartnerDescription}>Find the perfect mate for your cat</Text>
        </TouchableOpacity>

        {/* AI Question Box */}
        <TouchableOpacity
          style={styles.searchPartnerCard}
          onPress={navigateToAIChat}
        >
          <Text style={styles.searchPartnerEmoji}>🤖</Text>
          <Text style={styles.searchPartnerTitle}>Ask AI About Cats</Text>
          <Text style={styles.searchPartnerDescription}>Get expert advice on cat care, breeding, and behavior</Text>
        </TouchableOpacity>

        {/* New Match Requests */}
        <View style={styles.matchSection}>
          <View style={styles.matchHeader}>
            <Icon name="heart" size={20} color={colors.primary} />
            <Text style={styles.matchHeaderTitle}>New Match Requests</Text>
          </View>

          {loading ? (
            <View style={styles.loadingContainer}>
              <ActivityIndicator size="small" color={colors.primary} />
            </View>
          ) : pendingMatches.length === 0 ? (
            <View style={styles.emptyMatchContainer}>
              <Text style={styles.emptyMatchText}>No new match requests 🐾</Text>
            </View>
          ) : (
            <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.matchScrollView}>
              {pendingMatches.map(match => (
                <TouchableOpacity
                  key={match.id}
                  style={styles.matchCard}
                  onPress={() => handleViewMatch(match)}
                  activeOpacity={0.7}
                >
                  <Image source={{ uri: match.image }} style={styles.matchImage} />
                  <View style={styles.matchInfo}>
                    <Text style={styles.matchName}>{match.name}</Text>
                    <Text style={styles.matchDetails}>
                      {match.gender === 'male' ? '♂' : '♀'} {match.breed} • {match.age}y
                    </Text>
                  </View>
                </TouchableOpacity>
              ))}
            </ScrollView>
          )}

          {pendingMatches.length > 0 && (
            <TouchableOpacity
              style={styles.viewAllButton}
              onPress={() => router.push('/match-requests')}
            >
              <Text style={styles.viewAllText}>View All Requests</Text>
              <Icon name="chevron-forward" size={16} color={colors.primary} />
            </TouchableOpacity>
          )}
        </View>

        <TouchableOpacity
          style={[buttonStyles.primary, styles.discoverButton]}
          onPress={navigateToDiscover}
        >
          <Text style={buttonStyles.primaryText}>Start Discovering</Text>
        </TouchableOpacity>
      </ScrollView>

        {/* Bottom navigation bar */}
        <BottomNavigation />
      </SafeAreaView>
    </View>
  );
}

const styles = StyleSheet.create({
  mainContainer: {
    flex: 1,
    backgroundColor: colors.background,
  },
  // Fixed Header Bar Styles
  headerBar: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    backgroundColor: colors.white,
    zIndex: 1000,
    elevation: 4,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
  },
  headerContent: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
    paddingVertical: 4,
  },
  logoContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'flex-start',
  },
  logoImage: {
    width: 45,
    height: 45,
  },
  headerCenter: {
    flex: 1,
  },
  logoText: {
    fontSize: 18,
    fontWeight: '700',
    color: colors.primary,
    marginLeft: 8,
  },
  headerTitle: {
    fontSize: 20,
    fontWeight: '600',
    color: colors.text,
    textAlign: 'center',
    flex: 2,
  },
  backgroundLayer: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    zIndex: 1000,
    pointerEvents: 'box-none', // Allow touches to pass through except for the profile button
  },
  container: {
    flex: 1,
    backgroundColor: 'transparent',
  },
  // Profile button styles - Following project specification: top: 32, right: 16, zIndex: 100, size: 32px
  profileButton: {
    padding: 4,
    alignItems: 'flex-end',
  },
  profileImageContainer: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: colors.backgroundAlt,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: colors.border,
  },
  scrollContainer: {
    flex: 1,
  },
  content: {
    paddingHorizontal: 16,
    paddingTop: 100,
    paddingBottom: 100,
    alignItems: 'center',
  },
  dashboardHeader: {
    alignItems: 'center',
    marginBottom: 20,
    marginTop: 5,
  },
  dashboardTitle: {
    fontSize: 24,
    fontWeight: '700',
    color: colors.text,
    textAlign: 'center',
    marginBottom: 8,
  },
  dashboardSubtitle: {
    fontSize: 16,
    color: colors.textLight,
    textAlign: 'center',
  },
  quickActions: {
    flexDirection: 'row',
    gap: 12,
    marginBottom: 16,
    width: '100%',
  },
  actionCard: {
    flex: 1,
    alignItems: 'center',
    paddingVertical: 18,
    paddingHorizontal: 12,
    backgroundColor: colors.white,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: colors.border,
  },
  actionEmoji: {
    fontSize: 32,
    marginBottom: 8,
  },
  actionTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: colors.text,
    marginBottom: 4,
    textAlign: 'center',
  },
  actionDescription: {
    fontSize: 12,
    color: colors.textLight,
    textAlign: 'center',
  },
  discoverButton: {
    width: '100%',
    marginBottom: 20, // Add margin to prevent overlap with bottom navigation
  },
  searchPartnerCard: {
    alignItems: 'center',
    paddingVertical: 18,
    paddingHorizontal: 16,
    marginBottom: 16,
    backgroundColor: colors.white,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: colors.border,
    width: '100%',
  },
  searchPartnerEmoji: {
    fontSize: 32,
    marginBottom: 8,
  },
  searchPartnerTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: colors.text,
    marginBottom: 4,
    textAlign: 'center',
  },
  searchPartnerDescription: {
    fontSize: 12,
    color: colors.textLight,
    textAlign: 'center',
  },
  matchSection: {
    width: '100%',
    backgroundColor: colors.white,
    borderRadius: 16,
    padding: 20,
    borderWidth: 1,
    borderColor: colors.border,
    marginBottom: 20,
  },
  matchHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 16,
  },
  matchHeaderTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: colors.text,
    marginLeft: 8,
  },
  loadingContainer: {
    padding: 20,
    alignItems: 'center',
  },
  emptyMatchContainer: {
    padding: 20,
    alignItems: 'center',
  },
  emptyMatchText: {
    fontSize: 14,
    color: colors.textLight,
    textAlign: 'center',
  },
  matchScrollView: {
    marginBottom: 12,
  },
  matchCard: {
    width: 140,
    marginRight: 12,
    backgroundColor: colors.backgroundAlt,
    borderRadius: 12,
    padding: 12,
    borderWidth: 1,
    borderColor: colors.border,
  },
  matchImage: {
    width: '100%',
    height: 116,
    borderRadius: 8,
    marginBottom: 8,
  },
  matchInfo: {
    alignItems: 'center',
  },
  matchName: {
    fontSize: 14,
    fontWeight: '600',
    color: colors.text,
    textAlign: 'center',
    marginBottom: 4,
  },
  matchDetails: {
    fontSize: 12,
    color: colors.textLight,
    textAlign: 'center',
  },
  viewAllButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 8,
  },
  viewAllText: {
    fontSize: 14,
    fontWeight: '600',
    color: colors.primary,
    marginRight: 4,
  },
  // Add styles for floating chat button
  floatingChatButton: {
    position: 'absolute',
    bottom: 100,
    right: 20,
    width: 60,
    height: 60,
    borderRadius: 30,
    backgroundColor: colors.primary,
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: colors.black,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.3,
    shadowRadius: 4,
    elevation: 5,
    zIndex: 100,
  },
});