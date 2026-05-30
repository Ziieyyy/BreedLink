import React from 'react';
import { TouchableOpacity, Text, StyleSheet } from 'react-native';
import Icon from '../components/Icon';
import { colors } from '../styles/commonStyles';
import { supabase } from 'supabase';
import AsyncStorage from '@react-native-async-storage/async-storage';

export default function StatCard({ title, value, icon, onPress }: any) {
  return (
    <TouchableOpacity style={styles.card} onPress={onPress}>
      <Icon name={icon} size={28} color={colors.primary} />
      <Text style={styles.value}>{value}</Text>
      <Text style={styles.title}>{title}</Text>
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  card: {
    flex: 1,
    backgroundColor: colors.card,
    borderRadius: 12,
    padding: 16,
    alignItems: 'center',
    justifyContent: 'center',
    margin: 8,
    elevation: 2,
  },
  value: {
    fontSize: 20,
    fontWeight: '700',
    marginTop: 8,
    color: colors.text,
  },
  title: {
    fontSize: 14,
    marginTop: 4,
    color: colors.textSecondary,
  },
});
