import React, { useState, useEffect } from 'react';
import { View, Text, TouchableOpacity, StyleSheet, Dimensions, Image, Modal, ScrollView } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import { supabase } from '../supabase'; // Make sure Supabase is imported
import { colors } from '../styles/commonStyles';
import Icon from '../components/Icon';
import BottomNavigation from '../components/BottomNavigation';
// Add gesture handler and reanimated imports
import { GestureDetector, Gesture } from 'react-native-gesture-handler';
import Animated, { 
  useSharedValue, 
  useAnimatedStyle, 
  withSpring, 
  withTiming,
  runOnJS,
  interpolate,
  Extrapolation,
  useAnimatedReaction,
  Easing
} from 'react-native-reanimated';
import * as Haptics from 'expo-haptics';

const { width, height } = Dimensions.get('window');

// Update the Cat interface to match what we need
type Cat = {
  id: number;
  name: string;
  age: number;
  breed: string;
  personality: string[];
  image: string;
  location?: string;
  profile_image_url?: string; // Add profile image URL
  gender?: 'male' | 'female'; // Add gender
  owner_id?: string; // Add owner ID
  owner?: string; // Add owner name
  active_status?: boolean; // Add active status
  approval_status?: boolean;
  compatibilityScore?: number; 
  
};
// Compatibility Badge Component
const CompatibilityBadge = ({ score }: { score?: number }) => {
  if (!score && score !== 0) return null;

  let badgeColor, badgeText, emoji, badgeStyle;
  
  if (score >= 70) {
    badgeColor = '#FF6B35';
    badgeText = 'Great Match';
    emoji = '🔥';
    badgeStyle = styles.greatMatchBadge;
  } else if (score >= 40) {
    badgeColor = '#4A90E2';
    badgeText = 'Good Match';
    emoji = '⭐';
    badgeStyle = styles.goodMatchBadge;
  } else {
    badgeColor = '#9B59B6';
    badgeText = 'Possible Match';
    emoji = '💫';
    badgeStyle = styles.possibleMatchBadge;
  }

  return (
    <View style={[styles.compatibilityBadge, badgeStyle]}>
      <Text style={styles.badgeEmoji}>{emoji}</Text>
      <View style={styles.badgeTextContainer}>
        <Text style={styles.badgeTitle}>{badgeText}</Text>
        <Text style={styles.badgePercentage}>{score}% Match</Text>
      </View>
    </View>
  );
};


