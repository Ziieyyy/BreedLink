import React, { useState } from 'react';
import { Text, View, TouchableOpacity, StyleSheet, ScrollView, Image, Alert, Linking } from 'react-native';
import { commonStyles, colors, buttonStyles } from '../../styles/adminStyles';
import { SafeAreaView } from 'react-native-safe-area-context';
import { router, useLocalSearchParams } from 'expo-router';
import Icon from '../../components/Icon';
import { supabase } from '../../supabase';

export default function CertificateReviewScreen() {
  const params = useLocalSearchParams();
  const [isProcessing, setIsProcessing] = useState(false);

  // Helper function to get string value from param that might be array
  const getParamString = (param: string | string[] | undefined): string => {
    if (Array.isArray(param)) {
      return param[0] || '';
    }
    return param || '';
  };

  // Certificate data from params
  const certificate = {
    id: getParamString(params.id) || '1',
    catName: getParamString(params.catName) || 'Whiskers',
    breed: getParamString(params.breed) || 'Persian',
    ownerName: getParamString(params.ownerName) || 'John Doe',
    vaccinationStatusUrl: getParamString(params.vaccinationStatusUrl) || '',
    avatar: getParamString(params.avatar) || 'https://images.unsplash.com/photo-1514888286974-6c03e2ca1dba?w=200&h=200&fit=crop',
    status: 'pending',
    gender: getParamString(params.gender) || 'Male' // Added gender parameter
  };

  const handleBack = () => {
    router.back();
  };

  // Updated handleApprove function to update database
  const handleApprove = async () => {
    Alert.alert(
      'Approve Certificate',
      `Are you sure you want to approve the vaccination certificate for ${certificate.catName}?`,
      [
        {
          text: 'Cancel',
          style: 'cancel'
        },
        {
          text: 'Approve',
          onPress: async () => {
            setIsProcessing(true);
            try {
              // Determine which table to update based on gender
              const tableName = certificate.gender === 'Female' ? 'female_cats' : 'male_cats';
              const idField = certificate.gender === 'Female' ? 'female_cat_id' : 'male_cat_id';
              
              // Update the approval_status to true
              const { error } = await supabase
                .from(tableName)
                .update({ approval_status: true })
                .eq(idField, certificate.id);
              
              if (error) throw error;
              
              Alert.alert('Success', 'Certificate has been approved successfully!', [
                {
                  text: 'OK',
                  onPress: () => router.back()
                }
              ]);
            } catch (error: any) {
              Alert.alert('Error', error.message || 'Failed to approve certificate');
            } finally {
              setIsProcessing(false);
            }
          }
        }
      ]
    );
  };

  // Updated handleReject function to update database
  const handleReject = async () => {
    Alert.alert(
      'Reject Certificate',
      `Are you sure you want to reject the vaccination certificate for ${certificate.catName}?`,
      [
        {
          text: 'Cancel',
          style: 'cancel'
        },
        {
          text: 'Reject',
          style: 'destructive',
          onPress: async () => {
            setIsProcessing(true);
            try {
              // Determine which table to update based on gender
              const tableName = certificate.gender === 'Female' ? 'female_cats' : 'male_cats';
              const idField = certificate.gender === 'Female' ? 'female_cat_id' : 'male_cat_id';
              
              // Update the approval_status to false
              const { error } = await supabase
                .from(tableName)
                .update({ approval_status: false })
                .eq(idField, certificate.id);
              
              if (error) throw error;
              
              Alert.alert('Rejected', 'Certificate has been rejected.', [
                {
                  text: 'OK',
                  onPress: () => router.back()
                }
              ]);
            } catch (error: any) {
              Alert.alert('Error', error.message || 'Failed to reject certificate');
            } finally {
              setIsProcessing(false);
            }
          }
        }
      ]
    );
  };

  const handleViewDocument = () => {
    if (certificate.vaccinationStatusUrl) {
      Linking.openURL(certificate.vaccinationStatusUrl).catch(() => {
        Alert.alert('Error', 'Unable to open the document. Please try again.');
      });
    } else {
      Alert.alert('No Document', 'No vaccination certificate document is available for this cat.');
    }
  };

  return (
    <View style={styles.screenContainer}>
      <SafeAreaView style={styles.safeArea}>
        <View style={styles.header}>
          <TouchableOpacity onPress={handleBack} style={styles.backButton}>
            <Icon name="arrow-back" size={24} color={colors.text} />
          </TouchableOpacity>
          <Text style={styles.headerTitle}>Certificate Review</Text>
          <View style={styles.headerRight} />
        </View>

        <ScrollView 
          style={styles.content} 
          contentContainerStyle={styles.scrollContent}
          showsVerticalScrollIndicator={true}
        >
          {/* Certificate Header */}
          <View style={styles.certificateHeader}>
            <Image source={{ uri: certificate.avatar }} style={styles.catAvatar} />
            <View style={styles.catInfo}>
              <Text style={styles.catName}>{certificate.catName}</Text>
              <Text style={styles.catBreed}>{certificate.breed}</Text>
              <Text style={styles.ownerName}>Owner: {certificate.ownerName}</Text>
            </View>
            <View style={styles.statusBadge}>
              <Text style={styles.statusText}>Pending Review</Text>
            </View>
          </View>

          {/* Certificate Details */}
          <View style={styles.detailsSection}>
            <Text style={styles.sectionTitle}>Certificate Information</Text>
            
            <View style={styles.detailCard}>
              <View style={styles.detailRow}>
                <Icon name="document-text" size={20} color={colors.primary} />
                <View style={styles.detailContent}>
                  <Text style={styles.detailLabel}>Document Type</Text>
                  <Text style={styles.detailValue}>Vaccination Certificate</Text>
                </View>
              </View>
            </View>
          </View>

          {/* Certificate Preview */}
          <View style={styles.previewSection}>
            <Text style={styles.sectionTitle}>Certificate Preview</Text>
            <TouchableOpacity style={styles.certificatePreview} onPress={handleViewDocument}>
              <Icon name="document" size={48} color={colors.textSecondary} />
              <Text style={styles.previewText}>Vaccination Certificate</Text>
              <Text style={styles.previewSubtext}>Tap to view full document</Text>
            </TouchableOpacity>
          </View>

          {/* Review Notes */}
          <View style={styles.notesSection}>
            <Text style={styles.sectionTitle}>Review Notes</Text>
            <View style={styles.notesCard}>
              <Text style={styles.notesText}>
                Please verify all information is accurate and the certificate is valid before approving.
              </Text>
            </View>
          </View>
        </ScrollView>

        {/* Action Buttons */}
        <View style={styles.actionSection}>
          <TouchableOpacity 
            style={[buttonStyles.outline, styles.rejectButton]}
            onPress={handleReject}
            disabled={isProcessing}
          >
            <Text style={styles.rejectButtonText}>
              {isProcessing ? 'Processing...' : 'Reject Certificate'}
            </Text>
          </TouchableOpacity>

          <TouchableOpacity 
            style={[buttonStyles.primary, styles.approveButton]}
            onPress={handleApprove}
            disabled={isProcessing}
          >
            <Text style={styles.approveButtonText}>
              {isProcessing ? 'Processing...' : 'Approve Certificate'}
            </Text>
          </TouchableOpacity>
        </View>
      </SafeAreaView>
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
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
    paddingVertical: 16,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
  },
  backButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: colors.backgroundAlt,
    alignItems: 'center',
    justifyContent: 'center',
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: colors.text,
  },
  headerRight: {
    width: 40,
  },
  content: {
    flex: 1,
  },
  scrollContent: {
    padding: 20,
  },
  certificateHeader: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    backgroundColor: colors.card,
    borderRadius: 16,
    padding: 20,
    marginBottom: 24,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 4,
  },
  catAvatar: {
    width: 80,
    height: 80,
    borderRadius: 40,
    marginRight: 16,
    borderWidth: 3,
    borderColor: colors.primary,
  },
  catInfo: {
    flex: 1,
  },
  catName: {
    fontSize: 22,
    fontWeight: '700',
    color: colors.text,
    marginBottom: 4,
  },
  catBreed: {
    fontSize: 16,
    fontWeight: '600',
    color: colors.primary,
    marginBottom: 4,
  },
  ownerName: {
    fontSize: 14,
    fontWeight: '500',
    color: colors.textSecondary,
  },
  statusBadge: {
    backgroundColor: colors.warning,
    borderRadius: 12,
    paddingHorizontal: 12,
    paddingVertical: 6,
  },
  statusText: {
    color: colors.background,
    fontSize: 12,
    fontWeight: '600',
  },
  detailsSection: {
    marginBottom: 24,
  },
  sectionTitle: {
    fontSize: 20,
    fontWeight: '700',
    color: colors.text,
    marginBottom: 16,
  },
  detailCard: {
    backgroundColor: colors.card,
    borderRadius: 16,
    padding: 20,
    gap: 20,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 2,
  },
  detailRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 16,
  },
  detailContent: {
    flex: 1,
  },
  detailLabel: {
    fontSize: 14,
    fontWeight: '500',
    color: colors.textSecondary,
    marginBottom: 4,
  },
  detailValue: {
    fontSize: 16,
    fontWeight: '600',
    color: colors.text,
  },
  previewSection: {
    marginBottom: 24,
  },
  certificatePreview: {
    backgroundColor: colors.backgroundAlt,
    borderRadius: 16,
    padding: 40,
    alignItems: 'center',
    borderWidth: 2,
    borderColor: colors.border,
    borderStyle: 'dashed',
  },
  previewText: {
    fontSize: 16,
    fontWeight: '600',
    color: colors.text,
    marginTop: 12,
  },
  previewSubtext: {
    fontSize: 14,
    color: colors.textSecondary,
    marginTop: 4,
  },
  notesSection: {
    marginBottom: 24,
  },
  notesCard: {
    backgroundColor: colors.backgroundAlt,
    borderRadius: 12,
    padding: 16,
    borderLeftWidth: 4,
    borderLeftColor: colors.primary,
  },
  notesText: {
    fontSize: 14,
    color: colors.textSecondary,
    lineHeight: 20,
    fontStyle: 'italic',
  },
  actionSection: {
    flexDirection: 'row',
    gap: 12,
    paddingHorizontal: 20,
    paddingVertical: 16,
    borderTopWidth: 1,
    borderTopColor: colors.border,
    backgroundColor: colors.card,
  },
  rejectButton: {
    flex: 1,
    borderColor: colors.danger,
  },
  rejectButtonText: {
    color: colors.danger,
    fontSize: 16,
    fontWeight: '600',
  },
  approveButton: {
    flex: 1,
    backgroundColor: colors.success,
  },
  approveButtonText: {
    color: colors.background,
    fontSize: 16,
    fontWeight: '600',
  },
});