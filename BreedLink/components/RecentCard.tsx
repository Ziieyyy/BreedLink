import React, { useState, useEffect } from 'react';
import { View, Text, TouchableOpacity, StyleSheet, ScrollView, Modal, Image } from 'react-native';
import { useRouter } from 'expo-router';
import { colors } from '../styles/commonStyles';
import Icon from './Icon';
import VaccinationReminderScreen from './VaccinationReminderScreen';
import CustomAlert, { AlertType } from './CustomAlert';
import { supabase } from '../supabase';

interface PendingMatch {
  id: string;
  name: string;
  breed: string;
  age: number;
  gender: 'male' | 'female';
  image: string;
  location?: string;
  owner: string;
  description: string;
  catId: number;
  receiverCatId: number;
  receiverCatGender: 'male' | 'female';
}

interface VaccinationNotification {
  id: string;
  catId: string;
  catName: string;
  catBreed: string;
  catAge: number;
  catImage: string;
  expiredDate: string;
  lastVaccination: string;
  status: 'Expired' | 'Due Soon';
  vaccineType: string;
}

export interface RecentActivity {
  id: string;
  type: 'match' | 'update' | 'message';
  title: string;
  subtitle: string;
  time: string;
  notification?: VaccinationNotification;
}

interface RecentCardProps {
  activities: RecentActivity[];
  onActivityPress?: (activity: RecentActivity) => void;
}

const getActivityIcon = (type: RecentActivity['type']) => {
  switch (type) {
    case 'match':
      return 'heart';
    case 'update':
      return 'checkmark-circle';
    case 'message':
      return 'chatbubble';
    default:
      return 'notifications';
  }
};

const getActivityColor = (type: RecentActivity['type']) => {
  switch (type) {
    case 'match':
      return '#FF6B6B';
    case 'update':
      return colors.success;
    case 'message':
      return '#4ECDC4';
    default:
      return colors.textLight;
  }
};

// Mock vaccination data
const mockCats = [
  {
    id: '1',
    name: 'Milo',
    breed: 'Persian',
    age: 2,
    image: 'https://images.unsplash.com/photo-1514888286974-6c03e2ca1dba?w=100&h=100&fit=crop',
    vaccinations: {
      rabies: {
        name: 'Rabies',
        lastVaccinationDate: '2024-03-12',
        expiryDate: '2025-09-12',
      },
      fvrcp: {
        name: 'FVRCP',
        lastVaccinationDate: '2024-03-12',
        expiryDate: '2025-09-12',
      },
    },
  },
  {
    id: '2',
    name: 'Luna',
    breed: 'Siamese',
    age: 3,
    image: 'https://images.unsplash.com/photo-1543852786-1cf6624b9987?w=100&h=100&fit=crop',
    vaccinations: {
      rabies: {
        name: 'Rabies',
        lastVaccinationDate: '2024-03-15',
        expiryDate: '2025-09-15',
      },
    },
  },
];

