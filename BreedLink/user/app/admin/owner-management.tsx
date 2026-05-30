import React, { useEffect, useState } from 'react';
import { Text, View, TouchableOpacity, FlatList, StyleSheet, Alert, TextInput } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { supabase } from '../../supabase';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { colors } from '../../styles/adminStyles';
import Icon from '../../components/Icon';
import { router } from 'expo-router';

type Owner = {
  owner_id: string;
  name: string;
  email: string;
  phone: string;
  created_at: string;
};

export default function OwnerManagementScreen() {
  const [owners, setOwners] = useState<Owner[]>([]);
  const [filteredOwners, setFilteredOwners] = useState<Owner[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');

  const fetchOwners = async () => {
    try {
      setLoading(true);
      const { data, error } = await supabase
        .from('owner')
        .select('*')
        .order('created_at', { ascending: false });

      if (error) throw error;
      setOwners(data || []);
      setFilteredOwners(data || []);
    } catch (err) {
      Alert.alert('Error', (err as any).message || 'Failed to fetch owners');
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async (owner_id: string) => {
    Alert.alert('Confirm Delete', 'Are you sure you want to delete this owner?', [
      { text: 'Cancel', style: 'cancel' },
      {
        text: 'Delete',
        style: 'destructive',
        onPress: async () => {
          const { error } = await supabase.from('owner').delete().eq('owner_id', owner_id);
          if (error) {
            Alert.alert('Error', error.message);
          } else {
            setOwners((prev) => prev.filter((o) => o.owner_id !== owner_id));
            setFilteredOwners((prev) => prev.filter((o) => o.owner_id !== owner_id));
          }
        },
      },
    ]);
  };

 const handleAddUser = () => {
  router.push('/owner-insert'); 
};

  const handleEditUser = (owner: Owner) => {
     router.push({
    pathname: '/owner-edit',
    params: { owner_id: owner.owner_id }
  });
  };

  
  

  const handleSearch = (text: string) => {
    setSearch(text);
    if (text.trim() === '') {
      setFilteredOwners(owners);
    } else {
      const lower = text.toLowerCase();
      const filtered = owners.filter(
        (o) =>
          o.name?.toLowerCase().includes(lower) ||
          o.email?.toLowerCase().includes(lower) ||
          o.phone?.toLowerCase().includes(lower)
      );
      setFilteredOwners(filtered);
    }
  };

  useEffect(() => {
    fetchOwners();
  }, []);

  const renderItem = ({ item }: { item: Owner }) => (
    <View style={styles.ownerCard}>
      <View style={{ flex: 1 }}>
        <Text style={styles.ownerName}>{item.name || 'Unnamed'}</Text>
        <Text style={styles.ownerEmail}>{item.email}</Text>
        <Text style={styles.ownerPhone}>{item.phone}</Text>
      </View>
    </View>
  );

  return (
    <SafeAreaView style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <Text style={styles.pageTitle}>Owner Management</Text>
      </View>

      {/* Search Bar */}
      <View style={styles.searchWrapper}>
        <TextInput
          style={styles.searchInput}
          placeholder="Search by name, email, or phone"
          placeholderTextColor={colors.textSecondary}
          value={search}
          onChangeText={handleSearch}
        />
      </View>

      {/* Owner List */}
      <FlatList
        data={filteredOwners}
        keyExtractor={(item) => item.owner_id}
        renderItem={renderItem}
        refreshing={loading}
        onRefresh={fetchOwners}
        contentContainerStyle={{ padding: 16 }}
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
    paddingHorizontal: 16,
    paddingVertical: 12,
  },
  pageTitle: {
    fontSize: 22,
    fontWeight: '700',
    color: colors.text,
  },
  addButtonWrapper: {
    paddingHorizontal: 16,
    paddingBottom: 8,
  },
  addButton: {
    backgroundColor: colors.primary,
    paddingVertical: 10,
    borderRadius: 8,
    alignItems: 'center',
    justifyContent: 'center',
  },
  addButtonText: {
    color: colors.background,
    fontSize: 16,
    fontWeight: '600',
  },
  searchWrapper: {
    paddingHorizontal: 16,
    paddingBottom: 8,
  },
  searchInput: {
    backgroundColor: colors.backgroundAlt,
    borderRadius: 8,
    paddingHorizontal: 12,
    paddingVertical: 8,
    color: colors.text,
  },
  ownerCard: {
    backgroundColor: colors.card,
    borderRadius: 12,
    padding: 16,
    marginBottom: 12,
    flexDirection: 'row',
    alignItems: 'center',
    elevation: 2,
  },
  ownerName: {
    fontSize: 16,
    fontWeight: '600',
    color: colors.text,
  },
  ownerEmail: {
    fontSize: 14,
    color: colors.textSecondary,
  },
  ownerPhone: {
    fontSize: 13,
    color: colors.textLight,
  },
  actions: {
    flexDirection: 'row',
    marginLeft: 12,
  },
  actionButton: {
    padding: 8,
    marginLeft: 8,
    borderRadius: 8,
    backgroundColor: colors.backgroundAlt,
  },
});
