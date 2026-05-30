import React, { useState, useEffect } from 'react';
import { Text, View, TouchableOpacity, TextInput, StyleSheet, ScrollView, Image, Modal, Alert, ActivityIndicator } from 'react-native';
import { commonStyles, colors, buttonStyles } from '../styles/commonStyles';
import { SafeAreaView } from 'react-native-safe-area-context';
import { router } from 'expo-router';
import Icon from '../components/Icon';
import { supabase } from '../supabase';

export default function UserManagementScreen() {
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedUser, setSelectedUser] = useState<number | null>(null);
  const [showInactiveModal, setShowInactiveModal] = useState(false);
  const [selectedCat, setSelectedCat] = useState<any>(null);
  const [inactivationReason, setInactivationReason] = useState<string>('');
  const [showStatusMessage, setShowStatusMessage] = useState(false);
  const [statusMessage, setStatusMessage] = useState('');
  const [statusTitle, setStatusTitle] = useState('');
  const [showOnlyInactive, setShowOnlyInactive] = useState(false);
  const [owners, setOwners] = useState<any[]>([]);
  const [cats, setCats] = useState<any>({});
  const [loading, setLoading] = useState(true);

  // Fetch owners and cats from database
  useEffect(() => {
    fetchOwnersAndCats();
  }, []);

  const fetchOwnersAndCats = async () => {
    try {
      setLoading(true);
      
      // Fetch owners
      const { data: ownersData, error: ownersError } = await supabase
        .from('owner')
        .select('owner_id, name, email, created_at')
        .order('created_at', { ascending: false });

      if (ownersError) throw ownersError;
      
      // Transform owners data
      const transformedOwners = ownersData.map((owner: any) => ({
        id: owner.owner_id,
        name: owner.name || 'Unnamed',
        email: owner.email || 'No email',
        joinDate: new Date(owner.created_at).toLocaleDateString(),
        avatar: 'https://images.scalebranding.com/cat-face-icon-logo-7fa8b783-7f31-4afe-b1ad-0ca9c4719ae9.jpg'
      }));
      
      setOwners(transformedOwners);
      
      // Fetch cat counts for all owners
      const catCounts: any = {};
      for (const owner of transformedOwners) {
        const ownerId = owner.id;
        
        // Fetch female cats count for this owner
        const { count: femaleCount, error: femaleError } = await supabase
          .from('female_cats')
          .select('*', { count: 'exact', head: true })
          .eq('owner_id', ownerId);

        if (femaleError) throw femaleError;

        // Fetch male cats count for this owner
        const { count: maleCount, error: maleError } = await supabase
          .from('male_cats')
          .select('*', { count: 'exact', head: true })
          .eq('owner_id', ownerId);

        if (maleError) throw maleError;

        // Store the total count
        catCounts[ownerId] = (femaleCount || 0) + (maleCount || 0);
      }
      
      // Update cats state with counts
      setCats((prevCats: any) => ({
        ...prevCats,
        ...catCounts
      }));
      
    } catch (error) {
      console.error('Error fetching data:', error);
      Alert.alert('Error', 'Failed to fetch data');
    } finally {
      setLoading(false);
    }
  };

  const fetchUserCats = async (ownerId: string) => {
    try {
      // Fetch female cats for this owner with active_status and vaccination_status_url
      const { data: femaleCats, error: femaleError } = await supabase
        .from('female_cats')
        .select('female_cat_id, name, breed, age, location_address, active_status, vaccination_status_url')
        .eq('owner_id', ownerId);

      if (femaleError) throw femaleError;

      // Fetch male cats for this owner with active_status and vaccination_status_url
      const { data: maleCats, error: maleError } = await supabase
        .from('male_cats')
        .select('male_cat_id, name, breed, age, location_address, active_status, vaccination_status_url')
        .eq('owner_id', ownerId);

      if (maleError) throw maleError;

      // Combine cats and transform data
      const allCats = [
        ...(femaleCats || []).map((cat: any) => ({
          id: cat.female_cat_id,
          name: cat.name || 'Unnamed',
          breed: cat.breed || 'Unknown',
          age: cat.age || 'Unknown',
          location: cat.location_address || 'Unknown location',
          gender: 'Female',
          // Set isActive based on active_status: TRUE = active, anything else = inactive
          isActive: cat.active_status === true,
          // Set vaccinated based on whether vaccination_status_url exists and is not empty
          vaccinated: !!(cat.vaccination_status_url && cat.vaccination_status_url.trim() !== ''),
          avatar: 'https://images.scalebranding.com/cat-face-icon-logo-7fa8b783-7f31-4afe-b1ad-0ca9c4719ae9.jpg'
        })),
        ...(maleCats || []).map((cat: any) => ({
          id: cat.male_cat_id,
          name: cat.name || 'Unnamed',
          breed: cat.breed || 'Unknown',
          age: cat.age || 'Unknown',
          location: cat.location_address || 'Unknown location',
          gender: 'Male',
          // Set isActive based on active_status: TRUE = active, anything else = inactive
          isActive: cat.active_status === true,
          // Set vaccinated based on whether vaccination_status_url exists and is not empty
          vaccinated: !!(cat.vaccination_status_url && cat.vaccination_status_url.trim() !== ''),
          avatar: 'https://images.scalebranding.com/cat-face-icon-logo-7fa8b783-7f31-4afe-b1ad-0ca9c4719ae9.jpg'
        }))
      ];
      
      // Update cats state
      setCats((prevCats: any) => ({
        ...prevCats,
        [ownerId]: allCats
      }));
      
      return allCats;
    } catch (error) {
      console.error('Error fetching user cats:', error);
      Alert.alert('Error', 'Failed to fetch user cats');
      return [];
    }
  };

  // Removed unused hardcoded userCats object

  const handleBack = () => {
    if (selectedUser) {
      setSelectedUser(null);
    }
    // Note: Header back button removed - navigation handled through selectedUser state only
  };

  const handleUserSelect = async (userId: number) => {
    // Fetch detailed cats data for this user if not already fetched
    if (!Array.isArray(cats[userId])) {
      await fetchUserCats(userId.toString());
    }
    setSelectedUser(userId);
  };

  const handleActivationChange = (catId: number, isActive: boolean) => {
    console.log(`Set cat ${catId} to ${isActive ? 'active' : 'inactive'}`);
  };

  const handleInactivateCat = (cat: any) => {
    setSelectedCat(cat);
    setShowInactiveModal(true);
  };

  // Get users with inactive cats for filtering
  // Removed unused function

  // Get reason for cat inactivity (simulated based on cat data)
  // Removed unused function

  // Filter users based on search query
  const filteredUsers = owners.filter(owner => {
    if (!searchQuery) return true;
    const query = searchQuery.toLowerCase();
    return (
      owner.name.toLowerCase().includes(query) ||
      owner.email.toLowerCase().includes(query)
    );
  });

  const handleInactivationConfirm = () => {
    if (!inactivationReason || !selectedCat) return;

    // Update cat status (in real app, this would update database)
    console.log(`Inactivating cat ${selectedCat.name} for reason: ${inactivationReason}`);
    
    // Set status message based on reason
    let title = '';
    let message = '';
    
    switch (inactivationReason) {
      case 'vaccination':
        title = 'Vaccination Required';
        message = 'Your cat profile is inactive. Please update vaccination certificate.';
        break;
      case 'deceased':
        title = 'Profile Updated';
        message = 'Profile has been marked inactive.';
        break;
      case 'manual':
        title = 'Profile Deactivated';
        message = 'Profile deactivated by admin.';
        break;
    }
    
    setStatusTitle(title);
    setStatusMessage(message);
    setShowInactiveModal(false);
    setShowStatusMessage(true);
    
    // Send push notification (simulated)
    sendPushNotification(selectedCat.name, inactivationReason);
    
    // Reset states
    setInactivationReason('');
    setSelectedCat(null);
  };

  const sendPushNotification = (catName: string, reason: string) => {
    const title = 'Action Required: Update Cat Profile';
    let body = '';
    
    switch (reason) {
      case 'vaccination':
        body = `Your cat ${catName} is inactive. Please update vaccination records or contact support.`;
        break;
      case 'deceased':
        body = `Profile for ${catName} has been updated. Contact support if you need assistance.`;
        break;
      case 'manual':
        body = `Your cat ${catName} profile has been deactivated. Contact support for more information.`;
        break;
    }
    
    console.log('Push Notification Sent:', { title, body });
    // In real app, this would trigger actual push notification
  };

  const handleNotificationClick = () => {
    // Simulate user clicking notification - redirect to update profile
    Alert.alert(
      'Redirect to Update Profile',
      'User would be redirected to Update Cat Profile screen with options to:\n\n• Upload vaccination certificate\n• Confirm deceased status\n• Contact support',
      [{ text: 'OK' }]
    );
  };

  const UserItem = ({ user }: { user: typeof owners[0] }) => {
    // Get cat count for this user from the fetched cats data
    const catCount = cats[user.id] || 0;
    
    return (
      <TouchableOpacity style={styles.userItem} onPress={() => handleUserSelect(user.id)}>
        <View style={styles.userInfo}>
          <Image source={{ uri: user.avatar }} style={styles.avatar} />
          <View style={styles.userDetails}>
            <Text style={styles.userName}>{user.name}</Text>
            <Text style={styles.userEmail}>{user.email}</Text>
            <Text style={styles.userJoinDate}>Joined: {user.joinDate}</Text>
          </View>
        </View>
        
        <View style={styles.userMeta}>
          <View style={styles.catCountContainer}>
            <Icon name="heart" size={16} color={colors.primary} />
            <Text style={styles.catCountText}>
              {catCount} cat{catCount !== 1 ? 's' : ''}
            </Text>
          </View>
          <Icon name="chevron-forward" size={20} color={colors.textLight} />
        </View>
      </TouchableOpacity>
    );
  };

  const CatItem = ({ cat }: { cat: any }) => (
    <View style={styles.catItem}>
      <View style={styles.catInfo}>
        <Image source={{ uri: cat.avatar }} style={[styles.avatar, !cat.isActive && styles.inactiveAvatar]} />
        <View style={styles.catDetails}>
          <Text style={[styles.catName, !cat.isActive && styles.inactiveCatName]}>{cat.name}</Text>
          <Text style={styles.catBreed}>{cat.breed}</Text>
          <Text style={styles.catAge}>Age: {cat.age}</Text>
        </View>
        {!cat.isActive && (
          <View style={styles.inactiveIndicator}>
            <Icon name="close-circle" size={24} color={colors.danger} />
          </View>
        )}
      </View>
      
      <View style={styles.detailsSection}>
        <View style={styles.detailRow}>
          <View style={styles.detailItem}>
            <Text style={styles.detailLabel}>Gender:</Text>
            <Text style={styles.detailValue}>{cat.gender}</Text>
          </View>
          <View style={styles.detailItem}>
            <Text style={styles.detailLabel}>Vaccinated:</Text>
            <View style={styles.statusIndicator}>
              <Icon 
                name={cat.vaccinated ? "checkmark-circle" : "close-circle"} 
                size={16} 
                color={cat.vaccinated ? colors.success : colors.danger} 
              />
              <Text style={[styles.statusText, { color: cat.vaccinated ? colors.success : colors.danger }]}>
                {cat.vaccinated ? 'Yes' : 'No'}
              </Text>
            </View>
          </View>
        </View>
      </View>
      
      <View style={styles.activationSection}>
        <View style={styles.activationHeader}>
          <Text style={styles.activationLabel}>Breeding Status:</Text>
          
        </View>
        <View style={styles.radioGroup}>
          <TouchableOpacity 
            style={styles.radioOption}
            onPress={() => handleActivationChange(cat.id, true)}
          >
            <View style={[styles.radioButton, cat.isActive && styles.radioButtonSelected]}>
              {cat.isActive && <View style={styles.radioButtonInner} />}
            </View>
            <Text style={[styles.radioText, cat.isActive && styles.radioTextSelected]}>Active</Text>
          </TouchableOpacity>
          
          <TouchableOpacity 
            style={styles.radioOption}
            onPress={() => handleActivationChange(cat.id, false)}
          >
            <View style={[styles.radioButton, !cat.isActive && styles.radioButtonSelected]}>
              {!cat.isActive && <View style={styles.radioButtonInner} />}
            </View>
            <Text style={[styles.radioText, !cat.isActive && styles.radioTextSelected]}>Inactive</Text>
          </TouchableOpacity>
        </View>
      </View>
    </View>
  );

  const NavItem = ({ icon, label, isActive, onPress }: { icon: string; label: string; isActive?: boolean; onPress: () => void }) => (
    <TouchableOpacity style={styles.navItem} onPress={onPress}>
      <Icon 
        name={icon as any} 
        size={24} 
        color={isActive ? colors.primary : colors.text} 
      />
      <Text style={[styles.navLabel, isActive && styles.navLabelActive]}>{label}</Text>
    </TouchableOpacity>
  );

  const selectedUserData = selectedUser ? owners.find(u => u.id === selectedUser) : null;
  // Get cats for selected user
  const userCatsData = selectedUser && Array.isArray(cats[selectedUser]) ? cats[selectedUser] : [];

  return (
    <View style={styles.screenContainer}>
      <SafeAreaView style={styles.safeArea}>
        <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
          {selectedUser ? (
            <>
              <Text style={styles.pageTitle}>{selectedUserData?.name}'s Cats</Text>
              <Text style={styles.pageSubtitle}>View and manage cat details for {selectedUserData?.name}</Text>

              <View style={styles.searchPanel}>
                <TextInput
                  style={styles.searchInput}
                  placeholder="Search cats"
                  placeholderTextColor={colors.textLight}
                  value={searchQuery}
                  onChangeText={setSearchQuery}
                />
                <Icon name="search" size={20} color={colors.textSecondary} style={styles.searchIcon} />
              </View>

              <View style={styles.catList}>
                {userCatsData.map((cat: any) => (
                  <CatItem key={cat.id} cat={cat} />
                ))}
              </View>
            </>
          ) : (
            <>
              <View style={styles.headerSection}>
                <Text style={styles.pageTitle}>Users with Cats</Text>
              </View>
              
              <Text style={styles.pageSubtitle}>
                Manage user accounts ({owners.length} total)
              </Text>

              <View style={styles.searchPanel}>
                <TextInput
                  style={styles.searchInput}
                  placeholder="Search users"
                  placeholderTextColor={colors.textLight}
                  value={searchQuery}
                  onChangeText={setSearchQuery}
                />
                <Icon name="search" size={20} color={colors.textSecondary} style={styles.searchIcon} />
              </View>

              <View style={styles.userList}>
                {filteredUsers.map((user) => (
                  <UserItem key={user.id} user={user} />
                ))}
                {filteredUsers.length === 0 && (
                  <View style={styles.emptyState}>
                    <Icon name="checkmark-circle" size={48} color={colors.success} />
                    <Text style={styles.emptyStateTitle}>All Good!</Text>
                    <Text style={styles.emptyStateText}>No users with inactive cats found.</Text>
                  </View>
                )}
              </View>
            </>
          )}
        </ScrollView>
      </SafeAreaView>

      <View style={styles.bottomNavigation}>
        <NavItem 
          icon="home" 
          label="Home" 
          onPress={() => router.push('/dashboard')} 
        />
        <NavItem 
          icon="people" 
          label="User" 
          isActive={true}
          onPress={() => console.log('User pressed')} 
        />
        <NavItem 
          icon="settings" 
          label="Settings" 
          onPress={() => router.push('/settings')} 
        />
      </View>

      {/* Inactivation Modal */}
      <Modal
        visible={showInactiveModal}
        transparent={true}
        animationType="fade"
        onRequestClose={() => setShowInactiveModal(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <Text style={styles.modalTitle}>Inactivate Cat</Text>
            <Text style={styles.modalSubtitle}>Select reason for inactivating {selectedCat?.name}</Text>
            
            <View style={styles.reasonOptions}>
              <TouchableOpacity 
                style={[styles.reasonOption, inactivationReason === 'vaccination' && styles.reasonOptionSelected]}
                onPress={() => setInactivationReason('vaccination')}
              >
                <View style={styles.reasonIcon}>
                  <Icon name="medical" size={20} color={inactivationReason === 'vaccination' ? colors.background : colors.warning} />
                </View>
                <Text style={[styles.reasonText, inactivationReason === 'vaccination' && styles.reasonTextSelected]}>Vaccination not updated</Text>
                <View style={[styles.reasonRadio, inactivationReason === 'vaccination' && styles.reasonRadioSelected]}>
                  {inactivationReason === 'vaccination' && <View style={styles.reasonRadioInner} />}
                </View>
              </TouchableOpacity>
              
              <TouchableOpacity 
                style={[styles.reasonOption, inactivationReason === 'deceased' && styles.reasonOptionSelected]}
                onPress={() => setInactivationReason('deceased')}
              >
                <View style={styles.reasonIcon}>
                  <Icon name="heart-dislike" size={20} color={inactivationReason === 'deceased' ? colors.background : colors.danger} />
                </View>
                <Text style={[styles.reasonText, inactivationReason === 'deceased' && styles.reasonTextSelected]}>Cat deceased</Text>
                <View style={[styles.reasonRadio, inactivationReason === 'deceased' && styles.reasonRadioSelected]}>
                  {inactivationReason === 'deceased' && <View style={styles.reasonRadioInner} />}
                </View>
              </TouchableOpacity>
              
              <TouchableOpacity 
                style={[styles.reasonOption, inactivationReason === 'manual' && styles.reasonOptionSelected]}
                onPress={() => setInactivationReason('manual')}
              >
                <View style={styles.reasonIcon}>
                  <Icon name="person" size={20} color={inactivationReason === 'manual' ? colors.background : colors.textSecondary} />
                </View>
                <Text style={[styles.reasonText, inactivationReason === 'manual' && styles.reasonTextSelected]}>Manually inactivated</Text>
                <View style={[styles.reasonRadio, inactivationReason === 'manual' && styles.reasonRadioSelected]}>
                  {inactivationReason === 'manual' && <View style={styles.reasonRadioInner} />}
                </View>
              </TouchableOpacity>
            </View>
            
            <View style={styles.modalActions}>
              <TouchableOpacity 
                style={styles.modalCancelButton}
                onPress={() => {
                  setShowInactiveModal(false);
                  setInactivationReason('');
                  setSelectedCat(null);
                }}
              >
                <Text style={styles.modalCancelText}>Cancel</Text>
              </TouchableOpacity>
              <TouchableOpacity 
                style={[styles.modalConfirmButton, !inactivationReason && styles.modalConfirmButtonDisabled]}
                onPress={handleInactivationConfirm}
                disabled={!inactivationReason}
              >
                <Text style={styles.modalConfirmText}>Confirm</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>

      {/* Status Message Modal */}
      <Modal
        visible={showStatusMessage}
        transparent={true}
        animationType="fade"
        onRequestClose={() => setShowStatusMessage(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.statusModalContent}>
            <Icon name="checkmark-circle" size={48} color={colors.success} />
            <Text style={styles.statusModalTitle}>{statusTitle}</Text>
            <Text style={styles.statusModalMessage}>{statusMessage}</Text>
            
            <View style={styles.statusModalActions}>
              <TouchableOpacity 
                style={styles.statusModalButton}
                onPress={() => setShowStatusMessage(false)}
              >
                <Text style={styles.statusModalButtonText}>OK</Text>
              </TouchableOpacity>
              <TouchableOpacity 
                style={styles.statusModalSecondaryButton}
                onPress={handleNotificationClick}
              >
                <Text style={styles.statusModalSecondaryText}>View Notification Flow</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>
    </View>
  );
}

const styles = StyleSheet.create({
  screenContainer: {
    flex: 1,
    backgroundColor: colors.background,
  },
  safeArea: {
    flex: 1,
  },
  content: {
    flex: 1,
    paddingHorizontal: 20,
    paddingTop: 20,
    paddingBottom: 180,
  },
  bottomNavigation: {
    flexDirection: 'row',
    backgroundColor: colors.card,
    paddingVertical: 12,
    paddingHorizontal: 20,
    borderTopWidth: 1,
    borderTopColor: colors.border,
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    boxShadow: '0px -2px 8px rgba(0, 0, 0, 0.1)',
    elevation: 8,
  },
  pageTitle: {
    fontSize: 36,
    fontWeight: '700',
    color: colors.text,
    marginBottom: 8,
  },
  pageSubtitle: {
    fontSize: 16,
    fontWeight: '400',
    color: colors.textSecondary,
    marginBottom: 24,
  },
  userList: {
    gap: 16,
    paddingBottom: 100,
  },
  userItem: {
    backgroundColor: colors.card,
    borderRadius: 12,
    padding: 16,
    boxShadow: '0px 2px 8px rgba(0, 0, 0, 0.1)',
    elevation: 2,
  },
  userInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 12,
  },
  userDetails: {
    flex: 1,
  },
  userName: {
    fontSize: 18,
    fontWeight: '600',
    color: colors.text,
    marginBottom: 2,
  },
  userEmail: {
    fontSize: 14,
    fontWeight: '400',
    color: colors.textSecondary,
    marginBottom: 2,
  },
  userLocation: {
    fontSize: 14,
    fontWeight: '400',
    color: colors.textSecondary,
    marginBottom: 2,
  },
  userJoinDate: {
    fontSize: 12,
    fontWeight: '400',
    color: colors.textLight,
  },
  userMeta: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingTop: 12,
    borderTopWidth: 1,
    borderTopColor: colors.border,
  },
  verificationStatus: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  verificationText: {
    fontSize: 12,
    fontWeight: '600',
  },
  catCountContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  catCountText: {
    fontSize: 12,
    fontWeight: '500',
    color: colors.primary,
  },
  catList: {
    gap: 16,
    paddingBottom: 100,
  },
  catItem: {
    backgroundColor: colors.card,
    borderRadius: 12,
    padding: 16,
    boxShadow: '0px 2px 8px rgba(0, 0, 0, 0.1)',
    elevation: 2,
  },
  catInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 16,
  },
  avatar: {
    width: 60,
    height: 60,
    borderRadius: 30,
    marginRight: 12,
  },
  catDetails: {
    flex: 1,
  },
  catName: {
    fontSize: 18,
    fontWeight: '600',
    color: colors.text,
    marginBottom: 2,
  },
  catBreed: {
    fontSize: 14,
    fontWeight: '500',
    color: colors.primary,
    marginBottom: 2,
  },
  catAge: {
    fontSize: 14,
    fontWeight: '400',
    color: colors.textSecondary,
  },
  activationSection: {
    borderTopWidth: 1,
    borderTopColor: colors.border,
    paddingTop: 16,
  },
  activationHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  activationLabel: {
    fontSize: 16,
    fontWeight: '600',
    color: colors.text,
  },
  inactivateButton: {
    backgroundColor: colors.danger,
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 6,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  inactivateButtonText: {
    color: colors.background,
    fontSize: 12,
    fontWeight: '600',
  },
  radioGroup: {
    flexDirection: 'row',
    gap: 24,
  },
  radioOption: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  radioButton: {
    width: 20,
    height: 20,
    borderRadius: 10,
    borderWidth: 2,
    borderColor: colors.border,
    alignItems: 'center',
    justifyContent: 'center',
  },
  radioButtonSelected: {
    borderColor: colors.primary,
  },
  radioButtonInner: {
    width: 10,
    height: 10,
    borderRadius: 5,
    backgroundColor: colors.primary,
  },
  radioText: {
    fontSize: 14,
    fontWeight: '500',
    color: colors.textSecondary,
  },
  radioTextSelected: {
    color: colors.primary,
    fontWeight: '600',
  },
  navItem: {
    flex: 1,
    alignItems: 'center',
    paddingVertical: 8,
    gap: 4,
  },
  navLabel: {
    fontSize: 12,
    fontWeight: '500',
    color: colors.textSecondary,
  },
  navLabelActive: {
    color: colors.primary,
  },
  detailsSection: {
    marginBottom: 16,
    paddingBottom: 16,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
  },
  detailRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 8,
  },
  detailItem: {
    flex: 1,
    marginRight: 8,
  },
  detailLabel: {
    fontSize: 12,
    fontWeight: '500',
    color: colors.textSecondary,
    marginBottom: 2,
  },
  detailValue: {
    fontSize: 14,
    fontWeight: '600',
    color: colors.text,
  },
  statusIndicator: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  statusText: {
    fontSize: 14,
    fontWeight: '600',
  },
  searchPanel: {
    backgroundColor: colors.card,
    borderRadius: 12,
    paddingHorizontal: 16,
    paddingVertical: 12,
    marginBottom: 20,
    flexDirection: 'row',
    alignItems: 'center',
    boxShadow: '0px 2px 8px rgba(0, 0, 0, 0.1)',
    elevation: 2,
  },
  searchInput: {
    flex: 1,
    fontSize: 16,
    color: colors.text,
    paddingVertical: 8,
  },
  searchIcon: {
    marginLeft: 8,
  },
  errorBanner: {
    backgroundColor: colors.danger + '15',
    borderLeftWidth: 4,
    borderLeftColor: colors.danger,
    borderRadius: 8,
    padding: 12,
    marginBottom: 16,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  errorText: {
    fontSize: 14,
    fontWeight: '500',
    color: colors.danger,
    flex: 1,
  },
  inactiveAvatar: {
    opacity: 0.6,
  },
  inactiveCatName: {
    color: colors.textSecondary,
    textDecorationLine: 'line-through',
  },
  inactiveIndicator: {
    marginLeft: 8,
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  modalContent: {
    backgroundColor: colors.background,
    borderRadius: 16,
    padding: 24,
    width: '100%',
    maxWidth: 400,
  },
  modalTitle: {
    fontSize: 20,
    fontWeight: '700',
    color: colors.text,
    textAlign: 'center',
    marginBottom: 8,
  },
  modalSubtitle: {
    fontSize: 14,
    color: colors.textSecondary,
    textAlign: 'center',
    marginBottom: 24,
  },
  reasonOptions: {
    gap: 12,
    marginBottom: 24,
  },
  reasonOption: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 16,
    borderRadius: 12,
    borderWidth: 2,
    borderColor: colors.border,
    backgroundColor: colors.card,
  },
  reasonOptionSelected: {
    borderColor: colors.primary,
    backgroundColor: colors.primary + '10',
  },
  reasonIcon: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: colors.backgroundAlt,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 12,
  },
  reasonText: {
    flex: 1,
    fontSize: 16,
    fontWeight: '500',
    color: colors.text,
  },
  reasonTextSelected: {
    color: colors.primary,
    fontWeight: '600',
  },
  reasonRadio: {
    width: 20,
    height: 20,
    borderRadius: 10,
    borderWidth: 2,
    borderColor: colors.border,
    alignItems: 'center',
    justifyContent: 'center',
  },
  reasonRadioSelected: {
    borderColor: colors.primary,
  },
  reasonRadioInner: {
    width: 10,
    height: 10,
    borderRadius: 5,
    backgroundColor: colors.primary,
  },
  modalActions: {
    flexDirection: 'row',
    gap: 12,
  },
  modalCancelButton: {
    flex: 1,
    padding: 16,
    borderRadius: 12,
    backgroundColor: colors.backgroundAlt,
    alignItems: 'center',
  },
  modalCancelText: {
    fontSize: 16,
    fontWeight: '600',
    color: colors.text,
  },
  modalConfirmButton: {
    flex: 1,
    padding: 16,
    borderRadius: 12,
    backgroundColor: colors.danger,
    alignItems: 'center',
  },
  modalConfirmButtonDisabled: {
    backgroundColor: colors.textLight,
  },
  modalConfirmText: {
    fontSize: 16,
    fontWeight: '600',
    color: colors.background,
  },
  statusModalContent: {
    backgroundColor: colors.background,
    borderRadius: 16,
    padding: 32,
    width: '100%',
    maxWidth: 350,
    alignItems: 'center',
  },
  statusModalTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: colors.text,
    marginTop: 16,
    marginBottom: 8,
    textAlign: 'center',
  },
  statusModalMessage: {
    fontSize: 14,
    color: colors.textSecondary,
    textAlign: 'center',
    marginBottom: 24,
    lineHeight: 20,
  },
  statusModalActions: {
    width: '100%',
    gap: 8,
  },
  statusModalButton: {
    padding: 16,
    borderRadius: 12,
    backgroundColor: colors.primary,
    alignItems: 'center',
  },
  statusModalButtonText: {
    fontSize: 16,
    fontWeight: '600',
    color: colors.background,
  },
  statusModalSecondaryButton: {
    padding: 12,
    alignItems: 'center',
  },
  statusModalSecondaryText: {
    fontSize: 14,
    fontWeight: '500',
    color: colors.primary,
  },
  headerSection: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  filterButton: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 8,
    backgroundColor: colors.backgroundAlt,
    borderWidth: 1,
    borderColor: colors.border,
    gap: 6,
  },
  filterButtonActive: {
    backgroundColor: colors.primary,
    borderColor: colors.primary,
  },
  filterButtonText: {
    fontSize: 12,
    fontWeight: '600',
    color: colors.primary,
  },
  filterButtonTextActive: {
    color: colors.background,
  },
  userItemProblematic: {
    borderWidth: 2,
    borderColor: colors.danger + '40',
    backgroundColor: colors.danger + '08',
  },
  problemBadge: {
    position: 'absolute',
    top: 8,
    right: 8,
    backgroundColor: colors.danger,
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 12,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    zIndex: 1,
  },
  problemBadgeText: {
    fontSize: 10,
    fontWeight: '600',
    color: colors.background,
  },
  inactiveCatAlert: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    marginTop: 4,
    paddingTop: 4,
    borderTopWidth: 1,
    borderTopColor: colors.danger + '20',
  },
  inactiveCatAlertText: {
    fontSize: 12,
    fontWeight: '500',
    color: colors.danger,
    flex: 1,
  },
  emptyState: {
    alignItems: 'center',
    paddingVertical: 40,
    paddingHorizontal: 20,
  },
  emptyStateTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: colors.text,
    marginTop: 16,
    marginBottom: 8,
  },
  emptyStateText: {
    fontSize: 14,
    color: colors.textSecondary,
    textAlign: 'center',
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingVertical: 40,
  },
  loadingText: {
    marginTop: 10,
    fontSize: 16,
    color: colors.textSecondary,
  },
});