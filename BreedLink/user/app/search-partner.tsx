import React, { useEffect, useState, useCallback } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  ScrollView,
  Image,
  FlatList,
  TextInput,
  ActivityIndicator,
  Modal,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter, useLocalSearchParams, useFocusEffect } from 'expo-router';
import { supabase } from '../supabase';
import { colors } from '../styles/commonStyles';
import Icon from '../components/Icon';
import BottomNavigation from '../components/BottomNavigation';



interface Cat {
  id: number;
  name: string;
  breed: string;
  age: number;
  health_status: string;
  vaccination_status_url: string;
  profile_image_url: string;
  location_address: string;
  active_status: boolean;
  owner_id: string;
  gender: 'male' | 'female';
  approval_status: boolean;
}

export default function SearchPartnerScreen() {
  const router = useRouter();

  const [selectedCat, setSelectedCat] = useState<Cat | null>(null);
  const [showCatDropdown, setShowCatDropdown] = useState(false);
  const [maleCats, setMaleCats] = useState<Cat[]>([]);
  const [femaleCats, setFemaleCats] = useState<Cat[]>([]);
  const [filteredCats, setFilteredCats] = useState<Cat[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [sessionUserId, setSessionUserId] = useState<string | null>(null);
  const params = useLocalSearchParams();

// 🧠 Auto-refresh if coming back from match screen
useFocusEffect(
  useCallback(() => {
    if (params.refresh) {
      fetchCats(); // Re-fetch the cats
    }
  }, [params.refresh])
);


  // 🔐 Get logged-in user session
  const fetchSession = async () => {
    const { data, error } = await supabase.auth.getSession();
    if (error) {
      console.error('Error getting session:', error);
      return;
    }
    setSessionUserId(data.session?.user?.id || null);
  };

  // 🐱 Fetch cats from Supabase
  // 🐱 Fetch cats from Supabase
const fetchCats = async () => {
  try {
    setLoading(true);

    // 🐈 Fetch male cats that are active and approved
    const { data: maleData, error: maleError } = await supabase
      .from('male_cats')
      .select('*')
      .eq('active_status', true)
      .eq('approval_status', true); // ✅ Added

    // 🐈 Fetch female cats that are active and approved
    const { data: femaleData, error: femaleError } = await supabase
      .from('female_cats')
      .select('*')
      .eq('active_status', true)
      .eq('approval_status', true); // ✅ Added

    if (maleError || femaleError) throw maleError || femaleError;

    // Normalize IDs for both tables
    const males = (maleData || []).map((c) => ({
      ...c,
      id: c.male_cat_id,
      gender: 'male' as const,
    }));

    const females = (femaleData || []).map((c) => ({
      ...c,
      id: c.female_cat_id,
      gender: 'female' as const,
    }));

    setMaleCats(males);
    setFemaleCats(females);
    setFilteredCats([...males, ...females]);
  } catch (error) {
    console.error('Error fetching cats:', error);
  } finally {
    setLoading(false);
  }
};


  useEffect(() => {
    fetchSession();
    fetchCats();
  }, []);

  // 🔍 Get existing matchmaking records for the selected cat
const fetchActiveMatches = async (cat: Cat) => {
  try {
    const { data, error } = await supabase
      .from('matchmaking')
      .select('male_cat_id, female_cat_id, status')
      .in('status', ['pending', 'approved']); // only active matches

    if (error) throw error;

    // Build a set of partner cat IDs that should be hidden
    const blockedCatIds = new Set<number>();

    data?.forEach((match) => {
      if (cat.gender === 'male' && match.male_cat_id === cat.id) {
        blockedCatIds.add(match.female_cat_id); // hide female cats already matched
      } else if (cat.gender === 'female' && match.female_cat_id === cat.id) {
        blockedCatIds.add(match.male_cat_id); // hide male cats already matched
      }
    });

    return blockedCatIds;
  } catch (error) {
    console.error('Error fetching active matches:', error);
    return new Set<number>();
  }
};

  // 🧩 When owner selects their own cat
  const handleCatSelection = async (cat: Cat) => {
  setSelectedCat(cat);
  setShowCatDropdown(false);

  // Fetch active matches first
  const blockedCatIds = await fetchActiveMatches(cat);

  // Show opposite gender cats, exclude same owner, and exclude already-matched ones
  if (cat.gender === 'male') {
    const filtered = femaleCats.filter(
      (f) => f.owner_id !== cat.owner_id && !blockedCatIds.has(f.id)
    );
    setFilteredCats(filtered);
  } else {
    const filtered = maleCats.filter(
      (m) => m.owner_id !== cat.owner_id && !blockedCatIds.has(m.id)
    );
    setFilteredCats(filtered);
  }
};

  // 🔍 Search filtering (respect owner filter)
  const handleSearch = async (text: string) => {
  setSearchQuery(text);
  const query = text.toLowerCase();

  // 🧠 Skip if no cat selected
  if (!selectedCat) return;

  try {
    // 🐾 Fetch blocked cat IDs again (pending or approved)
    const blockedCatIds = await fetchActiveMatches(selectedCat);

    // 🔎 Filter opposite gender cats excluding same owner & matched cats
    let availableCats: Cat[] = [];

    if (selectedCat.gender === 'male') {
      availableCats = femaleCats.filter(
        (f) => f.owner_id !== selectedCat.owner_id && !blockedCatIds.has(f.id)
      );
    } else {
      availableCats = maleCats.filter(
        (m) => m.owner_id !== selectedCat.owner_id && !blockedCatIds.has(m.id)
      );
    }

    // 🔍 Apply text-based filtering
    const filtered = availableCats.filter(
      (cat) =>
        cat.name.toLowerCase().includes(query) ||
        cat.breed?.toLowerCase().includes(query) ||
        cat.location_address?.toLowerCase().includes(query) ||
        String(cat.age).includes(query)
    );

    setFilteredCats(filtered);
  } catch (error) {
    console.error("Error filtering cats:", error);
  }
};


  const handleCatPress = (cat: Cat) => {
  router.push({
    pathname: '/cat-profile-search',
    params: { 
      catId: cat.id, 
      gender: cat.gender,
      myCatId: selectedCat?.id,         // ✅ Pass your cat ID
      myCatGender: selectedCat?.gender, // ✅ Pass your cat gender
    },
  });
};

  const renderCat = ({ item }: { item: Cat }) => (
    <TouchableOpacity style={styles.catCard} onPress={() => handleCatPress(item)}>
      <Image
        source={{
          uri: item.profile_image_url || 'https://placekitten.com/300/300',
        }}
        style={styles.catImage}
      />
      <View style={styles.catInfo}>
        <Text style={styles.catName}>{item.name}</Text>
        <Text style={styles.catDetails}>
          {item.age} yrs • {item.breed}
        </Text>
        <Text style={styles.catLocation} numberOfLines={1}>
          📍 {item.location_address || 'Unknown'}
        </Text>
      </View>
    </TouchableOpacity>
  );

  if (loading) {
    return (
      <SafeAreaView style={styles.loadingContainer}>
        <ActivityIndicator size="large" color={colors.primary} />
        <Text>Loading cats...</Text>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.container}>
      {/* HEADER */}
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()}>
          <Icon name="arrow-back" size={24} color={colors.text} />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Find Partner</Text>

        <TouchableOpacity onPress={() => setShowCatDropdown(true)}>
          <Icon name="paw" size={24} color={colors.primary} />
        </TouchableOpacity>
      </View>

      {/* SELECTED CAT */}
      {selectedCat && (
        <View style={styles.selectedCatBanner}>
          <Text style={styles.selectedCatText}>
            Showing matches for: <Text style={{ fontWeight: '700' }}>{selectedCat.name}</Text> 🐾
          </Text>
        </View>
      )}

      {/* SEARCH BAR */}
      <View style={styles.searchBarContainer}>
        <Icon name="search" size={18} color={colors.textLight} />
        <TextInput
          placeholder="Search by name, breed, age, or location"
          placeholderTextColor={colors.textLight}
          value={searchQuery}
          onChangeText={handleSearch}
          style={styles.searchInput}
        />
      </View>

      {/* CAT LIST */}
      {/* CAT LIST OR PROMPT */}
{!selectedCat ? (
  <View style={styles.selectPromptContainer}>
    <Text style={styles.selectPromptText}>
      🐾 Please select your cat to see available partners.
    </Text>
  </View>
) : (
  <FlatList
    data={filteredCats}
    renderItem={renderCat}
    keyExtractor={(item) => `${item.gender}-${item.id}`}
    numColumns={2}
    columnWrapperStyle={styles.row}
    contentContainerStyle={styles.catsContainer}
    showsVerticalScrollIndicator={false}
    ListEmptyComponent={<Text style={styles.emptyText}>No cats found 😿</Text>}
  />
)}


      {/* CAT SELECT MODAL */}
      <Modal visible={showCatDropdown || !selectedCat} transparent animationType="slide"
        onRequestClose={() => {
          if (selectedCat) setShowCatDropdown(false);
        }}>
        <View style={styles.modalOverlay}>
          <View style={styles.modalBox}>
            <View style={styles.modalHeader}>
              <TouchableOpacity
                style={styles.backArrow}
                onPress={() => {
                  setShowCatDropdown(false);
                  router.push('/home');
                }}
              >
                <Icon name="arrow-back" size={24} color={colors.text} />
              </TouchableOpacity>
              <Text style={styles.modalTitle}>
                Select Your Cat
              </Text>
              <View style={{ width: 24 }} />
            </View>
            <ScrollView style={{ maxHeight: 300 }}>
              {loading ? (
                <Text style={styles.emptyText}>Loading your cats...</Text>
              ) : [...maleCats, ...femaleCats].filter((cat) => cat.owner_id === sessionUserId).length > 0 ? (
                [...maleCats, ...femaleCats]
                  .filter((cat) => cat.owner_id ===  sessionUserId && cat.approval_status === true && cat.active_status === true) // ✅ Only show owner's cats
                  .map((cat) => (
                    <TouchableOpacity
                      key={`${cat.gender}-${cat.id}`}
                      style={styles.modalItem}
                      onPress={() => handleCatSelection(cat)}
                    >
                      <Image
                        source={{
                          uri: cat.profile_image_url || 'https://placekitten.com/200/200',
                        }}
                        style={styles.modalImage}
                      />
                      <View>
                        <Text style={styles.modalCatName}>{cat.name}</Text>
                        <Text style={styles.modalCatInfo}>
                          {cat.gender.toUpperCase()} • {cat.breed}
                        </Text>
                      </View>
                    </TouchableOpacity>
                  ))
              ) : (
                <View style={styles.noCatsContainer}>
                  <Text style={styles.noCatsText}>
                    🐾 You don't have any cats yet!
                  </Text>
                  <Text style={styles.noCatsSubtext}>
                    Please add a cat profile first to start finding partners, or wait until your cat's vaccination is complete.
                  </Text>
                  <TouchableOpacity
                    style={styles.addCatButton}
                    onPress={() => {
                      setShowCatDropdown(false);
                      router.push('/create-profile');
                    }}
                  >
                    <Text style={styles.addCatButtonText}>Add Your First Cat</Text>
                  </TouchableOpacity>
                </View>
              )}
            </ScrollView>
          </View>
        </View>
      </Modal>

      <BottomNavigation />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.background },
  loadingContainer: { flex: 1, justifyContent: 'center', alignItems: 'center' },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: 16,
  },
  headerTitle: { fontSize: 20, fontWeight: '600', color: colors.text },
  selectedCatBanner: {
    backgroundColor: colors.secondary,
    padding: 10,
    marginHorizontal: 16,
    borderRadius: 8,
    marginBottom: 8,
  },
  selectedCatText: { color: colors.text, textAlign: 'center' },
  searchBarContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.white,
    borderRadius: 12,
    marginHorizontal: 16,
    marginBottom: 8,
    paddingHorizontal: 10,
    borderWidth: 1,
    borderColor: colors.border,
  },
  searchInput: { flex: 1, padding: 8, fontSize: 14, color: colors.text },
  catsContainer: { paddingHorizontal: 16, paddingBottom: 100 },
  row: { justifyContent: 'space-between', marginBottom: 16 },
  catCard: {
    width: '48%',
    backgroundColor: colors.white,
    borderRadius: 16,
    overflow: 'hidden',
    borderWidth: 1,
    borderColor: colors.border,
  },
  catImage: { width: '100%', height: 140, resizeMode: 'cover' },
  catInfo: { padding: 10 },
  catName: { fontSize: 16, fontWeight: '600', color: colors.text },
  catDetails: { fontSize: 12, color: colors.textLight, marginBottom: 4 },
  catLocation: { fontSize: 12, color: colors.textLight },
  emptyText: { textAlign: 'center', marginTop: 30, color: colors.textLight },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.5)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  modalBox: {
    width: '85%',
    backgroundColor: colors.white,
    borderRadius: 16,
    padding: 16,
  },
  modalTitle: {
    fontSize: 18,
    fontWeight: '700',
    flex: 1,
    textAlign: 'center',
  },
  modalHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 12,
  },
  backArrow: {
    padding: 4,
  },
  modalItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 8,
    borderBottomWidth: 1,
    borderColor: colors.border,
  },
  modalImage: { width: 50, height: 50, borderRadius: 25, marginRight: 10 },
  modalCatName: { fontSize: 16, fontWeight: '600' },
  modalCatInfo: { fontSize: 12, color: colors.textLight },
  closeButton: {
    backgroundColor: colors.primary,
    padding: 10,
    borderRadius: 10,
    marginTop: 10,
  },
  closeText: { color: colors.white, textAlign: 'center', fontWeight: '600' },
  selectPromptContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 20,
  },
  selectPromptText: {
    textAlign: 'center',
    fontSize: 16,
    color: colors.textLight,
    lineHeight: 22,
  },
  noCatsContainer: {
    alignItems: 'center',
    paddingVertical: 20,
  },
  noCatsText: {
    fontSize: 18,
    fontWeight: '700',
    color: colors.text,
    textAlign: 'center',
    marginBottom: 8,
  },
  noCatsSubtext: {
    fontSize: 14,
    color: colors.textLight,
    textAlign: 'center',
    marginBottom: 16,
    paddingHorizontal: 10,
  },
  addCatButton: {
    backgroundColor: colors.primary,
    paddingHorizontal: 24,
    paddingVertical: 12,
    borderRadius: 12,
    marginTop: 8,
  },
  addCatButtonText: {
    color: colors.white,
    fontSize: 16,
    fontWeight: '600',
  },
});
