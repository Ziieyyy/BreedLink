import React, { useState } from 'react';
import { View, Text, TouchableOpacity, StyleSheet, ScrollView, Image, FlatList } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import { colors, buttonStyles } from '../styles/commonStyles';
import Icon from '../components/Icon';
import BottomNavigation from '../components/BottomNavigation';

interface AdoptionCat {
  id: string;
  name: string;
  age: string;
  breed: string;
  location: string;
  personality: string[];
  image: string;
  shelter: string;
  description: string;
  urgent?: boolean;
}

const mockAdoptionCats: AdoptionCat[] = [
  {
    id: '1',
    name: 'Mittens',
    age: '2 years',
    breed: 'Domestic Shorthair',
    location: 'New York, NY',
    personality: ['Gentle', 'Playful', 'Friendly'],
    image: 'https://images.unsplash.com/photo-1514888286974-6c03e2ca1dba?w=400&h=400&fit=crop',
    shelter: 'Happy Paws Rescue',
    description: 'Mittens is a sweet and gentle cat who loves to play and cuddle.',
    urgent: true,
  },
  {
    id: '2',
    name: 'Shadow',
    age: '4 years',
    breed: 'Maine Coon',
    location: 'Los Angeles, CA',
    personality: ['Calm', 'Independent', 'Affectionate'],
    image: 'https://images.unsplash.com/photo-1592194996308-7b43878e84a6?w=400&h=400&fit=crop',
    shelter: 'City Animal Shelter',
    description: 'Shadow is a beautiful Maine Coon looking for a quiet home.',
  },
  {
    id: '3',
    name: 'Whiskers',
    age: '1 year',
    breed: 'Persian',
    location: 'Chicago, IL',
    personality: ['Playful', 'Energetic', 'Social'],
    image: 'https://images.unsplash.com/photo-1513245543132-31f507417b26?w=400&h=400&fit=crop',
    shelter: 'Feline Friends Sanctuary',
    description: 'Young and energetic Persian kitten ready for adventure!',
  },
];

