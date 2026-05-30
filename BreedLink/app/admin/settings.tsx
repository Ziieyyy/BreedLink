
import React from 'react';
import { Text, View, TouchableOpacity, StyleSheet, ScrollView } from 'react-native';
import { commonStyles, colors } from '../styles/commonStyles';
import { SafeAreaView } from 'react-native-safe-area-context';
import { router } from 'expo-router';
import Icon from '../components/Icon';

export default function SettingsScreen() {
  const handleBack = () => {
    router.back();
  };

  const handlePolicies = () => {
    console.log('Policies pressed');
  };

  const handleLogout = () => {
    console.log('Logout pressed');
    router.push('/');
  };

  const SettingsItem = ({ 
    title, 
    icon, 
    onPress, 
    isDestructive = false 
  }: { 
    title: string; 
    icon: string; 
    onPress: () => void; 
    isDestructive?: boolean;
  }) => (
    <TouchableOpacity style={styles.settingsItem} onPress={onPress}>
      <View style={styles.settingsItemContent}>
        <Icon 
          name={icon as any} 
          size={24} 
          color={isDestructive ? colors.danger : colors.textSecondary} 
        />
        <Text style={[styles.settingsItemText, isDestructive && styles.destructiveText]}>
          {title}
        </Text>
      </View>
      <Icon name="chevron-forward" size={20} color={colors.textLight} />
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
        <View style={styles.header}>
          <TouchableOpacity onPress={handleBack} style={styles.backButton}>
            <Icon name="arrow-back" size={24} color={colors.text} />
          </TouchableOpacity>
        </View>

        <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
          <Text style={styles.pageTitle}>Settings</Text>

          <View style={styles.settingsList}>
           
            <SettingsItem
              title="Logout"
              icon="log-out"
              onPress={handleLogout}
              isDestructive={true}
            />
          </View>
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
          onPress={() => router.push('/user-management')} 
        />
        <NavItem 
          icon="settings" 
          label="Settings" 
          isActive={true}
          onPress={() => console.log('Settings pressed')} 
        />
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
    marginBottom: 20,
  },
  backButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: colors.backgroundAlt,
    alignItems: 'center',
    justifyContent: 'center',
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
    boxShadow: '0px -2px 8px rgba(0, 0, 0, 0.1)',
    elevation: 8,
  },
  pageTitle: {
    fontSize: 28,
    fontWeight: '700',
    color: colors.text,
    marginBottom: 24,
  },
  settingsList: {
    gap: 2,
    paddingBottom: 20,
  },
  settingsItem: {
    backgroundColor: colors.card,
    paddingVertical: 16,
    paddingHorizontal: 20,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
  },
  settingsItemContent: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 16,
  },
  settingsItemText: {
    fontSize: 16,
    fontWeight: '500',
    color: colors.text,
  },
  destructiveText: {
    color: colors.danger,
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
});
