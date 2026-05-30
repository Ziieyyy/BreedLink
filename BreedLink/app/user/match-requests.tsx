import React, { useState, useEffect } from 'react';
import { View, Text, TouchableOpacity, StyleSheet, ScrollView, Image, ActivityIndicator, RefreshControl } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import { colors } from '../styles/commonStyles';
import Icon from '../components/Icon';
import { supabase } from '../supabase';
import BottomNavigation from '../components/BottomNavigation';

interface PendingMatch {
  id: string;
  name: string;
  breed: string;
  age: number;
  gender: 'male' | 'female';
  image: string;
  catId: number;
  owner: string;
  description: string;
}

export default function MatchRequestsScreen() {
  const router = useRouter();
  const [userId, setUserId] = useState<string | null>(null);
  const [pendingMatches, setPendingMatches] = useState<PendingMatch[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

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

  const fetchPendingMatches = async (currentUserId: string) => {
    try {
      setLoading(true);
      const { data: matches, error } = await supabase
        .from('matchmaking')
        .select(`
          match_id,
          male_cat_id,
          female_cat_id,
          requester_id,
          receiver_id
        `)
        .eq('receiver_id', currentUserId)
        .eq('status', 'pending')
        .order('created_at', { ascending: false });

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
        const receiverCat = match.requester_id === maleCat?.owner_id ? femaleCat : maleCat;
        const requesterCatId = match.requester_id === maleCat?.owner_id ? match.male_cat_id : match.female_cat_id;
        const requesterGender = match.requester_id === maleCat?.owner_id ? 'male' : 'female';

        let catOwner = 'Unknown Owner';
        if (requesterCat?.owner_id) {
          const { data: owner } = await supabase
            .from('owner')
            .select('name')
            .eq('owner_id', requesterCat.owner_id)
            .single();
          catOwner = owner?.name || 'Unknown Owner';
        }

        if (requesterCat && receiverCat) {
          detailedMatches.push({
            id: match.match_id.toString(),
            name: requesterCat.name,
            breed: requesterCat.breed,
            age: requesterCat.age,
            gender: requesterGender as 'male' | 'female',
            image: requesterCat.profile_image_url,
            catId: requesterCatId,
            owner: catOwner,
            description: `${requesterCat.name} is interested in matching with your cat ${receiverCat.name}.`,
          });
        }
      }

      setPendingMatches(detailedMatches);
    } catch (err) {
      console.error('Unexpected error:', err);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  const onRefresh = async () => {
    if (userId) {
      setRefreshing(true);
      await fetchPendingMatches(userId);
    }
  };

  const handleViewMatch = (match: PendingMatch) => {
    router.push(`/cat-profile-view?catId=${match.catId}&gender=${match.gender}&matchId=${match.id}`);
  };

  if (loading) {
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.header}>
          <TouchableOpacity onPress={() => router.back()}>
            <Icon name="arrow-back" size={24} color={colors.text} />
          </TouchableOpacity>
          <Text style={styles.headerTitle}>Match Requests</Text>
          <View style={{ width: 24 }} />
        </View>
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color={colors.primary} />
          <Text style={styles.loadingText}>Loading match requests...</Text>
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
        <Text style={styles.headerTitle}>Match Requests</Text>
        <View style={{ width: 24 }} />
      </View>

      <ScrollView
        style={styles.content}
        contentContainerStyle={styles.contentContainer}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} colors={[colors.primary]} />
        }
      >
        {pendingMatches.length === 0 ? (
          <View style={styles.emptyContainer}>
            <Icon name="heart-dislike" size={64} color={colors.textLight} />
            <Text style={styles.emptyTitle}>No Match Requests</Text>
            <Text style={styles.emptyText}>
              You don't have any pending match requests at the moment.{'\n'}
              Check back later! 🐾
            </Text>
          </View>
        ) : (
          <>
            <View style={styles.countContainer}>
              <Icon name="heart" size={20} color={colors.primary} />
              <Text style={styles.countText}>
                {pendingMatches.length} {pendingMatches.length === 1 ? 'Request' : 'Requests'}
              </Text>
            </View>

            {pendingMatches.map(match => (
              <TouchableOpacity
                key={match.id}
                style={styles.matchCard}
                onPress={() => handleViewMatch(match)}
                activeOpacity={0.7}
              >
                <Image source={{ uri: match.image }} style={styles.matchImage} />
                <View style={styles.matchInfo}>
                  <View style={styles.matchHeader}>
                    <Text style={styles.matchName}>{match.name}</Text>
                    <Text style={styles.genderIcon}>
                      {match.gender === 'male' ? '♂' : '♀'}
                    </Text>
                  </View>
                  <Text style={styles.matchDetails}>
                    {match.breed} • {match.age} years old
                  </Text>
                  <Text style={styles.ownerText}>Owned by {match.owner}</Text>
                  <Text style={styles.matchDescription} numberOfLines={2}>
                    {match.description}
                  </Text>
                  <View style={styles.viewProfileHint}>
                    <Text style={styles.viewProfileText}>Tap to view profile</Text>
                    <Icon name="chevron-forward" size={16} color={colors.primary} />
                  </View>
                </View>
              </TouchableOpacity>
            ))}
          </>
        )}
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
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 16,
    backgroundColor: colors.white,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
  },
  headerTitle: {
    fontSize: 20,
    fontWeight: '700',
    color: colors.text,
  },
  content: {
    flex: 1,
  },
  contentContainer: {
    padding: 16,
    paddingBottom: 100,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  loadingText: {
    marginTop: 10,
    color: colors.textLight,
    fontSize: 14,
  },
  emptyContainer: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 80,
    paddingHorizontal: 32,
  },
  emptyTitle: {
    fontSize: 20,
    fontWeight: '700',
    color: colors.text,
    marginTop: 16,
    marginBottom: 8,
  },
  emptyText: {
    fontSize: 14,
    color: colors.textLight,
    textAlign: 'center',
    lineHeight: 20,
  },
  countContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 16,
    gap: 8,
  },
  countText: {
    fontSize: 16,
    fontWeight: '600',
    color: colors.text,
  },
  matchCard: {
    flexDirection: 'row',
    backgroundColor: colors.white,
    borderRadius: 16,
    padding: 16,
    marginBottom: 12,
    borderWidth: 1,
    borderColor: colors.border,
  },
  matchImage: {
    width: 100,
    height: 100,
    borderRadius: 12,
    marginRight: 16,
  },
  matchInfo: {
    flex: 1,
    justifyContent: 'center',
  },
  matchHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 4,
  },
  matchName: {
    fontSize: 18,
    fontWeight: '700',
    color: colors.text,
    flex: 1,
  },
  genderIcon: {
    fontSize: 20,
    color: colors.primary,
    marginLeft: 8,
  },
  matchDetails: {
    fontSize: 14,
    color: colors.textLight,
    marginBottom: 4,
  },
  ownerText: {
    fontSize: 13,
    color: colors.textLight,
    marginBottom: 6,
  },
  matchDescription: {
    fontSize: 13,
    color: colors.text,
    marginBottom: 8,
  },
  viewProfileHint: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  viewProfileText: {
    fontSize: 13,
    color: colors.primary,
    fontWeight: '600',
    marginRight: 4,
  },
});
