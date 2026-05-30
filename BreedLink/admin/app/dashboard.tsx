import React, { useState, useEffect, useCallback } from 'react';
import { 
  Text, 
  View, 
  TouchableOpacity, 
  TextInput, 
  StyleSheet, 
  ScrollView, 
  RefreshControl 
} from 'react-native';
import { commonStyles, colors } from '../styles/commonStyles';
import { SafeAreaView } from 'react-native-safe-area-context';
import { router } from 'expo-router';
import Icon from '../components/Icon';
import { supabase } from 'supabase';
import AsyncStorage from '@react-native-async-storage/async-storage';

export default function DashboardScreen() {
  const [totalUsers, setTotalUsers] = useState(0);
  const [totalCats, setTotalCats] = useState(0);
  const [matchesMade, setMatchesMade] = useState(0);
  const [verifiedBreeders, setVerifiedBreeders] = useState(0);
  const [pendingVerifications, setPendingVerifications] = useState(0);
  const [refreshing, setRefreshing] = useState(false);

  const fetchStats = async () => {
    try {
      const { count: ownerCount, error: ownerError } = await supabase
        .from('owner')
        .select('*', { count: 'exact', head: true });
      if (ownerError) throw ownerError;

      const { count: maleCount, error: maleError } = await supabase
        .from('male_cats')
        .select('*', { count: 'exact', head: true });
      if (maleError) throw maleError;

      const { count: femaleCount, error: femaleError } = await supabase
        .from('female_cats')
        .select('*', { count: 'exact', head: true });
      if (femaleError) throw femaleError;

      const { count: matchCount, error: matchError } = await supabase
        .from('matchmaking')
        .select('*', { count: 'exact', head: true });
      if (matchError) throw matchError;

      const { count: completedCount, error: completedError } = await supabase
        .from('matchmaking')
        .select('*', { count: 'exact', head: true })
        .eq('status', 'completed');
      if (completedError) throw completedError;

      // Fetch pending certificate verifications
      const { count: pendingFemaleCount, error: pendingFemaleError } = await supabase
        .from('female_cats')
        .select('*', { count: 'exact', head: true })
        .not('vaccination_status_url', 'is', null)
        .neq('vaccination_status_url', '')
        .not('approval_status', 'is', true);
      if (pendingFemaleError) throw pendingFemaleError;

      const { count: pendingMaleCount, error: pendingMaleError } = await supabase
        .from('male_cats')
        .select('*', { count: 'exact', head: true })
        .not('vaccination_status_url', 'is', null)
        .neq('vaccination_status_url', '')
        .not('approval_status', 'is', true);
      if (pendingMaleError) throw pendingMaleError;

      setTotalUsers(ownerCount || 0);
      setTotalCats((maleCount || 0) + (femaleCount || 0));
      setMatchesMade(matchCount || 0);
      setVerifiedBreeders(completedCount || 0);
      setPendingVerifications((pendingFemaleCount || 0) + (pendingMaleCount || 0));
    } catch (err) {
      console.error('Error fetching stats:', err);
    }
  };

  useEffect(() => {
    fetchStats();
  }, []);

  const onRefresh = useCallback(async () => {
    setRefreshing(true);
    await fetchStats();
    setRefreshing(false);
  }, []);

  const handleNavigation = (screen: string) => {
    router.push(`/${screen}` as any);
  };

  const StatCard = ({ title, value, icon, onPress }: { title: string; value: string; icon: string; onPress?: () => void }) => (
    <TouchableOpacity style={styles.statCard} onPress={onPress}>
      <View style={styles.statHeader}>
        <Icon name={icon as any} size={24} color={colors.primary} />
        <Text style={styles.statValue}>{value}</Text>
      </View>
      <Text style={styles.statTitle}>{title}</Text>
    </TouchableOpacity>
  );

  const TaskItem = ({ title, count, onPress }: { title: string; count: number; onPress: () => void }) => (
    <TouchableOpacity style={styles.taskItem} onPress={onPress}>
      <Text style={styles.taskTitle}>{title}</Text>
      <View style={commonStyles.badge}>
        <Text style={commonStyles.badgeText}>{count}</Text>
      </View>
    </TouchableOpacity>
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

  return (
    <View style={styles.screenContainer}>
      <SafeAreaView style={styles.safeArea}>
        

        <ScrollView
          style={styles.content}
          showsVerticalScrollIndicator={false}
          refreshControl={
            <RefreshControl refreshing={refreshing} onRefresh={onRefresh} colors={[colors.primary]} />
          }
        >
          <Text style={styles.pageTitle}>Dashboard</Text>

          <View style={styles.statsGrid}>
            <StatCard title="Total Users" value={String(totalUsers)} icon="people" onPress={() => router.push('/owner-management')} />
            <StatCard title="Total Cats" value={String(totalCats)} icon="heart" onPress={() => router.push('/cat-management')} />
            <StatCard title="Total Matches Made" value={String(matchesMade)} icon="checkmark-circle" onPress={() => router.push('./matchmaking_list')}/>
            <StatCard title="Completed Matches" value={String(verifiedBreeders)} icon="shield-checkmark" onPress={() => router.push('./matchmaking_completed')}/>
          </View>

          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Pending Tasks</Text>
            <View style={styles.taskList}>
              <TaskItem title="Verifications" count={pendingVerifications} onPress={() => handleNavigation('verification-management')} />
            </View>
          </View>
        </ScrollView>
      </SafeAreaView>

      <View style={styles.bottomNavigation}>
        <NavItem icon="home" label="Home" isActive={true} onPress={() => console.log('Home pressed')} />
        <NavItem icon="people" label="User" onPress={() => router.push('/user-management')} />
        <NavItem icon="settings" label="Settings" onPress={() => router.push('/settings')} />
      </View>
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
  header: {
    paddingHorizontal: 20,
    paddingTop: 10,
  },
  content: {
    flex: 1,
    paddingHorizontal: 20,
    
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
    elevation: 8,
  },
  pageTitle: {
    fontSize: 28,
    fontWeight: '700',
    color: colors.text,
    marginBottom: 24,
  },
  statsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 12,
    marginBottom: 32,
  },
  statCard: {
    backgroundColor: colors.card,
    borderRadius: 12,
    padding: 16,
    width: '48%',
    elevation: 2,
    marginBottom: 12,
  },
  statHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 8,
  },
  statValue: {
    fontSize: 24,
    fontWeight: '700',
    color: colors.text,
  },
  statTitle: {
    fontSize: 12,
    fontWeight: '500',
    color: colors.textSecondary,
  },
  section: {
    marginBottom: 32,
  },
  sectionTitle: {
    fontSize: 20,
    fontWeight: '600',
    color: colors.text,
    marginBottom: 16,
  },
  taskList: {
    gap: 8,
  },
  taskItem: {
    backgroundColor: colors.card,
    borderRadius: 12,
    padding: 16,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    elevation: 2,
    marginBottom: 8,
  },
  taskTitle: {
    fontSize: 16,
    fontWeight: '500',
    color: colors.text,
  },
  navItem: {
    flex: 1,
    alignItems: 'center',
    paddingVertical: 8,
  },
  navLabel: {
    fontSize: 12,
    fontWeight: '500',
    color: colors.textSecondary,
  },
  navLabelActive: {
    color: colors.primary,
  },
});