export default function RecentCard({ activities, onActivityPress }: RecentCardProps) {
  const router = useRouter();
  const [showMatchPanel, setShowMatchPanel] = useState(false);
  const [showVaccinationReminder, setShowVaccinationReminder] = useState(false);
  const [selectedVaccinationNotification, setSelectedVaccinationNotification] =
    useState<VaccinationNotification | null>(null);
  const [vaccinationNotifications, setVaccinationNotifications] = useState<VaccinationNotification[]>([]);
  const [userId, setUserId] = useState<string | null>(null);
  const [pendingMatches, setPendingMatches] = useState<PendingMatch[]>([]);
  const [myCats, setMyCats] = useState<Array<{ id: number; gender: 'male' | 'female' }>>([]);
  const [alert, setAlert] = useState<{ visible: boolean; type: AlertType; title: string; message: string; showCancelButton?: boolean; onConfirm?: () => void }>({ 
    visible: false, 
    type: 'error', 
    title: '', 
    message: '',
    showCancelButton: false 
  });

  // ✅ Get logged-in user
  useEffect(() => {
    const fetchUser = async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (user) setUserId(user.id);
    };

    fetchUser();

    const { data: subscription } = supabase.auth.onAuthStateChange((_event, session) => {
      setUserId(session?.user?.id || null);
    });

    return () => subscription.subscription.unsubscribe();
  }, []);

  // ✅ Fetch current user's cats for match navigation
  useEffect(() => {
    const fetchMyCats = async () => {
      if (!userId) return;

      const cats: Array<{ id: number; gender: 'male' | 'female' }> = [];

      // Fetch male cats
      const { data: maleCats } = await supabase
        .from('male_cats')
        .select('male_cat_id')
        .eq('owner_id', userId);

      if (maleCats) {
        cats.push(...maleCats.map(cat => ({ id: cat.male_cat_id, gender: 'male' as const })));
      }

      // Fetch female cats
      const { data: femaleCats } = await supabase
        .from('female_cats')
        .select('female_cat_id')
        .eq('owner_id', userId);

      if (femaleCats) {
        cats.push(...femaleCats.map(cat => ({ id: cat.female_cat_id, gender: 'female' as const })));
      }

      setMyCats(cats);
    };

    fetchMyCats();
  }, [userId]);

  // ✅ Fetch pending matches
  useEffect(() => {
    const fetchPendingMatches = async () => {
      if (!userId) return;

      const { data: matches, error } = await supabase
        .from('matchmaking')
        .select(`
          match_id,
          male_cat_id,
          female_cat_id,
          status,
          requester_id,
          receiver_id
        `)
        .eq('receiver_id', userId)
        .eq('status', 'pending');

      if (error) {
        console.error('Error fetching matches:', error);
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
          const requesterCatId = match.requester_id === maleCat?.owner_id ? match.male_cat_id : match.female_cat_id;
          const requesterGender = match.requester_id === maleCat?.owner_id ? 'male' : 'female';
          const receiverCatId = match.receiver_id === maleCat?.owner_id ? match.male_cat_id : match.female_cat_id;
          const receiverGender = match.receiver_id === maleCat?.owner_id ? 'male' : 'female';

          detailedMatches.push({
            id: match.match_id.toString(),
            name: requesterCat.name,
            breed: requesterCat.breed,
            age: requesterCat.age,
            gender: requesterGender as 'male' | 'female',
            image: requesterCat.profile_image_url,
            location: '',
            owner: catOwner,
            description: `${requesterCat.name} is interested in matching with your cat ${receiverCat.name}.`,
            catId: requesterCatId,
            receiverCatId: receiverCatId,
            receiverCatGender: receiverGender as 'male' | 'female',
          });
        }
      }

      setPendingMatches(detailedMatches);
    };

    fetchPendingMatches();
  }, [userId]);

  // ✅ Vaccination Notifications
  useEffect(() => {
    const notifications: VaccinationNotification[] = [];
    const today = new Date();

    mockCats.forEach(cat => {
      Object.entries(cat.vaccinations).forEach(([key, v]) => {
        const expiry = new Date(v.expiryDate);
        const days = Math.ceil((expiry.getTime() - today.getTime()) / (1000 * 3600 * 24));
        if (days <= 7) {
          notifications.push({
            id: `${cat.id}-${key}`,
            catId: cat.id,
            catName: cat.name,
            catBreed: cat.breed,
            catAge: cat.age,
            catImage: cat.image,
            expiredDate: expiry.toLocaleDateString('en-GB'),
            lastVaccination: new Date(v.lastVaccinationDate).toLocaleDateString('en-GB'),
            status: days <= 0 ? 'Expired' : 'Due Soon',
            vaccineType: v.name,
          });
        }
      });
    });

    setVaccinationNotifications(notifications);
  }, []);

  const allActivities: RecentActivity[] = [
    { id: '1', type: 'match', title: 'New Match Found!', subtitle: 'Check your pending requests', time: '2 hours ago' },
    ...(vaccinationNotifications.length > 0
      ? [
          {
            id: vaccinationNotifications[0].id,
            type: 'update' as const,
            title: `💉 ${vaccinationNotifications[0].catName}'s ${vaccinationNotifications[0].vaccineType} vaccine is ${vaccinationNotifications[0].status.toLowerCase()}`,
            subtitle: 'Upload proof now',
            time: '2 days ago',
            notification: vaccinationNotifications[0],
          },
        ]
      : []),
    { id: '3', type: 'message', title: 'New Message', subtitle: 'A breeder sent you a message', time: 'Just now' },
  ];

  const handleActivityPress = (activity: RecentActivity) => {
    if (activity.type === 'match') {
      setShowMatchPanel(true);
    } else if (activity.type === 'update' && activity.notification) {
      setSelectedVaccinationNotification(activity.notification);
      setShowVaccinationReminder(true);
    } else {
      onActivityPress?.(activity);
    }
  };

  const handleApprove = async (matchId: string) => {
    setAlert({
      visible: true,
      type: 'warning',
      title: 'Confirm Approval',
      message: 'Are you sure you want to approve this match request?',
      showCancelButton: true,
      onConfirm: async () => {
        setAlert({ ...alert, visible: false });
        
        const { error } = await supabase
          .from('matchmaking')
          .update({ status: 'approved' })
          .eq('match_id', parseInt(matchId));

        if (error) {
          console.error('Error approving match:', error);
          setAlert({ 
            visible: true, 
            type: 'error', 
            title: 'Error', 
            message: 'Failed to approve this match request.' 
          });
        } else {
          setPendingMatches(prev => prev.filter(m => m.id !== matchId));
          setAlert({ 
            visible: true, 
            type: 'success', 
            title: 'Match Approved ✅', 
            message: 'You have successfully approved this match request.' 
          });
        }
      }
    });
  };


  const handleDecline = async (matchId: string) => {
    setAlert({
      visible: true,
      type: 'warning',
      title: 'Confirm Decline',
      message: 'Are you sure you want to reject this match request?',
      showCancelButton: true,
      onConfirm: async () => {
        setAlert({ ...alert, visible: false });
        
        const { error } = await supabase
          .from('matchmaking')
          .update({ status: 'rejected' })
          .eq('match_id', matchId);

        if (error) {
          console.error('Error rejecting match:', error);
          setAlert({ 
            visible: true, 
            type: 'error', 
            title: 'Error', 
            message: 'Failed to reject the match request.' 
          });
        } else {
          setPendingMatches(prev => prev.filter(m => m.id !== matchId));
          setAlert({ 
            visible: true, 
            type: 'info', 
            title: 'Match Rejected', 
            message: 'You have successfully rejected this request.' 
          });
        }
      }
    });
  };

  const handleViewProfile = (match: PendingMatch) => {
    setShowMatchPanel(false);
    // Navigate to cat-profile-view with matchId for approve/reject actions
    router.push(
      `/cat-profile-view?catId=${match.catId}&gender=${match.gender}&matchId=${match.id}`
    );
  };

  // ✅ UI starts here
  if (!activities || activities.length === 0) return null;

  return (
    <>
      <CustomAlert
        visible={alert.visible}
        type={alert.type}
        title={alert.title}
        message={alert.message}
        showCancelButton={alert.showCancelButton}
        confirmText="OK"
        onConfirm={alert.onConfirm || (() => setAlert({ ...alert, visible: false }))}
        onCancel={() => setAlert({ ...alert, visible: false })}
      />
      <View style={styles.container}>
        <View style={styles.header}>
          <Icon name="time" size={20} color={colors.primary} />
          <Text style={styles.headerTitle}>Recent Activity</Text>
        </View>

        <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.scrollContainer}>
          {allActivities.map(activity => (
            <TouchableOpacity key={activity.id} style={styles.scrollableActivityCard} onPress={() => handleActivityPress(activity)}>
              <View style={[styles.scrollableActivityIcon, { backgroundColor: getActivityColor(activity.type) + '20' }]}>
                <Icon name={activity.type === 'update' ? 'medical' : getActivityIcon(activity.type)} size={24} color={getActivityColor(activity.type)} />
              </View>
              <Text style={styles.scrollableActivityTitle} numberOfLines={2}>{activity.title}</Text>
              <Text style={styles.scrollableActivitySubtitle} numberOfLines={1}>{activity.subtitle}</Text>
              <Text style={styles.scrollableActivityTime}>{activity.time}</Text>
            </TouchableOpacity>
          ))}
        </ScrollView>
      </View>

      {/* Match Modal */}
      <Modal visible={showMatchPanel} animationType="slide" onRequestClose={() => setShowMatchPanel(false)}>
        <View style={styles.modalContainer}>
          <View style={styles.modalHeader}>
            <Text style={styles.modalTitle}>New Matches</Text>
            <TouchableOpacity onPress={() => setShowMatchPanel(false)}><Icon name="close" size={24} color={colors.text} /></TouchableOpacity>
          </View>
          <ScrollView style={styles.matchesList}>
            {pendingMatches.length === 0 ? (
              <Text style={styles.emptyStateText}>No new matches 🐾</Text>
            ) : (
              pendingMatches.map(match => (
                <View key={match.id} style={styles.matchCard}>
                  <TouchableOpacity 
                    style={styles.matchHeader} 
                    onPress={() => handleViewProfile(match)}
                    activeOpacity={0.7}
                  >
                    <Image source={{ uri: match.image }} style={styles.matchImage} />
                    <View style={styles.matchInfo}>
                      <Text style={styles.matchName}>{match.name} {match.gender === 'male' ? '♂' : '♀'} – {match.breed}</Text>
                      <Text style={styles.matchAge}>Age: {match.age}</Text>
                      <Text style={styles.matchDescription}>{match.description}</Text>
                      <Text style={styles.viewProfileHint}>Tap to view profile</Text>
                    </View>
                  </TouchableOpacity>
                  <View style={styles.matchActions}>
                    <TouchableOpacity style={styles.declineButton} onPress={() => handleDecline(match.id)}>
                      <Text style={styles.declineButtonText}>Decline</Text>
                    </TouchableOpacity>
                    <TouchableOpacity style={styles.approveButton} onPress={() => handleApprove(match.id)}>
                      <Text style={styles.approveButtonText}>Approve</Text>
                    </TouchableOpacity>
                  </View>
                </View>
              ))
            )}
          </ScrollView>
        </View>
      </Modal>

      {/* Vaccination Modal */}
      <Modal visible={showVaccinationReminder} animationType="slide" onRequestClose={() => setShowVaccinationReminder(false)}>
        {selectedVaccinationNotification && (
          <VaccinationReminderScreen notification={selectedVaccinationNotification} onClose={() => setShowVaccinationReminder(false)} />
        )}
      </Modal>
    </>
  );
}

