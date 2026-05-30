import React, { useState } from 'react';
import { View, Text, TextInput, TouchableOpacity, StyleSheet, ScrollView } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter, useLocalSearchParams } from 'expo-router';
import Icon from '../components/Icon';
import CustomAlert, { AlertType } from '../components/CustomAlert';
import { colors, buttonStyles } from '../styles/commonStyles';

export default function ReportUserScreen() {
  const router = useRouter();
  const params = useLocalSearchParams();
  
  const [reason, setReason] = useState('');
  const [details, setDetails] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [alert, setAlert] = useState<{ visible: boolean; type: AlertType; title: string; message: string; onConfirm?: () => void }>({ 
    visible: false, 
    type: 'error', 
    title: '', 
    message: '' 
  });
  
  const reportedUserName = params.userName as string || 'Unknown User';
  const chatId = params.chatId as string || '';

  const reportReasons = [
    'Inappropriate content',
    'Harassment or bullying',
    'Spam or scam',
    'Fake profile',
    'Other'
  ];

  const handleReport = async () => {
    if (!reason) {
      setAlert({ visible: true, type: 'error', title: 'Error', message: 'Please select a reason for reporting.' });
      return;
    }
    
    if (!details.trim()) {
      setAlert({ visible: true, type: 'error', title: 'Error', message: 'Please provide details about the issue.' });
      return;
    }
    
    setIsSubmitting(true);
    
    try {
      // In a real app, you would send this data to your backend
      // For now, we'll just simulate the submission
      console.log('Report submitted:', { 
        chatId, 
        reportedUserName, 
        reason, 
        details 
      });
      
      // Show success message
      setAlert({
        visible: true,
        type: 'success',
        title: 'Report Submitted',
        message: 'Thank you for reporting this user. Our team will review the issue and take appropriate action.',
        onConfirm: () => {
          setAlert({ ...alert, visible: false });
          router.back();
        }
      });
    } catch (error) {
      console.error('Error submitting report:', error);
      setAlert({ visible: true, type: 'error', title: 'Error', message: 'Failed to submit report. Please try again.' });
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <SafeAreaView style={styles.container}>
      <CustomAlert
        visible={alert.visible}
        type={alert.type}
        title={alert.title}
        message={alert.message}
        onConfirm={alert.onConfirm || (() => setAlert({ ...alert, visible: false }))}
      />
      <View style={styles.header}>
        <TouchableOpacity style={styles.backButton} onPress={() => router.back()}>
          <Icon name="arrow-back" size={24} color={colors.text} />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Report User</Text>
        <View style={styles.headerSpacer} />
      </View>

      <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
        <View style={styles.card}>
          <Text style={styles.title}>Report {reportedUserName}</Text>
          <Text style={styles.subtitle}>
            Please provide details about why you're reporting this user.
          </Text>
          
          <View style={styles.section}>
            <Text style={styles.label}>Reason for reporting *</Text>
            {reportReasons.map((item) => (
              <TouchableOpacity
                key={item}
                style={[styles.option, reason === item && styles.selectedOption]}
                onPress={() => setReason(item)}
              >
                <Text style={[styles.optionText, reason === item && styles.selectedOptionText]}>
                  {item}
                </Text>
                {reason === item && (
                  <Icon name="checkmark" size={20} color={colors.primary} />
                )}
              </TouchableOpacity>
            ))}
          </View>
          
          <View style={styles.section}>
            <Text style={styles.label}>Details *</Text>
            <TextInput
              style={styles.textArea}
              value={details}
              onChangeText={setDetails}
              placeholder="Please provide more details about the issue..."
              placeholderTextColor={colors.textLight}
              multiline
              numberOfLines={6}
              textAlignVertical="top"
            />
            <Text style={styles.helperText}>
              Include any relevant information that can help us understand the issue.
            </Text>
          </View>
        </View>
      </ScrollView>
      
      <View style={styles.footer}>
        <TouchableOpacity
          style={[buttonStyles.primary, styles.submitButton]}
          onPress={handleReport}
          disabled={isSubmitting}
        >
          <Text style={buttonStyles.primaryText}>
            {isSubmitting ? 'Submitting...' : 'Submit Report'}
          </Text>
        </TouchableOpacity>
      </View>
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
    paddingHorizontal: 16,
    paddingVertical: 12,
    backgroundColor: colors.white,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
  },
  backButton: {
    padding: 8,
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: colors.text,
  },
  headerSpacer: {
    width: 40,
  },
  content: {
    flex: 1,
    padding: 16,
  },
  card: {
    backgroundColor: colors.white,
    borderRadius: 16,
    padding: 20,
    borderWidth: 1,
    borderColor: colors.border,
  },
  title: {
    fontSize: 24,
    fontWeight: '700',
    color: colors.text,
    marginBottom: 8,
    textAlign: 'center',
  },
  subtitle: {
    fontSize: 16,
    color: colors.textLight,
    marginBottom: 24,
    textAlign: 'center',
    lineHeight: 24,
  },
  section: {
    marginBottom: 24,
  },
  label: {
    fontSize: 16,
    fontWeight: '600',
    color: colors.text,
    marginBottom: 12,
  },
  option: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: 16,
    paddingHorizontal: 16,
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: 12,
    marginBottom: 8,
  },
  selectedOption: {
    borderColor: colors.primary,
    backgroundColor: colors.secondary,
  },
  optionText: {
    fontSize: 16,
    color: colors.text,
  },
  selectedOptionText: {
    fontWeight: '600',
    color: colors.primary,
  },
  textArea: {
    backgroundColor: colors.backgroundAlt,
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: 12,
    padding: 16,
    fontSize: 16,
    color: colors.text,
    minHeight: 120,
    textAlignVertical: 'top',
  },
  helperText: {
    fontSize: 14,
    color: colors.textLight,
    marginTop: 8,
  },
  footer: {
    padding: 16,
    backgroundColor: colors.white,
    borderTopWidth: 1,
    borderTopColor: colors.border,
  },
  submitButton: {
    width: '100%',
  },
});