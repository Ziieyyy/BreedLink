import React, { useEffect, useState, useCallback } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  ScrollView,
  Image,
  ActivityIndicator,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import { useFocusEffect } from '@react-navigation/native';
import Icon from '../components/Icon';
import { colors } from '../styles/commonStyles';
import BottomNavigation from '../components/BottomNavigation';
import { supabase } from '../supabase';

// --- Interfaces ---
interface CatProfile {
  male_cat_id?: number;
  female_cat_id?: number;
  owner_id: string;
  name: string;
  breed: string;
  profile_image_url: string;
  owner?: {
    name: string | null;
  };
}

interface MatchRecord {
  match_id: number;
  status: string;
  male_cats: CatProfile | null;
  female_cats: CatProfile | null;
}

interface BreedChat {
  id: string;
  myCat: {
    id: string;
    name: string;
    gender: 'male' | 'female';
    image: string;
    breed: string;
  };
  matchedCat: {
    id: string;
    name: string;
    gender: 'male' | 'female';
    image: string;
    breed: string;
    ownerName: string;
  };
  lastMessage: {
    text: string;
    sender: 'me' | 'other';
    timestamp: Date;
  };
}

export default function BreedChatListScreen() {
  const router = useRouter();
  const [chats, setChats] = useState<BreedChat[]>([]);
  const [loading, setLoading] = useState(true);

  // Refresh data every time the screen comes into focus
  useFocusEffect(
    useCallback(() => {
      fetchApprovedMatches();
    }, [])
  );

  const fetchApprovedMatches = async () => {
    try {
      setLoading(true);

      // Get current user
      const { data: userData, error: userError } = await supabase.auth.getUser();
      const user = userData?.user;

      if (userError || !user) {
        console.log('No user logged in');
        setLoading(false);
        return;
      }

      // Fetch approved matches involving the user
      const { data, error } = await supabase
        .from('matchmaking')
        .select(`
          match_id,
          status,
          requester_id,
          receiver_id,
          male_cat_id,
          female_cat_id,
          male_cats (
            male_cat_id,
            name,
            breed,
            profile_image_url,
            owner_id,
            owner:owner_id (
              name
            )
          ),
          female_cats (
            female_cat_id,
            name,
            breed,
            profile_image_url,
            owner_id,
            owner:owner_id (
              name
            )
          )
        `)
        .eq('status', 'approved')
        .or(`requester_id.eq.${user.id},receiver_id.eq.${user.id}`);

      if (error) {
        console.log('Error fetching matches:', error);
        setLoading(false);
        return;
      }

      const safeData = (Array.isArray(data) ? data : []) as any[];

      // Fetch last message for each match
      const formattedChatsPromises = safeData.map(async (match) => {
        // Determine which cat belongs to current user
        const isMyMaleCat = match.male_cats?.owner_id === user.id;
        const myCat = isMyMaleCat ? match.male_cats : match.female_cats;
        const matchedCat = isMyMaleCat ? match.female_cats : match.male_cats;

        // Fetch last message for this match
        const { data: lastMsgData } = await supabase
          .from('messages')
          .select('message, sender_id, created_at')
          .eq('match_id', match.match_id)
          .order('created_at', { ascending: false })
          .limit(1)
          .maybeSingle();

        return {
          id: match.match_id.toString(),
          myCat: {
            id: (myCat?.male_cat_id ?? myCat?.female_cat_id ?? '').toString(),
            name: myCat?.name ?? 'Unknown',
            gender: isMyMaleCat ? ('male' as const) : ('female' as const),
            image: myCat?.profile_image_url ?? 'https://placekitten.com/200/200',
            breed: myCat?.breed ?? 'Unknown',
          },
          matchedCat: {
            id: (matchedCat?.male_cat_id ?? matchedCat?.female_cat_id ?? '').toString(),
            name: matchedCat?.name ?? 'Unknown',
            gender: isMyMaleCat ? ('female' as const) : ('male' as const),
            image: matchedCat?.profile_image_url ?? 'https://placekitten.com/200/200',
            breed: matchedCat?.breed ?? 'Unknown',
            ownerName: matchedCat?.owner?.name ?? 'Unknown Owner',
          },
          lastMessage: {
            text: lastMsgData?.message ?? 'Say hi to your match!',
            sender: (lastMsgData?.sender_id === user.id ? 'me' : 'other') as 'me' | 'other',
            timestamp: lastMsgData ? new Date(lastMsgData.created_at) : new Date(),
          },
        };
      });

      const formattedChats = await Promise.all(formattedChatsPromises);
      
      // Sort by most recent message
      formattedChats.sort((a, b) => b.lastMessage.timestamp.getTime() - a.lastMessage.timestamp.getTime());
      
      setChats(formattedChats);
    } catch (err) {
      console.error('Unexpected error fetching matches:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleChatPress = (chat: BreedChat) => {
    router.push({
      pathname: '/chat',
      params: {
        chatId: chat.id,
        myCatName: chat.myCat.name,
        matchedCatName: chat.matchedCat.name,
        myCatImage: encodeURIComponent(chat.myCat.image),
        matchedCatImage: encodeURIComponent(chat.matchedCat.image),
        myCatBreed: chat.myCat.breed,
        matchedCatBreed: chat.matchedCat.breed,
        myCatGender: chat.myCat.gender,
        matchedCatGender: chat.matchedCat.gender,
      }
    });
  };

  const formatTimestamp = (date: Date) => {
    const now = new Date();
    const diff = now.getTime() - date.getTime();
    const hours = Math.floor(diff / (1000 * 60 * 60));
    
    if (hours < 24) {
      return date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
    } else if (hours < 48) {
      return 'Yesterday';
    } else {
      return date.toLocaleDateString([], { month: 'short', day: 'numeric' });
    }
  };

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity style={styles.backButton} onPress={() => router.back()}>
          <Icon name="arrow-back" size={24} color={colors.text} />
        </TouchableOpacity>

        <View style={styles.headerContent}>
          <Text style={styles.headerTitle}>Breed Chats</Text>
          <Text style={styles.headerSubtitle}>Chats with owners of matched cats</Text>
        </View>
      </View>

      {loading ? (
        <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center' }}>
          <ActivityIndicator size="large" color={colors.primary} />
        </View>
      ) : chats.length > 0 ? (
        <ScrollView>
          {chats.map((chat) => (
            <TouchableOpacity
              key={chat.id}
              style={styles.chatItem}
              onPress={() => handleChatPress(chat)}
            >
              <Image source={{ uri: chat.matchedCat.image }} style={styles.catAvatar} />
              
              <View style={styles.chatContent}>
                <View style={styles.chatHeader}>
                  <Text style={styles.catName}>{chat.matchedCat.name}</Text>
                  <Text style={styles.timestamp}>
                    {formatTimestamp(chat.lastMessage.timestamp)}
                  </Text>
                </View>
                <Text style={styles.matchedWith}>
                  Matched with {chat.myCat.name}
                </Text>
                <Text style={styles.ownerName}>Owner: {chat.matchedCat.ownerName}</Text>
                <Text style={styles.lastMessage} numberOfLines={1}>
                  {chat.lastMessage.sender === 'me' ? 'You: ' : ''}
                  {chat.lastMessage.text}
                </Text>
              </View>
            </TouchableOpacity>
          ))}
        </ScrollView>
      ) : (
        <View style={styles.emptyState}>
          <Text style={styles.emptyStateEmoji}>💬</Text>
          <Text style={styles.emptyStateTitle}>No Approved Matches Yet</Text>
          <Text style={styles.emptyStateDescription}>
            When your cat is approved for breeding, it'll show up here.
          </Text>
        </View>
      )}

      <BottomNavigation />
    </SafeAreaView>
  );
}

// --- Styles ---
const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.background },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 12,
    backgroundColor: colors.white,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
  },
  backButton: { padding: 8, marginRight: 8 },
  headerContent: { flex: 1, marginLeft: 8 },
  headerTitle: { fontSize: 20, fontWeight: '600', color: colors.text },
  headerSubtitle: { fontSize: 14, color: colors.textLight, marginTop: 2 },
  chatItem: {
    flexDirection: 'row',
    padding: 16,
    backgroundColor: colors.white,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
  },
  catAvatar: { 
    width: 50, 
    height: 50, 
    borderRadius: 25, 
    marginRight: 12 
  },
  chatContent: { flex: 1, justifyContent: 'center' },
  catName: { fontSize: 16, fontWeight: '600', color: colors.text },
  matchedWith: { fontSize: 14, color: colors.textLight },
  emptyState: { flex: 1, justifyContent: 'center', alignItems: 'center', padding: 40 },
  emptyStateEmoji: { fontSize: 64, marginBottom: 16 },
  emptyStateTitle: { fontSize: 20, fontWeight: '600', color: colors.text },
  emptyStateDescription: { fontSize: 16, color: colors.textLight, textAlign: 'center' },
  ownerName: {
    fontSize: 13,
    color: colors.textLight,
    marginTop: 2,
  },
  chatHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 4,
  },
  timestamp: {
    fontSize: 12,
    color: colors.textLight,
  },
  lastMessage: {
    fontSize: 14,
    color: colors.textLight,
    marginTop: 4,
  },
});