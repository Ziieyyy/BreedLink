import React from 'react';
import { View, Text, TouchableOpacity, StyleSheet } from 'react-native';
import { useRouter, usePathname } from 'expo-router';
import Icon from './Icon';
import { colors, commonStyles } from '../styles/commonStyles';

export default function BottomNavigation() {
  const router = useRouter();
  const pathname = usePathname();

  const navItems = [
    { 
      name: 'Home', 
      icon: 'home', 
      route: '/home',
      active: pathname === '/home'
    },
    { 
      name: 'Discover', 
      icon: 'search', 
      route: '/discover',
      active: pathname === '/discover'
    },
    { 
      name: 'Partner', 
      icon: 'heart', 
      route: '/search-partner',
      active: pathname === '/search-partner'
    },
    { 
      name: 'My Cats', 
      icon: 'paw', 
      route: '/cat-management',
      active: pathname === '/cat-management'
    },
    { 
      name: 'Chats', 
      icon: 'chatbubble', 
      route: '/breed-chat-list',
      active: pathname === '/breed-chat-list'
    }
  ];

  const handleNavigation = (route: string) => {
    router.push(route);
  };

  return (
    <View style={styles.bottomNav}>
      {navItems.map((item, index) => (
        <TouchableOpacity 
          key={index}
          style={styles.bottomNavItem}
          onPress={() => handleNavigation(item.route)}
        >
          <Icon 
            name={item.icon as any} 
            size={24} 
            color={item.active ? colors.primary : colors.textLight} 
          />
          <Text style={[
            styles.bottomNavText, 
            { color: item.active ? colors.primary : colors.textLight }
          ]}>
            {item.name}
          </Text>
        </TouchableOpacity>
      ))}
    </View>
  );
}

const styles = StyleSheet.create({
  bottomNav: {
    flexDirection: 'row',
    backgroundColor: colors.white,
    borderTopWidth: 1,
    borderTopColor: colors.border,
    paddingVertical: 12,
    justifyContent: 'space-around',
    alignItems: 'center',
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
  },
  bottomNavItem: {
    alignItems: 'center',
    justifyContent: 'center',
    flex: 1,
    paddingVertical: 8,
  },
  bottomNavText: {
    fontSize: 12,
    fontWeight: '500',
    marginTop: 4,
  },
});