export default function AdoptionScreen() {
  const router = useRouter();
  const [selectedFilter, setSelectedFilter] = useState<'all' | 'urgent' | 'kittens' | 'seniors'>('all');

  const filters = [
    { id: 'all', label: 'All Cats', icon: 'apps' },
    { id: 'urgent', label: 'Urgent', icon: 'alert-circle' },
    { id: 'kittens', label: 'Kittens', icon: 'heart' },
    { id: 'seniors', label: 'Seniors', icon: 'time' },
  ] as const;

  const filteredCats = mockAdoptionCats.filter(cat => {
    switch (selectedFilter) {
      case 'urgent':
        return cat.urgent;
      case 'kittens':
        return parseInt(cat.age) <= 1;
      case 'seniors':
        return parseInt(cat.age) >= 7;
      default:
        return true;
    }
  });

  const handleCatPress = (cat: AdoptionCat) => {
    console.log('Adoption cat pressed:', cat.name);
    router.push('/cat-profile');
  };

  const renderCat = ({ item }: { item: AdoptionCat }) => (
    <TouchableOpacity
      style={styles.catCard}
      onPress={() => handleCatPress(item)}
    >
      {item.urgent && (
        <View style={styles.urgentBadge}>
          <Text style={styles.urgentText}>URGENT</Text>
        </View>
      )}
      
      <Image source={{ uri: item.image }} style={styles.catImage} />
      
      <View style={styles.catInfo}>
        <Text style={styles.catName} numberOfLines={1}>{item.name}</Text>
        <Text style={styles.catDetails} numberOfLines={1}>{item.age} • {item.breed}</Text>
        <Text style={styles.catLocation} numberOfLines={1}>📍 {item.location}</Text>
        <Text style={styles.shelterName} numberOfLines={1}>{item.shelter}</Text>
        
        <View style={styles.personalityContainer}>
          {item.personality.slice(0, 2).map((trait, index) => (
            <View key={index} style={styles.personalityChip}>
              <Text style={styles.personalityText}>{trait}</Text>
            </View>
          ))}
          {item.personality.length > 2 && (
            <Text style={styles.moreTraits}>+{item.personality.length - 2}</Text>
          )}
        </View>
      </View>
    </TouchableOpacity>
  );

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()}>
          <Icon name="arrow-back" size={24} color={colors.text} />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Adoption Center</Text>
        <TouchableOpacity>
          <Icon name="filter" size={24} color={colors.text} />
        </TouchableOpacity>
      </View>

      <View style={styles.heroSection}>
        <Text style={styles.heroTitle}>Find Your Perfect Companion</Text>
        <Text style={styles.heroSubtitle}>Every cat deserves a loving home 🏠</Text>
        
        {/* Filter buttons moved to main content */}
        <ScrollView 
          horizontal 
          showsHorizontalScrollIndicator={false}
          style={styles.filterContainer}
          contentContainerStyle={styles.filterContent}
        >
          {filters.map((filter) => (
            <TouchableOpacity
              key={filter.id}
              style={[
                styles.filterChip,
                selectedFilter === filter.id && styles.activeFilterChip
              ]}
              activeOpacity={0.7}
              onPress={() => setSelectedFilter(filter.id as any)}
            >
              <Icon 
                name={filter.icon} 
                size={16} 
                color={selectedFilter === filter.id ? colors.white : colors.text} 
              />
              <Text style={[
                styles.filterText,
                selectedFilter === filter.id && styles.activeFilterText
              ]}>
                {filter.label}
              </Text>
            </TouchableOpacity>
          ))}
        </ScrollView>
      </View>

      <FlatList
        data={filteredCats}
        renderItem={renderCat}
        keyExtractor={(item: AdoptionCat) => item.id}
        numColumns={2}
        columnWrapperStyle={styles.row}
        contentContainerStyle={styles.catsContainer}
        showsVerticalScrollIndicator={false}
      />

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
  },
  headerTitle: {
    fontSize: 20,
    fontWeight: '600',
    color: colors.text,
  },
  heroSection: {
    paddingHorizontal: 20,
    paddingVertical: 16,
    alignItems: 'center',
    backgroundColor: colors.white,
  },
  heroTitle: {
    fontSize: 24,
    fontWeight: '700',
    color: colors.text,
    textAlign: 'center',
    marginBottom: 8,
  },
  heroSubtitle: {
    fontSize: 16,
    color: colors.textLight,
    textAlign: 'center',
  },
  filterContainer: {
    paddingTop: 16,
    paddingBottom: 4,
    width: '100%',
  },
  filterContent: {
    paddingHorizontal: 0,
    gap: 12,
    justifyContent: 'center',
  },
  filterChip: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 0,
    borderRadius: 20,
    backgroundColor: '#F5F5F5',
    borderWidth: 0,
    gap: 6,
    height: 44,
    width: 100,
    justifyContent: 'center',
  },
  activeFilterChip: {
    backgroundColor: colors.primary,
    borderColor: colors.primary,
    height: 44,
    width: 100,
  },
  filterText: {
    fontSize: 14,
    fontWeight: '500',
    color: colors.text,
    textAlign: 'center',
    flex: 0,
  },
  activeFilterText: {
    color: colors.white,
  },
  catsContainer: {
    paddingHorizontal: 16,
    paddingTop: 4,
    paddingBottom: 100,
  },
  row: {
    justifyContent: 'space-between',
    marginBottom: 16,
  },
  catCard: {
    width: '48%',
    height: 280,
    backgroundColor: colors.white,
    borderRadius: 16,
    overflow: 'hidden',
    borderWidth: 1,
    borderColor: colors.border,
    position: 'relative',
  },
  urgentBadge: {
    position: 'absolute',
    top: 8,
    right: 8,
    backgroundColor: colors.error,
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 8,
    zIndex: 1,
  },
  urgentText: {
    fontSize: 10,
    fontWeight: '700',
    color: colors.white,
  },
  catImage: {
    width: '100%',
    height: 120,
    resizeMode: 'cover',
  },
  catInfo: {
    padding: 12,
    height: 160,
    justifyContent: 'space-between',
  },
  catName: {
    fontSize: 16,
    fontWeight: '600',
    color: colors.text,
    marginBottom: 4,
  },
  catDetails: {
    fontSize: 12,
    color: colors.textLight,
    marginBottom: 4,
  },
  catLocation: {
    fontSize: 12,
    color: colors.textLight,
    marginBottom: 4,
  },
  shelterName: {
    fontSize: 12,
    color: colors.primary,
    fontWeight: '500',
    marginBottom: 8,
  },
  personalityContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    flexWrap: 'wrap',
    gap: 4,
  },
  personalityChip: {
    backgroundColor: colors.secondary,
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 8,
    marginRight: 4,
    marginBottom: 2,
  },
  personalityText: {
    fontSize: 10,
    color: colors.text,
    fontWeight: '500',
  },
  moreTraits: {
    fontSize: 10,
    color: colors.textLight,
    fontWeight: '500',
  },
});