import React, { useEffect, useState } from 'react';
import { Text, View, TouchableOpacity, FlatList, StyleSheet, Alert, TextInput, Image } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { supabase } from '../../supabase';
import { colors } from '../../styles/adminStyles';
import Icon from '../../components/Icon';
import { router } from 'expo-router';

type MatchRecord = {
  match_id: number;
  status: string;
  created_at: string;
  male_cats: {
    male_cat_id: number;
    name: string;
    breed: string;
    profile_image_url: string;
    owner_id: string;
    owner: {
      name: string;
    };
  };
  female_cats: {
    female_cat_id: number;
    name: string;
    breed: string;
    profile_image_url: string;
    owner_id: string;
    owner: {
      name: string;
    };
  };
  requester: {
    name: string;
  };
  receiver: {
    name: string;
  };
};

export default function MatchmakingManagementScreen() {
  const [matches, setMatches] = useState<MatchRecord[]>([]);
  const [filteredMatches, setFilteredMatches] = useState<MatchRecord[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('all');

  const fetchMatches = async () => {
    try {
      setLoading(true);
      const { data, error } = await supabase
        .from('matchmaking')
        .select(`
          match_id,
          status,
          created_at,
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
          ),
          requester:requester_id (
            name
          ),
          receiver:receiver_id (
            name
          )
        `)
        .order('created_at', { ascending: false });

      if (error) throw error;
      setMatches(data as MatchRecord[] | []);
      setFilteredMatches(data as MatchRecord[] | []);
    } catch (err) {
      Alert.alert('Error', (err as any).message || 'Failed to fetch matches');
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async (match_id: number) => {
    Alert.alert('Confirm Delete', 'Are you sure you want to delete this match?', [
      { text: 'Cancel', style: 'cancel' },
      {
        text: 'Delete',
        style: 'destructive',
        onPress: async () => {
          const { error } = await supabase.from('matchmaking').delete().eq('match_id', match_id);
          if (error) {
            Alert.alert('Error', error.message);
          } else {
            setMatches((prev) => prev.filter((m) => m.match_id !== match_id));
            setFilteredMatches((prev) => prev.filter((m) => m.match_id !== match_id));
            Alert.alert('Success', 'Match deleted successfully');
          }
        },
      },
    ]);
  };

  

  const handleUpdateStatus = async (match_id: number, newStatus: string) => {
    const { error } = await supabase
      .from('matchmaking')
      .update({ status: newStatus })
      .eq('match_id', match_id);

    if (error) {
      Alert.alert('Error', error.message);
    } else {
      Alert.alert('Success', `Status updated to ${newStatus}`);
      fetchMatches();
    }
  };

  const handleSearch = (text: string) => {
    setSearch(text);
    applyFilters(text, statusFilter);
  };

  const handleStatusFilter = (status: string) => {
    setStatusFilter(status);
    applyFilters(search, status);
  };

  const applyFilters = (searchText: string, status: string) => {
    let filtered = matches;

    // Filter by status
    if (status !== 'all') {
      filtered = filtered.filter((m) => m.status === status);
    }

    // Filter by search text
    if (searchText.trim() !== '') {
      const lower = searchText.toLowerCase();
      filtered = filtered.filter(
        (m) =>
          m.male_cats?.name?.toLowerCase().includes(lower) ||
          m.female_cats?.name?.toLowerCase().includes(lower) ||
          m.male_cats?.owner?.name?.toLowerCase().includes(lower) ||
          m.female_cats?.owner?.name?.toLowerCase().includes(lower) ||
          m.status?.toLowerCase().includes(lower)
      );
    }

    setFilteredMatches(filtered);
  };

  useEffect(() => {
    fetchMatches();
  }, []);

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'pending':
        return '#f39c12';
      case 'approved':
        return '#27ae60';
      case 'rejected':
        return '#e74c3c';
      case 'completed':
        return '#3498db';
      default:
        return colors.textLight;
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'pending':
        return 'time-outline';
      case 'approved':
        return 'checkmark-circle';
      case 'rejected':
        return 'close-circle';
      case 'completed':
        return 'flag';
      default:
        return 'ellipse';
    }
  };

  const renderItem = ({ item }: { item: MatchRecord }) => (
    <View style={styles.matchCard}>
      <View style={styles.catsContainer}>
        {/* Male Cat */}
        <View style={styles.catInfo}>
          <Image
            source={{ uri: item.male_cats?.profile_image_url || 'https://placekitten.com/100/100' }}
            style={styles.catImage}
          />
          <View style={styles.catDetails}>
            <Text style={styles.catName}>♂ {item.male_cats?.name || 'Unknown'}</Text>
            <Text style={styles.catBreed}>{item.male_cats?.breed || 'Unknown breed'}</Text>
            <Text style={styles.ownerName}>Owner: {item.male_cats?.owner?.name || 'Unknown'}</Text>
          </View>
        </View>

        {/* Heart Icon */}
        <View style={styles.heartContainer}>
          <Icon name="heart" size={24} color={colors.primary} />
        </View>

        {/* Female Cat */}
        <View style={styles.catInfo}>
          <Image
            source={{ uri: item.female_cats?.profile_image_url || 'https://placekitten.com/100/100' }}
            style={styles.catImage}
          />
          <View style={styles.catDetails}>
            <Text style={styles.catName}>♀ {item.female_cats?.name || 'Unknown'}</Text>
            <Text style={styles.catBreed}>{item.female_cats?.breed || 'Unknown breed'}</Text>
            <Text style={styles.ownerName}>Owner: {item.female_cats?.owner?.name || 'Unknown'}</Text>
          </View>
        </View>
      </View>

      {/* Status Badge */}
      <View style={[styles.statusBadge, { backgroundColor: getStatusColor(item.status) }]}>
        <Icon name={getStatusIcon(item.status)} size={16} color="#fff" />
        <Text style={styles.statusText}>{item.status.toUpperCase()}</Text>
      </View>

      {/* Match Info */}
      <View style={styles.matchInfo}>
        <Text style={styles.matchDate}>
          Match ID: {item.match_id} • {new Date(item.created_at).toLocaleDateString()}
        </Text>
      </View>

      {/* Actions (hidden in list-only mode) */}
    <View style={{ height: 0 }} />

    </View>
  );

  return (
    <SafeAreaView style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()} style={styles.backButton}>
          <Icon name="arrow-back" size={24} color={colors.text} />
        </TouchableOpacity>
        <Text style={styles.pageTitle}>Matchmaking Management</Text>
      </View>

      {/* Status Filter Chips */}
      <View style={styles.filterChipsContainer}>
        <TouchableOpacity
          onPress={() => handleStatusFilter('all')}
          style={[styles.filterChip, statusFilter === 'all' && styles.filterChipActive]}
        >
          <Text style={[styles.filterChipText, statusFilter === 'all' && styles.filterChipTextActive]}>
            All ({matches.length})
          </Text>
        </TouchableOpacity>
        <TouchableOpacity
          onPress={() => handleStatusFilter('pending')}
          style={[styles.filterChip, statusFilter === 'pending' && styles.filterChipActive]}
        >
          <Text style={[styles.filterChipText, statusFilter === 'pending' && styles.filterChipTextActive]}>
            Pending ({matches.filter((m) => m.status === 'pending').length})
          </Text>
        </TouchableOpacity>
        <TouchableOpacity
          onPress={() => handleStatusFilter('approved')}
          style={[styles.filterChip, statusFilter === 'approved' && styles.filterChipActive]}
        >
          <Text style={[styles.filterChipText, statusFilter === 'approved' && styles.filterChipTextActive]}>
            Approved ({matches.filter((m) => m.status === 'approved').length})
          </Text>
        </TouchableOpacity>
        <TouchableOpacity
          onPress={() => handleStatusFilter('rejected')}
          style={[styles.filterChip, statusFilter === 'rejected' && styles.filterChipActive]}
        >
          <Text style={[styles.filterChipText, statusFilter === 'rejected' && styles.filterChipTextActive]}>
            Rejected ({matches.filter((m) => m.status === 'rejected').length})
          </Text>
        </TouchableOpacity>
        <TouchableOpacity
          onPress={() => handleStatusFilter('completed')}
          style={[styles.filterChip, statusFilter === 'completed' && styles.filterChipActive]}
        >
          <Text style={[styles.filterChipText, statusFilter === 'completed' && styles.filterChipTextActive]}>
            Completed ({matches.filter((m) => m.status === 'completed').length})
          </Text>
        </TouchableOpacity>
      </View>

      {/* Search Bar */}
      <View style={styles.searchWrapper}>
        <Icon name="search" size={20} color={colors.textLight} style={styles.searchIcon} />
        <TextInput
          style={styles.searchInput}
          placeholder="Search by cat name, owner, or status"
          placeholderTextColor={colors.textLight}
          value={search}
          onChangeText={handleSearch}
        />
      </View>

      {/* Match List */}
      <FlatList
        data={filteredMatches}
        keyExtractor={(item) => item.match_id.toString()}
        renderItem={renderItem}
        refreshing={loading}
        onRefresh={fetchMatches}
        contentContainerStyle={{ padding: 16 }}
        ListEmptyComponent={
          <View style={styles.emptyState}>
            <Icon name="heart-dislike" size={64} color={colors.textLight} />
            <Text style={styles.emptyStateText}>No matches found</Text>
          </View>
        }
      />
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
    paddingHorizontal: 16,
    paddingVertical: 12,
  },
  backButton: {
    padding: 8,
    marginRight: 8,
  },
  pageTitle: {
    fontSize: 22,
    fontWeight: '700',
    color: colors.text,
  },
  filterChipsContainer: {
    flexDirection: 'row',
    paddingHorizontal: 16,
    paddingVertical: 8,
    gap: 8,
    flexWrap: 'wrap',
  },
  filterChip: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 16,
    backgroundColor: colors.backgroundAlt,
    borderWidth: 1,
    borderColor: colors.border,
  },
  filterChipActive: {
    backgroundColor: colors.primary,
    borderColor: colors.primary,
  },
  filterChipText: {
    fontSize: 13,
    color: colors.text,
    fontWeight: '500',
  },
  filterChipTextActive: {
    color: '#FFFFFF',
  },
  searchWrapper: {
    paddingHorizontal: 16,
    paddingVertical: 8,
    flexDirection: 'row',
    alignItems: 'center',
  },
  searchIcon: {
    position: 'absolute',
    left: 28,
    zIndex: 1,
  },
  searchInput: {
    flex: 1,
    backgroundColor: colors.backgroundAlt,
    borderRadius: 8,
    paddingHorizontal: 40,
    paddingVertical: 8,
    color: colors.text,
  },
  matchCard: {
    backgroundColor: colors.card,
    borderRadius: 12,
    padding: 16,
    marginBottom: 12,
    elevation: 2,
  },
  catsContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 12,
  },
  catInfo: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
  },
  catImage: {
    width: 50,
    height: 50,
    borderRadius: 25,
    marginRight: 8,
  },
  catDetails: {
    flex: 1,
  },
  catName: {
    fontSize: 15,
    fontWeight: '600',
    color: colors.text,
  },
  catBreed: {
    fontSize: 13,
    color: colors.textLight,
  },
  ownerName: {
    fontSize: 12,
    color: colors.textLight,
    marginTop: 2,
  },
  heartContainer: {
    marginHorizontal: 8,
  },
  statusBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    alignSelf: 'flex-start',
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 12,
    gap: 4,
    marginBottom: 8,
  },
  statusText: {
    fontSize: 12,
    fontWeight: '600',
    color: '#FFFFFF',
  },
  matchInfo: {
    marginBottom: 12,
  },
  matchDate: {
    fontSize: 12,
    color: colors.textLight,
  },
  actions: {
    flexDirection: 'row',
    gap: 8,
    flexWrap: 'wrap',
  },
  actionButton: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 8,
    gap: 4,
  },
  actionButtonText: {
    color: '#FFFFFF',
    fontSize: 13,
    fontWeight: '600',
  },
  emptyState: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 60,
  },
  emptyStateText: {
    fontSize: 16,
    color: colors.textLight,
    marginTop: 12,
  },
});