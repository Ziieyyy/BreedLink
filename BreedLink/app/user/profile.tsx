
import React, { useState, useEffect } from 'react';
import { View, Text, TouchableOpacity, StyleSheet, ScrollView, Image } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import { colors, buttonStyles } from '../styles/commonStyles';
import Icon from '../components/Icon';
import CustomAlert, { AlertType } from '../components/CustomAlert';
import { supabase } from 'supabase';
import AsyncStorage from '@react-native-async-storage/async-storage';
import BottomNavigation from '../components/BottomNavigation';

export default function ProfileScreen() {
  const router = useRouter();
  const [cats, setCats] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [alert, setAlert] = useState<{ visible: boolean; type: AlertType; title: string; message: string }>({ 
    visible: false, 
    type: 'error', 
    title: '', 
    message: '' 
  });

  useEffect(() => {
    const fetchCats = async () => {
      setLoading(true);

      // 1️⃣ Get the current logged-in user
      const { data: { user }, error: userError } = await supabase.auth.getUser();
      if (userError || !user) {
        setAlert({ visible: true, type: 'error', title: 'Error', message: 'You must be logged in to see your cats.' });
        setLoading(false);
        return;
      }

      const ownerId = user.id; // This should match your owner table's owner_id

      // 2️⃣ Fetch female cats
      const { data: femaleCats, error: femaleError } = await supabase
        .from('female_cats')
        .select('female_cat_id, name, breed, age, profile_image_url')
        .eq('owner_id', ownerId);

      if (femaleError) console.error('Female cats fetch error:', femaleError);

      // 3️⃣ Fetch male cats
      const { data: maleCats, error: maleError } = await supabase
        .from('male_cats')
        .select('male_cat_id, name, breed, age, profile_image_url')
        .eq('owner_id', ownerId);

      if (maleError) console.error('Male cats fetch error:', maleError);

      // 4️⃣ Combine both into one array
      const combinedCats = [
        ...(femaleCats || []).map((cat) => ({
          id: `f-${cat.female_cat_id}`,
          name: cat.name,
          breed: cat.breed,
          age: cat.age,
          image: cat.profile_image_url,
          type: 'female',
        })),
        ...(maleCats || []).map((cat) => ({
          id: `m-${cat.male_cat_id}`,
          name: cat.name,
          breed: cat.breed,
          age: cat.age,
          image: cat.profile_image_url,
          type: 'male',
        })),
      ];

      setCats(combinedCats);
      setLoading(false);
    };

    fetchCats();
  }, []);


  const handleAddCat = () => {
    router.push('/create-profile');
  };

  const handleCatPress = (cat: any) => {
    console.log('Cat pressed:', cat.name);
    router.push(`/cat-profile?catId=${cat.id}&catName=${cat.name}&isOwner=true`);
  };

  return (
    <SafeAreaView style={styles.container}>
      <CustomAlert
        visible={alert.visible}
        type={alert.type}
        title={alert.title}
        message={alert.message}
        onConfirm={() => setAlert({ ...alert, visible: false })}
      />
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()}>
          <Icon name="arrow-back" size={24} color={colors.text} />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>My Cats</Text>
        <TouchableOpacity onPress={() => router.push('/cat-management')}>
          <Icon name="settings" size={24} color={colors.primary} />
        </TouchableOpacity>
      </View>

      <ScrollView style={styles.scrollView} showsVerticalScrollIndicator={false}>
        <View style={styles.content}>
          {cats.length === 0 ? (
            <View style={styles.emptyState}>
              <Text style={styles.emptyEmoji}>🐱</Text>
              <Text style={styles.emptyTitle}>No cats yet</Text>
              <Text style={styles.emptyDescription}>
                Create your first cat profile to start discovering matches
              </Text>
              <TouchableOpacity
                style={[buttonStyles.primary, styles.addButton]}
                onPress={handleAddCat}
              >
                <Text style={buttonStyles.primaryText}>Add Your First Cat</Text>
              </TouchableOpacity>
            </View>
          ) : (
            <>
              <View style={styles.catsGrid}>
                {cats.map((cat) => (
                  <TouchableOpacity 
                    key={cat.id} 
                    style={styles.catCard}
                    onPress={() => handleCatPress(cat)}
                  >
                    <Image source={{ uri: cat.image }} style={styles.catImage} />
                    <View style={styles.catInfo}>
                      <Text style={styles.catName}>{cat.name}</Text>
                      <Text style={styles.catDetails}>{cat.age} years • {cat.breed}</Text>
                    </View>
                  </TouchableOpacity>
                ))}
              </View>

              <TouchableOpacity
                style={[buttonStyles.secondary, styles.addAnotherButton]}
                onPress={handleAddCat}
              >
                <Text style={buttonStyles.secondaryText}>Add Another Cat</Text>
              </TouchableOpacity>
            </>
          )}
        </View>
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
  scrollView: {
    flex: 1,
  },
  content: {
    flex: 1,
    paddingHorizontal: 20,
    paddingBottom: 100, // Space for bottom navigation
  },
  emptyState: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingVertical: 60,
  },
  emptyEmoji: {
    fontSize: 80,
    marginBottom: 20,
  },
  emptyTitle: {
    fontSize: 24,
    fontWeight: '700',
    color: colors.text,
    marginBottom: 8,
    textAlign: 'center',
  },
  emptyDescription: {
    fontSize: 16,
    color: colors.textLight,
    textAlign: 'center',
    marginBottom: 32,
    lineHeight: 24,
  },
  addButton: {
    width: '100%',
  },
  catsGrid: {
    gap: 16,
    marginBottom: 32,
  },
  catCard: {
    backgroundColor: colors.white,
    borderRadius: 16,
    overflow: 'hidden',
    boxShadow: '0px 2px 8px rgba(0, 0, 0, 0.1)',
    elevation: 3,
  },
  catImage: {
    width: '100%',
    height: 200,
    resizeMode: 'cover',
  },
  catInfo: {
    padding: 16,
  },
  catName: {
    fontSize: 18,
    fontWeight: '600',
    color: colors.text,
    marginBottom: 4,
  },
  catDetails: {
    fontSize: 14,
    color: colors.textLight,
  },
  addAnotherButton: {
    width: '100%',
  },
});