// Create animated card component
const AnimatedCard = ({ 
  cat, 
  onSwipe,
  isActive,
  router,
  selectedCat
}: {
  cat: Cat;
  onSwipe: (direction: 'left' | 'right', catId: number) => void;
  isActive: boolean;
  router: any;
  selectedCat: Cat | null;
}) => {
  const translateX = useSharedValue(0);
  const rotate = useSharedValue(0);
  const scale = useSharedValue(1);
  const opacity = useSharedValue(0); // Start with 0 for fade-in effect
  
  // Shared values for swipe feedback
  const matchOpacity = useSharedValue(0);
  const skipOpacity = useSharedValue(0);
  const matchScale = useSharedValue(0.5); // Increased initial scale for better visibility
  const skipScale = useSharedValue(0.5);  // Increased initial scale for better visibility

  // Animated styles for the card
  const cardAnimatedStyle = useAnimatedStyle(() => {
    return {
      transform: [
        { translateX: translateX.value },
        { rotate: `${rotate.value}deg` },
        { scale: scale.value },
      ],
      opacity: opacity.value,
    };
  });



// Helper function to calculate compatibility score

  // Animated styles for swipe feedback
  const matchAnimatedStyle = useAnimatedStyle(() => ({
    opacity: matchOpacity.value,
    transform: [{ scale: matchScale.value }],
  }));

  const skipAnimatedStyle = useAnimatedStyle(() => ({
    opacity: skipOpacity.value,
    transform: [{ scale: skipScale.value }],
  }));

  // Fade in the card when it becomes active
  useAnimatedReaction(
    () => isActive,
    (active) => {
      if (active) {
        // Slide in from the right with fade-in effect
        translateX.value = withTiming(0, { duration: 300, easing: Easing.out(Easing.ease) });
        opacity.value = withTiming(1, { duration: 300, easing: Easing.out(Easing.ease) });
      }
    },
    [isActive]
  );

  // Gesture handler with improved sensitivity and smoothness
  const panGesture = Gesture.Pan()
    .activeOffsetX([-10, 10]) // Reduce sensitivity to accidental horizontal drags
    .activeOffsetY([-5, 5])   // Reduce sensitivity to accidental vertical drags
    .onBegin(() => {
      // Reset any existing animations when gesture begins
      'worklet';
    })
    .onUpdate((event) => {
      'worklet';
      // Apply light resistance to the drag motion for more natural feel
      const resistance = 0.8;
      translateX.value = event.translationX * resistance;
      
      // Gentle rotation based on drag position
      rotate.value = interpolate(
        event.translationX,
        [-width, width],
        [-8, 8], // Reduced rotation for subtlety
        Extrapolation.CLAMP
      );
      
      // Subtle scale effect during drag
      scale.value = interpolate(
        Math.abs(event.translationX),
        [0, width],
        [1, 0.97], // Very subtle scale change
        Extrapolation.CLAMP
      );
      
      // Gradual, clear opacity transition for feedback icons
      if (event.translationX > 40) {
        // Show match feedback with smooth, gradual appearance
        matchOpacity.value = interpolate(
          event.translationX,
          [40, width * 0.6], // Adjusted range for better visibility
          [0, 1],
          Extrapolation.CLAMP
        );
        matchScale.value = interpolate(
          event.translationX,
          [40, width * 0.6],
          [0.5, 1.1], // Increased scale range for more noticeable effect
          Extrapolation.CLAMP
        );
      } else if (event.translationX < -40) {
        // Show skip feedback with smooth, gradual appearance
        skipOpacity.value = interpolate(
          event.translationX,
          [-width * 0.6, -40], // Adjusted range for better visibility
          [1, 0],
          Extrapolation.CLAMP
        );
        skipScale.value = interpolate(
          event.translationX,
          [-width * 0.6, -40],
          [1.1, 0.5], // Increased scale range for more noticeable effect
          Extrapolation.CLAMP
        );
      } else {
        // Fade out feedback when not swiping far enough
        matchOpacity.value = withTiming(0, { duration: 250 });
        skipOpacity.value = withTiming(0, { duration: 250 });
        matchScale.value = withTiming(0.5, { duration: 250 });
        skipScale.value = withTiming(0.5, { duration: 250 });
      }
    })
    .onEnd((event) => {
      'worklet';
      // Increased swipe threshold for more intentional swiping
      const swipeThreshold = width * 0.35; // Increased 0.35
      
      // Check if swipe is forceful enough or far enough
      const isSwipeForceful = Math.abs(event.velocityX) > 800; // Increased threshold
      const isSwipeFarEnough = Math.abs(event.translationX) > swipeThreshold;
      
      if (isSwipeForceful || isSwipeFarEnough) {
        // Swipe right (match)
        if (event.translationX > 0) {
          // Smooth glide off-screen with ease-out effect
          translateX.value = withTiming(width * 2, { 
            duration: 400 // Slower, smoother animation
          });
          rotate.value = withTiming(8, { 
            duration: 400
          });
          opacity.value = withTiming(0, { duration: 300 });
          matchOpacity.value = withTiming(1, { duration: 200 });
          matchScale.value = withTiming(1, { duration: 200 });
          
          // Trigger haptic feedback
          runOnJS(Haptics.impactAsync)(Haptics.ImpactFeedbackStyle.Medium);
          
          // Call onSwipe after animation with delay for smoothness
          setTimeout(() => {
            runOnJS(onSwipe)('right', cat.id);
          }, 350);
        } 
        // Swipe left (skip)
        else {
          // Smooth glide off-screen with ease-out effect
          translateX.value = withTiming(-width * 2, { 
            duration: 400 // Slower, smoother animation
          });
          rotate.value = withTiming(-8, { 
            duration: 400
          });
          opacity.value = withTiming(0, { duration: 300 });
          skipOpacity.value = withTiming(1, { duration: 200 });
          skipScale.value = withTiming(1, { duration: 200 });
          
          // Trigger haptic feedback
          runOnJS(Haptics.impactAsync)(Haptics.ImpactFeedbackStyle.Light);
          
          // Call onSwipe after animation with delay for smoothness
          setTimeout(() => {
            runOnJS(onSwipe)('left', cat.id);
          }, 350);
        }
      } else {
        // Return to center with smooth spring animation
        translateX.value = withSpring(0, {
          damping: 15, // More damping for smoother return
          stiffness: 100, // Less stiffness for softer motion
          mass: 0.8 // Slightly lighter mass for fluidity
        });
        rotate.value = withSpring(0, {
          damping: 15,
          stiffness: 100,
          mass: 0.8
        });
        scale.value = withSpring(1, {
          damping: 15,
          stiffness: 100,
          mass: 0.8
        });
        
        // Smoothly fade out feedback icons
        matchOpacity.value = withTiming(0, { duration: 300 });
        skipOpacity.value = withTiming(0, { duration: 300 });
        matchScale.value = withTiming(0.3, { duration: 300 });
        skipScale.value = withTiming(0.3, { duration: 300 });
      }
    });

  // Tap gesture to open cat details
  const tapGesture = Gesture.Tap()
    .numberOfTaps(1)
    .onEnd(() => {
      'worklet';
      runOnJS(router.push)({
        pathname: '/cat-profile-search',
        params: {
          catId: cat.id.toString(),
          gender: cat.gender || '',
          myCatId: selectedCat?.id?.toString() || '',
          myCatGender: selectedCat?.gender || ''
        }
      });
    });

  // Combine gestures
  const composedGesture = Gesture.Race(panGesture, tapGesture);

  return (
    <GestureDetector gesture={composedGesture}>
      <Animated.View 
        style={[
          styles.card, 
          cardAnimatedStyle
        ]}
      >
        {/* Match/Skip feedback icons */}
        <Animated.View style={[styles.feedbackContainer, matchAnimatedStyle]}>
          <View style={[styles.feedbackIcon, styles.matchIcon]}>
            <Text style={styles.feedbackText}>❤️ Match</Text>
          </View>
        </Animated.View>
        
        <Animated.View style={[styles.feedbackContainer, skipAnimatedStyle]}>
          <View style={[styles.feedbackIcon, styles.skipIcon]}>
            <Text style={styles.feedbackText}>❌ Skip</Text>
          </View>
        </Animated.View>
        
        <Image source={{ uri: cat.image }} style={styles.catImage} />

        <CompatibilityBadge score={cat.compatibilityScore} />
        
        <View style={styles.cardContent}>
          <View style={styles.catInfo}>
            <Text style={styles.catName}>{cat.name}</Text>
            <Text style={styles.catDetails}>{cat.age} years • {cat.breed}</Text>
            {cat.location && (
              <Text style={styles.catLocation}>📍 {cat.location}</Text>
            )}
          </View>
        </View>
        
        <View style={styles.tapHint}>
          <Icon name="information-circle" size={16} color={colors.textLight} />
          <Text style={styles.tapHintText}>Tap for details</Text>
        </View>
      </Animated.View>
    </GestureDetector>
  );
};

