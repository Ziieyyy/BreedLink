import React, { useState } from 'react';
import { View, Text, TouchableOpacity, StyleSheet, ScrollView, Image, Alert } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import Icon from './Icon';
import { colors, buttonStyles } from '../styles/commonStyles';

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

interface VaccinationReminderScreenProps {
  notification: VaccinationNotification;
  onClose: () => void;
}

export default function VaccinationReminderScreen({ notification, onClose }: VaccinationReminderScreenProps) {
  const router = useRouter();

  const handleUploadVaccinationProof = () => {
    // Navigate to the vaccination update panel
    router.push({
      pathname: '/vaccination-update',
      params: {
        catId: notification.catId,
        catName: notification.catName,
        catBreed: notification.catBreed,
        catAge: notification.catAge.toString(),
        catImage: notification.catImage,
        vaccineType: notification.vaccineType,
        expiredDate: notification.expiredDate,
        lastVaccination: notification.lastVaccination,
        status: notification.status
      }
    });
  };

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity onPress={onClose}>
          <Icon name="arrow-back" size={24} color={colors.text} />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Vaccination Reminder</Text>
        <View style={{ width: 24 }} />
      </View>

      <ScrollView style={styles.scrollView} showsVerticalScrollIndicator={false}>
        <View style={styles.content}>
          {/* Cat Profile */}
          <View style={styles.catProfileContainer}>
            <Image source={{ uri: notification.catImage }} style={styles.catImage} />
            <Text style={styles.catName}>{notification.catName}</Text>
            <Text style={styles.catDetails}>{notification.catBreed}, {notification.catAge} years old</Text>
          </View>

          {/* Reminder Message */}
          <View style={styles.reminderContainer}>
            <Text style={styles.reminderText}>
              {notification.catName}'s {notification.vaccineType} vaccination {notification.status === 'Expired' ? 'expired' : 'will expire'} on {notification.expiredDate}. 
              Please update the record.
            </Text>
          </View>

          {/* Action Button */}
          <TouchableOpacity 
            style={[buttonStyles.primary, styles.uploadButton]}
            onPress={handleUploadVaccinationProof}
          >
            <Icon name="camera" size={20} color={colors.white} />
            <Text style={buttonStyles.primaryText}>Upload Vaccination Proof</Text>
          </TouchableOpacity>
        </View>
      </ScrollView>
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
    backgroundColor: colors.white,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
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
    paddingHorizontal: 20,
    paddingVertical: 20,
  },
  catProfileContainer: {
    alignItems: 'center',
    marginBottom: 32,
  },
  catImage: {
    width: 120,
    height: 120,
    borderRadius: 60,
    marginBottom: 16,
    borderWidth: 1,
    borderColor: colors.border,
  },
  catName: {
    fontSize: 24,
    fontWeight: '700',
    color: colors.text,
    marginBottom: 4,
  },
  catDetails: {
    fontSize: 16,
    color: colors.textLight,
  },
  reminderContainer: {
    backgroundColor: colors.white,
    borderRadius: 16,
    padding: 20,
    borderWidth: 1,
    borderColor: colors.border,
    marginBottom: 32,
  },
  reminderText: {
    fontSize: 16,
    color: colors.text,
    lineHeight: 24,
    textAlign: 'center',
  },
  uploadButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 16,
  },
});