// ✅ styles remain unchanged
const styles = StyleSheet.create({
  container: { backgroundColor: colors.white, borderRadius: 16, padding: 20, borderWidth: 1, borderColor: colors.border, marginBottom: 20 },
  header: { flexDirection: 'row', alignItems: 'center', marginBottom: 16 },
  headerTitle: { fontSize: 18, fontWeight: '600', color: colors.text, marginLeft: 8 },
  scrollContainer: { flexGrow: 0, height: 140 },
  scrollableActivityCard: { width: 180, height: 120, backgroundColor: colors.backgroundAlt, borderRadius: 12, padding: 16, borderWidth: 1, borderColor: colors.border, marginRight: 12 },
  scrollableActivityIcon: { width: 40, height: 40, borderRadius: 20, alignItems: 'center', justifyContent: 'center', marginBottom: 8 },
  scrollableActivityTitle: { fontSize: 14, fontWeight: '600', color: colors.text },
  scrollableActivitySubtitle: { fontSize: 12, color: colors.textLight },
  scrollableActivityTime: { fontSize: 11, color: colors.textLight, fontWeight: 'bold' },
  modalContainer: { flex: 1, backgroundColor: colors.background, paddingTop: 60 },
  modalHeader: { flexDirection: 'row', justifyContent: 'space-between', paddingHorizontal: 20, marginBottom: 10 },
  modalTitle: { fontSize: 20, fontWeight: '600', color: colors.text },
  matchesList: { paddingHorizontal: 20 },
  matchCard: { backgroundColor: colors.white, borderRadius: 16, padding: 16, marginBottom: 12, borderWidth: 1, borderColor: colors.border },
  matchHeader: { flexDirection: 'row', alignItems: 'center', marginBottom: 12 },
  matchImage: { width: 60, height: 60, borderRadius: 30, marginRight: 16 },
  matchInfo: { flex: 1 },
  matchName: { fontSize: 16, fontWeight: '600', color: colors.text },
  matchAge: { fontSize: 14, color: colors.textLight },
  matchDescription: { fontSize: 13, color: colors.textLight, marginTop: 4 },
  viewProfileHint: { fontSize: 12, color: colors.primary, marginTop: 6, fontStyle: 'italic' },
  matchActions: { flexDirection: 'row', justifyContent: 'flex-end', gap: 12, marginTop: 8 },
  approveButton: { backgroundColor: colors.primary, paddingHorizontal: 20, paddingVertical: 10, borderRadius: 8 },
  approveButtonText: { color: colors.white, fontWeight: '600' },
  declineButton: { borderWidth: 1, borderColor: colors.error, paddingHorizontal: 20, paddingVertical: 10, borderRadius: 8 },
  declineButtonText: { color: colors.error, fontWeight: '600' },
  emptyStateText: { textAlign: 'center', marginTop: 50, color: colors.textLight },
});