export default function DiscoverScreen() {
  const router = useRouter();
  const [cats, setCats] = useState<Cat[]>([]);
  const [selectedCat, setSelectedCat] = useState<Cat | null>(null);
  const [showCatDropdown, setShowCatDropdown] = useState(false);
  const [myCats, setMyCats] = useState<Cat[]>([]);
  const [loading, setLoading] = useState(true);
  const [showEmptyState, setShowEmptyState] = useState(false);
  const [sessionUserId, setSessionUserId] = useState<string | null>(null);
  const emptyStateOpacity = useSharedValue(0);
  const emptyStateScale = useSharedValue(0.95);
  const [noMatches, setNoMatches] = useState(false);

   const emptyStateAnimatedStyle = useAnimatedStyle(() => ({
    opacity: emptyStateOpacity.value,
    transform: [{ scale: emptyStateScale.value }],
  }));


  // 🔐 Get logged-in user session
  const fetchSession = async () => {
    const { data, error } = await supabase.auth.getSession();
    if (error) {
      console.error('Error getting session:', error);
      return;
    }
    setSessionUserId(data.session?.user?.id || null);
  };

  // Fetch user's cats from database when component mounts
  useEffect(() => {
    fetchSession();
    fetchUserCats();
  }, []);

  useEffect(() => {
  if (showEmptyState) {
    // Animate in when empty state is shown
    emptyStateOpacity.value = withTiming(1, { duration: 500 });
    emptyStateScale.value = withTiming(1, { duration: 500, easing: Easing.out(Easing.ease) });
  } else {
    // Animate out when hidden
    emptyStateOpacity.value = withTiming(0, { duration: 300 });
    emptyStateScale.value = withTiming(0.95, { duration: 300 });
  }
}, [showEmptyState]);


  // Fetch potential matches whenever selected cat changes
useEffect(() => {
  if (selectedCat) {
    fetchPotentialMatches(selectedCat);
  }
}, [selectedCat, sessionUserId]);

// Add this function after fetchSession
const fetchUserCats = async () => {
  try {
    setLoading(true);
    
    // Get current logged-in user
    const { data: { user }, error: userError } = await supabase.auth.getUser();
    
    if (userError || !user) {
      console.error('User not found');
      setLoading(false);
      return;
    }
    
    setSessionUserId(user.id);
    const ownerId = user.id;

    // Fetch female cats owned by the user
    const { data: femaleCats, error: femaleError } = await supabase
      .from('female_cats')
      .select('*')
      .eq('owner_id', ownerId)
      .eq('active_status', true)
      .eq('approval_status', true); 

    if (femaleError) {
      console.error('Female cats fetch error:', femaleError);
    }

    // Fetch male cats owned by the user
    const { data: maleCats, error: maleError } = await supabase
      .from('male_cats')
      .select('*')
      .eq('owner_id', ownerId)
      .eq('active_status', true)
      .eq('approval_status', true); 


    if (maleError) {
      console.error('Male cats fetch error:', maleError);
    }

    // Combine both into one array with proper typing
    const userCats: Cat[] = [
      ...(femaleCats || []).map(cat => ({
        ...cat,
        id: cat.female_cat_id,
        gender: 'female' as const,
        profile_image_url: cat.profile_image_url,
        name: cat.name,
        breed: cat.breed,
        age: cat.age,
        personality: [],
        image: cat.profile_image_url || '',
        owner_id: cat.owner_id,
        active_status: cat.active_status
      })),
      ...(maleCats || []).map(cat => ({
        ...cat,
        id: cat.male_cat_id,
        gender: 'male' as const,
        profile_image_url: cat.profile_image_url,
        name: cat.name,
        breed: cat.breed,
        age: cat.age,
        personality: [],
        image: cat.profile_image_url || '',
        owner_id: cat.owner_id,
        active_status: cat.active_status
      }))
    ];

    setMyCats(userCats);

    // Don't auto-select any cat - let user choose
    // const activeCats = userCats.filter(cat => cat.active_status === true);
    // if (activeCats.length > 0) {
    //   setSelectedCat(activeCats[0]);
    // }
  } catch (error) {
    console.error('Unexpected error fetching user cats:', error);
  } finally {
    setLoading(false);
  }
};

 // Helper function to calculate distance between two coordinates (Haversine formula)
const calculateDistance = (lat1: number, lon1: number, lat2: number, lon2: number): number => {
  const R = 6371; // Earth's radius in kilometers
  const dLat = (lat2 - lat1) * Math.PI / 180;
  const dLon = (lon2 - lon1) * Math.PI / 180;
  const a = 
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos(lat1 * Math.PI / 180) * Math.cos(lat2 * Math.PI / 180) *
    Math.sin(dLon / 2) * Math.sin(dLon / 2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  return R * c; // Distance in kilometers
};

// Helper function to calculate compatibility score
const calculateCompatibilityScore = (
  selectedCat: Cat & { latitude?: number; longtitude?: number },
  potentialCat: any
): number => {
  let score = 0;

  // 1. Breed Matching (40 points max)
  if (selectedCat.breed && potentialCat.breed) {
    const selectedBreed = selectedCat.breed.toLowerCase().trim();
    const potentialBreed = potentialCat.breed.toLowerCase().trim();
    
    if (selectedBreed === potentialBreed) {
      score += 40; // Perfect breed match
    } else if (selectedBreed.includes(potentialBreed) || potentialBreed.includes(selectedBreed)) {
      score += 20; // Partial breed match
    }
  }

  // 2. Age Compatibility (30 points max)
  if (selectedCat.age && potentialCat.age) {
    const ageDifference = Math.abs(selectedCat.age - potentialCat.age);
    
    if (ageDifference === 0) {
      score += 30; // Same age
    } else if (ageDifference === 1) {
      score += 25; // 1 year difference
    } else if (ageDifference === 2) {
      score += 20; // 2 years difference
    } else if (ageDifference <= 3) {
      score += 15; // 3 years difference
    } else if (ageDifference <= 5) {
      score += 10; // 4-5 years difference
    } else {
      score += 5; // More than 5 years difference
    }
  }

  // 3. Location Proximity (30 points max)
  if (selectedCat.latitude && selectedCat.longtitude && 
      potentialCat.latitude && potentialCat.longtitude) {
    const distance = calculateDistance(
      Number(selectedCat.latitude),
      Number(selectedCat.longtitude),
      Number(potentialCat.latitude),
      Number(potentialCat.longtitude)
    );

    if (distance < 5) {
      score += 30; // Within 5 km
    } else if (distance < 10) {
      score += 25; // Within 10 km
    } else if (distance < 20) {
      score += 20; // Within 20 km
    } else if (distance < 50) {
      score += 15; // Within 50 km
    } else if (distance < 100) {
      score += 10; // Within 100 km
    } else {
      score += 5; // Beyond 100 km
    }
  }

  return score; // Maximum score: 100
};

// Function to fetch potential matches based on selected cat
const fetchPotentialMatches = async (selectedCat: Cat) => {
  try {
    if (!selectedCat || !sessionUserId) return;

    const isSelectedMale = selectedCat.gender === 'male';
    const targetTable = isSelectedMale ? 'female_cats' : 'male_cats';
    const targetIdField = isSelectedMale ? 'female_cat_id' : 'male_cat_id';
    const selectedCatId = selectedCat.id;

    // Step 1: Get existing matches to exclude
    const { data: existingMatches, error: matchError } = await supabase
      .from('matchmaking')
      .select('male_cat_id, female_cat_id')
      .eq(isSelectedMale ? 'male_cat_id' : 'female_cat_id', selectedCatId)
      .in('status', ['pending', 'approved']);

    if (matchError) {
      console.error('Error fetching existing matches:', matchError);
    }

    const excludeIds = existingMatches?.map(m => 
      isSelectedMale ? m.female_cat_id : m.male_cat_id
    ) || [];

    // Step 2: Fetch potential matches with location data
    let query = supabase
      .from(targetTable)
      .select('*, owner:owner_id(name)')
      .eq('active_status', true)
      .eq('approval_status', true)
      .neq('owner_id', sessionUserId);

    if (excludeIds.length > 0) {
      query = query.not(targetIdField, 'in', `(${excludeIds.join(',')})`);
    }

    const { data: potentialMatches, error: fetchError } = await query;

    if (fetchError) {
      console.error('Error fetching potential matches:', fetchError);
      return;
    }

    // Step 3: Fetch selected cat's location data
    const selectedCatTable = selectedCat.gender === 'male' ? 'male_cats' : 'female_cats';
    const selectedCatIdField = selectedCat.gender === 'male' ? 'male_cat_id' : 'female_cat_id';
    
    const { data: selectedCatData } = await supabase
      .from(selectedCatTable)
      .select('latitude, longtitude, breed, age')
      .eq(selectedCatIdField, selectedCat.id)
      .single();

    const enrichedSelectedCat = {
      ...selectedCat,
      latitude: selectedCatData?.latitude,
      longtitude: selectedCatData?.longtitude,
      breed: selectedCatData?.breed || selectedCat.breed,
      age: selectedCatData?.age || selectedCat.age
    };

    // Step 4: Calculate compatibility scores and sort
    const catsWithScores = (potentialMatches || []).map(cat => ({
      cat,
      score: calculateCompatibilityScore(enrichedSelectedCat, cat)
    }));

    // Sort by compatibility score (highest first)
    catsWithScores.sort((a, b) => b.score - a.score);

    // Transform to Cat type with compatibility scores
    const transformedCats: Cat[] = catsWithScores.map(({ cat, score }) => ({
      id: cat[targetIdField],
      name: cat.name,
      breed: cat.breed || 'Unknown',
      age: cat.age || 0,
      personality: [],
      image: cat.profile_image_url || 'https://placekitten.com/400/400',
      location: cat.location_address || 'Location not specified',
      profile_image_url: cat.profile_image_url,
      gender: isSelectedMale ? 'female' : 'male',
      owner_id: cat.owner_id,
      owner: cat.owner?.name || 'Unknown Owner',
      compatibilityScore: score
    }));

    console.log('🎯 Sorted cats by compatibility:', catsWithScores.map(c => ({
      name: c.cat.name,
      score: c.score
    })));

    setCats(transformedCats);
    
    // ✅ KEY FIX: Only show empty state if no cats from the start
    if (transformedCats.length === 0) {
      setShowEmptyState(true);
      setNoMatches(true); // No cats available at all
    } else {
      setShowEmptyState(false);
      setNoMatches(false);
    }
  } catch (error) {
    console.error('Unexpected error fetching potential matches:', error);
  }
};


  const handleCatSelection = (cat: Cat) => {
    setSelectedCat(cat);
    setShowCatDropdown(false);
    console.log('Selected cat for matching:', cat.name);
  };

 const handleSwipe = async (direction: 'left' | 'right', catId: number) => {
  console.log(`Swiped ${direction} on cat with id ${catId}`);
  
  const updatedCats = cats.filter(cat => cat.id !== catId);
  setCats(updatedCats);

  // If swiped right, create match request
  if (direction === 'right' && selectedCat) {
    const swipedCat = cats.find(cat => cat.id === catId);
    if (!swipedCat) return;

    const isSelectedMale = selectedCat.gender === 'male';
    
    const matchData = {
      male_cat_id: isSelectedMale ? selectedCat.id : catId,
      female_cat_id: isSelectedMale ? catId : selectedCat.id,
      status: 'pending',
      requester_id: sessionUserId,
      receiver_id: swipedCat.owner_id
    };

    const { error } = await supabase
      .from('matchmaking')
      .insert([matchData]);

    if (error) {
      console.error('Error creating match:', error);
    } else {
      console.log('Match request created successfully!');
    }
  }

  // ✅ KEY FIX: If no cats left after swiping, show "check back later" message
  if (updatedCats.length === 0) {
    console.log('🔍 No more cats - showing empty state');
    setShowEmptyState(true);
    setNoMatches(false); // ← Swiped through all, not truly "no matches"
    emptyStateOpacity.value = withTiming(1, { duration: 300 });
    emptyStateScale.value = withTiming(1, { duration: 300 });
  }
};
  // Function to reload the cat list
 const reloadCatList = () => {
  setShowEmptyState(false);
  setLoading(true);  
  setNoMatches(false);
// Add loading state
  
  // Reset animation values
  emptyStateOpacity.value = withTiming(0, { duration: 300 });
  emptyStateScale.value = withTiming(0.95, { duration: 300 });
  
  // Reload potential matches for the selected cat
  if (selectedCat) {
    fetchPotentialMatches(selectedCat).finally(() => {
      setLoading(false);
    });
  } else {
    setLoading(false);
  }
};


  const handleCatPress = () => {
    if (cats.length > 0) {
      const currentCat = cats[0]; // First cat is always the top one
      console.log('Cat card pressed:', currentCat.name);
      router.push({
        pathname: '/cat-profile',
        params: {
          catId: currentCat.id.toString(),
          catName: currentCat.name,
          owner: currentCat.owner || 'Unknown Owner'
        }
      });
    }
  };

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()}>
          <Icon name="arrow-back" size={24} color={colors.text} />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Discover</Text>
        <TouchableOpacity onPress={() => setShowCatDropdown(true)}>
          <Icon name="paw" size={24} color={colors.primary} />
        </TouchableOpacity>
      </View>

      {/* Vertical Cat Selection Popup */}
      {/* 🔒 Force user to pick one of their cats before continuing */}
<Modal 
  visible={showCatDropdown || !selectedCat} // 👈 force open if no cat selected
  transparent 
  animationType="slide"
  onRequestClose={() => {
    if (selectedCat) setShowCatDropdown(false);
  }}
>
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
          <Text style={styles.modalOptionText}>Loading your cats...</Text>
        ) : myCats.filter((cat) => cat.owner_id === sessionUserId && cat.active_status === true &&
      cat.approval_status === true).length > 0 ? (
          myCats
            .filter((cat) => cat.owner_id === sessionUserId && cat.active_status === true &&
      cat.approval_status === true) // ✅ Only current user's active cats
            .map((cat) => (
              <TouchableOpacity
                key={`${cat.gender}-${cat.id}`}
                style={styles.modalItem}
                onPress={() => handleCatSelection(cat)}
              >
                <Image
                  source={{ uri: cat.profile_image_url || 'https://placekitten.com/200/200' }}
                  style={styles.modalImage}
                />
                <View>
                  <Text style={styles.modalCatName}>{cat.name}</Text>
                  <Text style={styles.modalCatInfo}>
                    {cat.gender?.toUpperCase()} • {cat.breed}
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
              Please add a cat profile first to start discovering matches, or wait until your cat's vaccination is complete.
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
{selectedCat && (
        <View style={styles.selectedCatBanner}>
          <Text style={styles.selectedCatText}>
            Showing matches for: <Text style={{ fontWeight: '700' }}>{selectedCat.name}</Text> 🐾
          </Text>
        </View>
      )}

      <View style={styles.cardContainer}>
        {!selectedCat ? (
          // Show prompt when no cat is selected
          <View style={styles.selectPromptContainer}>
            <Text style={styles.selectPromptText}>
              🐾 Please select your cat to start discovering matches.
            </Text>
          </View>
       ) : showEmptyState ? (
          // Empty state when all cards have been swiped
          <Animated.View style={[styles.emptyCardContainer, emptyStateAnimatedStyle]}>
    <View style={styles.emptyCard}>
      {noMatches ? (
        <>
          <Text style={styles.emptyCardText}>
            😿 No other cats found right now!{'\n\n'}
            Try again later — new cats might join soon.
          </Text>
          <TouchableOpacity
            style={styles.reloadButton}
            onPress={reloadCatList}
          >
            <Text style={styles.reloadButtonText}>Reload</Text>
          </TouchableOpacity>
        </>
      ) : (
        <>
          <Text style={styles.emptyCardText}>
            😿 You’ve seen all available cats!{'\n\n'}
            Check back later for new matches.
          </Text>
          <TouchableOpacity
            style={styles.reloadButton}
            onPress={reloadCatList}
          >
            <Text style={styles.reloadButtonText}>Reload</Text>
          </TouchableOpacity>
        </>
      )}
    </View>
  </Animated.View>
        ) : cats.length > 0 ? (
          // Show only the first cat card
          <AnimatedCard
            key={cats[0].id}
            cat={cats[0]}
            onSwipe={handleSwipe}
            isActive={true}
            router={router}
            selectedCat={selectedCat}
          />
        ) : null}
      </View>

      {/* Action buttons - hidden when empty state is shown or no cat selected */}
      {!showEmptyState && cats.length > 0 && selectedCat && (
        <View style={styles.actionButtons}>
          <TouchableOpacity
            style={[styles.actionButton, styles.passButton]}
            onPress={() => handleSwipe('left', cats[0].id)}
          >
            <Icon name="close" size={32} color={colors.white} />
          </TouchableOpacity>

          <TouchableOpacity
            style={[styles.actionButton, styles.likeButton]}
            onPress={() => handleSwipe('right', cats[0].id)}
          >
            <Icon name="heart" size={32} color={colors.white} />
          </TouchableOpacity>
        </View>
      )}

      {/* Bottom navigation bar */}
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
    padding: 16,
  },
  headerTitle: {
    fontSize: 20,
    fontWeight: '600',
    color: colors.text,
  },
  cardContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingVertical: 20,
    marginBottom: 150, // Make room for fixed buttons
  },
  // New styles for empty card state
  emptyCardContainer: {
    width: '100%',
    height: '100%',
    justifyContent: 'center',
    alignItems: 'center',
    
  },
  emptyCard: {
    width: '100%',
    maxWidth: 400,
    height: height * 0.65,
    backgroundColor: colors.white,
    borderRadius: 24,
    overflow: 'hidden',
    elevation: 6,
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 4,
    },
    shadowOpacity: 0.18,
    shadowRadius: 8,
    borderWidth: 1,
    borderColor: 'rgba(0, 0, 0, 0.03)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 30,
  },
  emptyCardText: {
    fontSize: 18,
    color: colors.textLight,
    textAlign: 'center',
    marginBottom: 30,
    lineHeight: 24,
  },
  reloadButton: {
    backgroundColor: colors.primary,
    paddingHorizontal: 24,
    paddingVertical: 12,
    borderRadius: 12,
  },
  reloadButtonText: {
    color: colors.white,
    fontSize: 16,
    fontWeight: '600',
  },
  card: {
    width: '100%',
    maxWidth: 400,
    height: height * 0.65,
    backgroundColor: colors.white,
    borderRadius: 24, // Slightly larger radius for softer look
    overflow: 'hidden',
    elevation: 6,
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 4,
    },
    shadowOpacity: 0.18,
    shadowRadius: 8,
    // Add subtle border for better definition
    borderWidth: 1,
    borderColor: 'rgba(0, 0, 0, 0.03)',
  },
  catImage: {
    width: '100%',
    height: '70%',
    resizeMode: 'cover',
  },
  cardContent: {
    flex: 1,
    padding: 20,
    justifyContent: 'flex-end', // Align content to bottom
  },
  catInfo: {
    marginBottom: 16,
    alignItems: 'flex-start',
  },
  catName: {
    fontSize: 28,
    fontWeight: '700',
    color: colors.text,
    marginBottom: 4,
    textAlign: 'left',
  },
  catDetails: {
    fontSize: 16,
    color: colors.textLight,
    textAlign: 'left',
  },
  catLocation: {
    fontSize: 14,
    color: colors.textLight,
    marginTop: 4,
  },
  actionButtons: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingVertical: 30,
    gap: 40,
    position: 'absolute',
    bottom: 80, // Position above bottom navigation
    left: 0,
    right: 0,
    zIndex: 10,
  },
  actionButton: {
    width: 60,
    height: 60,
    borderRadius: 30,
    justifyContent: 'center',
    alignItems: 'center',
    elevation: 3,
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.25,
    shadowRadius: 3.84,
  },
  passButton: {
    backgroundColor: colors.textLight,
  },
  likeButton: {
    backgroundColor: colors.primary,
  },
  tapHint: {
    position: 'absolute',
    top: 16,
    right: 16,
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(255, 255, 255, 0.9)',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 12,
  },
  tapHintText: {
    fontSize: 12,
    color: colors.textLight,
    marginLeft: 4,
  },
  catSelector: {
    padding: 4,
  },
  
  // Modal styles matching search-partner.tsx
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
  modalImage: {
    width: 50,
    height: 50,
    borderRadius: 25,
    marginRight: 10,
  },
  modalCatName: {
    fontSize: 16,
    fontWeight: '600',
  },
  modalCatInfo: {
    fontSize: 12,
    color: colors.textLight,
  },
  modalOptionText: {
    fontSize: 16,
    color: colors.text,
    paddingVertical: 12,
    textAlign: 'center',
  },
  closeButton: {
    backgroundColor: colors.primary,
    padding: 10,
    borderRadius: 10,
    marginTop: 10,
  },
  closeText: {
    color: colors.white,
    textAlign: 'center',
    fontWeight: '600',
  },
  
  // New styles for swipe feedback
  feedbackContainer: {
    position: 'absolute',
    top: 50,
    left: 0,
    right: 0,
    alignItems: 'center',
    zIndex: 100,
  },
  feedbackIcon: {
    paddingVertical: 12,
    paddingHorizontal: 24,
    borderRadius: 35,
    overflow: 'hidden',
    // Enhanced glowing effect
    shadowColor: colors.primary,
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0.6,
    shadowRadius: 15,
    elevation: 8,
    borderWidth: 2,
  },
  matchIcon: {
    backgroundColor: 'rgba(255, 107, 53, 0.25)', // Primary color with more opacity
    borderColor: colors.primary,
  },
  skipIcon: {
    backgroundColor: 'rgba(127, 140, 141, 0.25)', // Text light color with more opacity
    borderColor: colors.textLight,
  },
  feedbackText: {
    fontSize: 28,
    fontWeight: 'bold',
    color: colors.text,
    textShadowColor: 'rgba(0, 0, 0, 0.3)',
    textShadowOffset: { width: 1, height: 1 },
    textShadowRadius: 2,
  },
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
  // Add to your styles object
  // Compatibility Badge Styles
  compatibilityBadge: {
    position: 'absolute',
    top: 16,
    left: 16,
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 8,
    paddingHorizontal: 12,
    borderRadius: 20,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.25,
    shadowRadius: 3.84,
    elevation: 5,
    zIndex: 50,
  },
  greatMatchBadge: {
    backgroundColor: '#FF6B35',
  },
  goodMatchBadge: {
    backgroundColor: '#4A90E2',
  },
  possibleMatchBadge: {
    backgroundColor: '#9B59B6',
  },
  badgeEmoji: {
    fontSize: 20,
    marginRight: 6,
  },
  badgeTextContainer: {
    flexDirection: 'column',
  },
  badgeTitle: {
    fontSize: 12,
    fontWeight: '700',
    color: colors.white,
    lineHeight: 14,
  },
  badgePercentage: {
    fontSize: 10,
    fontWeight: '600',
    color: 'rgba(255, 255, 255, 0.9)',
    lineHeight: 12,
  },
});