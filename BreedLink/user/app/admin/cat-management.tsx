import React, { useEffect, useState } from 'react';
import { Text, View, TouchableOpacity, FlatList, StyleSheet, Alert, TextInput } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { supabase } from '../../supabase';
import { colors } from '../../styles/adminStyles';
import Icon from '../../components/Icon';
import { useRouter } from 'expo-router';

type Cat = {
  id: number;                     // ✅ common field for both male & female cats
  male_cat_id?: number;
  female_cat_id?: number;
  owner_id: string;
  owner_name?: string;  
  name: string;
  breed?: string;
  age?: number;
  health_status?: string;
  vaccination_status_url?: string;
  profile_image_url?: string;
  active_status?: boolean;
  created_at: string;
  gender: 'Male' | 'Female';
};

export default function CatManagementScreen() {
  const [cats, setCats] = useState<Cat[]>([]);
  const [filteredCats, setFilteredCats] = useState<Cat[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');

  const router = useRouter();

  const fetchCats = async () => {
    try {
      setLoading(true);

      // Fetch owners
      const { data: ownersData, error: ownersError } = await supabase
        .from('owner')
        .select('owner_id, name');
      if (ownersError) throw ownersError;

      // Map owner_id to name
      const ownerMap: Record<string, string> = {};
      (ownersData || []).forEach(o => {
        ownerMap[o.owner_id] = o.name || 'Unnamed';
      });

      // Fetch female cats
      const { data: femaleCats, error: femaleError } = await supabase
        .from('female_cats')
        .select('*')
        .order('created_at', { ascending: false });
      if (femaleError) throw femaleError;

      // Fetch male cats
      const { data: maleCats, error: maleError } = await supabase
        .from('male_cats')
        .select('*')
        .order('created_at', { ascending: false });
      if (maleError) throw maleError;

      // ✅ Remap IDs to common `id` field
      const allCats: Cat[] = [
        ...(femaleCats || []).map(c => ({
          ...c,
          id: c.female_cat_id,   // ✅ map to common field
          gender: 'Female',
          owner_name: ownerMap[c.owner_id],
        })),
        ...(maleCats || []).map(c => ({
          ...c,
          id: c.male_cat_id,     // ✅ map to common field
          gender: 'Male',
          owner_name: ownerMap[c.owner_id],
        })),
      ];

      setCats(allCats);
      setFilteredCats(allCats);

    } catch (err: any) {
      Alert.alert('Error', err.message || 'Failed to fetch cats');
    } finally {
      setLoading(false);
    }
  };

 const handleDelete = async (cat: Cat) => {
  Alert.alert(
    `Delete ${cat.gender} Cat`, 
    `⚠️ This will permanently delete:

• ${cat.name}'s profile
• All matchmaking records
• All messages in those matches
• All agreements
• Profile image & vaccination files

This action cannot be undone!`,
    [
      { text: 'Cancel', style: 'cancel' },
      {
        text: 'Delete Everything',
        style: 'destructive',
        onPress: async () => {
          try {
            setLoading(true);

            const tableName = cat.gender === 'Female' ? 'female_cats' : 'male_cats';
            const idField = cat.gender === 'Female' ? 'female_cat_id' : 'male_cat_id';
            const matchField = cat.gender === 'Female' ? 'female_cat_id' : 'male_cat_id';

            // Step 1: Get all match IDs involving this cat
            const { data: matches } = await supabase
              .from('matchmaking')
              .select('match_id')
              .eq(matchField, cat.id);

            const matchIds = matches?.map(m => m.match_id) || [];

            // Step 2: Delete agreements linked to these matches
            if (matchIds.length > 0) {
              const { error: agreementsError } = await supabase
                .from('agreements')
                .delete()
                .in('match_id', matchIds);

              if (agreementsError) {
                console.warn('Error deleting agreements:', agreementsError);
              }
            }

            // Step 3: Delete messages in these matches
            if (matchIds.length > 0) {
              const { error: messagesError } = await supabase
                .from('messages')
                .delete()
                .in('match_id', matchIds);

              if (messagesError) {
                console.warn('Error deleting messages:', messagesError);
              }
            }

            // Step 4: Delete matchmaking records
            if (matchIds.length > 0) {
              const { error: matchError } = await supabase
                .from('matchmaking')
                .delete()
                .eq(matchField, cat.id);

              if (matchError) {
                console.warn('Error deleting matchmaking:', matchError);
              }
            }

            // Step 5: Delete files from storage
            const deleteFromStorage = async (url: string | undefined, bucket: string) => {
              if (!url) return;

              try {
                const basePath = `/object/public/${bucket}/`;
                const index = url.indexOf(basePath);
                if (index === -1) return;

                const filePath = url.substring(index + basePath.length);
                if (!filePath) return;

                const { error } = await supabase.storage.from(bucket).remove([filePath]);
                if (error) {
                  console.warn(`❌ Failed to delete ${filePath}:`, error.message);
                } else {
                  console.log(`✅ Deleted ${filePath} from ${bucket}`);
                }
              } catch (err) {
                console.warn(`Error removing from ${bucket}:`, err);
              }
            };

            await deleteFromStorage(cat.profile_image_url, 'cat-profile-image');
            await deleteFromStorage(cat.vaccination_status_url, 'vaccination');

            // Step 6: Delete the cat record
            const { error: catError } = await supabase
              .from(tableName)
              .delete()
              .eq(idField, cat.id);

            if (catError) throw catError;

            // Step 7: Update local state
            setCats(prev => prev.filter(c => c.id !== cat.id));
            setFilteredCats(prev => prev.filter(c => c.id !== cat.id));

            Alert.alert('Success', `${cat.name} and all associated data deleted successfully!`);
          } catch (err: any) {
            console.error('Delete error:', err);
            Alert.alert('Error', err.message || 'Failed to delete cat.');
          } finally {
            setLoading(false);
          }
        },
      },
    ]
  );
};



  const handleEditCat = (cat: Cat) => {
    if (cat.gender === "Female") {
      router.push(`/admin/cat-edit-female?cat_id=${cat.id}` as any);
    } else {
      router.push(`/admin/cat-edit-male?cat_id=${cat.id}` as any);
    }
  };

  const handleAddCat = (gender: 'Male' | 'Female') => {
    // Single function to navigate to insert page based on gender
    const route = gender === 'Female' ? '/admin/cat-insert-female' : '/admin/cat-insert-male';
    router.push(route as any);
  };


  const handleSearch = (text: string) => {
    setSearch(text);
    if (!text.trim()) {
      setFilteredCats(cats);
    } else {
      const lower = text.toLowerCase();
      const filtered = cats.filter(
        c =>
          c.name?.toLowerCase().includes(lower) ||
          c.breed?.toLowerCase().includes(lower)
      );
      setFilteredCats(filtered);
    }
  };

  useEffect(() => {
    fetchCats();
  }, []);

  const renderItem = ({ item }: { item: Cat }) => (
    <View style={styles.catCard}>
      <View style={{ flex: 1 }}>
        <Text style={styles.catName}>{item.name}</Text>
        <Text style={styles.catDetails}>{item.breed || 'Unknown Breed'} • {item.age ?? '?'} years</Text>
        <Text style={styles.catDetails}>Owner: {item.owner_name || 'Unknown'}</Text>
        <Text style={styles.catDetails}>Gender: {item.gender}</Text>
      </View>
      <View style={styles.actions}>
        <TouchableOpacity onPress={() => handleEditCat(item)} style={styles.actionButton}>
          <Icon name="create" size={20} color={colors.primary} />
        </TouchableOpacity>
        <TouchableOpacity onPress={() => handleDelete(item)} style={styles.actionButton}>
          <Icon name="trash-outline" size={20} color="red" />
        </TouchableOpacity>
      </View>
    </View>
  );

  return (
    <SafeAreaView style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <Text style={styles.pageTitle}>Cat Management</Text>
      </View>

      {/* Add Cat Buttons */}
      <View style={styles.addButtonWrapper}>
        <TouchableOpacity style={styles.addButton} onPress={() => handleAddCat('Female')}>
          <Text style={styles.addButtonText}>+ Add Female Cat</Text>
        </TouchableOpacity>
        <TouchableOpacity style={styles.addButton} onPress={() => handleAddCat('Male')}>
          <Text style={styles.addButtonText}>+ Add Male Cat</Text>
        </TouchableOpacity>
      </View>

      {/* Search */}
      <View style={styles.searchWrapper}>
        <TextInput
          style={styles.searchInput}
          placeholder="Search by name or breed"
          placeholderTextColor={colors.textSecondary}
          value={search}
          onChangeText={handleSearch}
        />
      </View>

      {/* Cat List */}
      <FlatList
        data={filteredCats}
        keyExtractor={(item) => `${item.gender}-${item.id}`}
        renderItem={renderItem}
        refreshing={loading}
        onRefresh={fetchCats}
        contentContainerStyle={{ padding: 16 }}
      />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.background },
  header: { paddingHorizontal: 16, paddingVertical: 12 },
  pageTitle: { fontSize: 22, fontWeight: '700', color: colors.text },
  addButtonWrapper: { flexDirection: 'row', justifyContent: 'space-between', paddingHorizontal: 16, paddingBottom: 8 },
  addButton: { backgroundColor: colors.primary, paddingVertical: 10, paddingHorizontal: 12, borderRadius: 8, alignItems: 'center', justifyContent: 'center', marginHorizontal: 4 },
  addButtonText: { color: colors.background, fontSize: 14, fontWeight: '600' },
  searchWrapper: { paddingHorizontal: 16, paddingBottom: 8 },
  searchInput: { backgroundColor: colors.backgroundAlt, borderRadius: 8, paddingHorizontal: 12, paddingVertical: 8, color: colors.text },
  catCard: { backgroundColor: colors.card, borderRadius: 12, padding: 16, marginBottom: 12, flexDirection: 'row', alignItems: 'center', elevation: 2 },
  catName: { fontSize: 16, fontWeight: '600', color: colors.text },
  catDetails: { fontSize: 13, color: colors.textSecondary },
  actions: { flexDirection: 'row', marginLeft: 12 },
  actionButton: { padding: 8, marginLeft: 8, borderRadius: 8, backgroundColor: colors.backgroundAlt },
});
