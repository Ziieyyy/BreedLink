import React, { useState } from 'react';
import { View, Text, TouchableOpacity, StyleSheet, ScrollView, Linking, Clipboard } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import Icon from '../components/Icon';
import CustomAlert from '../components/CustomAlert';
import { colors } from '../styles/commonStyles';

export default function SupportScreen() {
  const router = useRouter();
  const [alertVisible, setAlertVisible] = useState(false);

  const handleCopyEmail = async () => {
    Clipboard.setString('brreedlink@gmail.com');
    setAlertVisible(true);
  };

  const handleEmailPress = () => {
    Linking.openURL('mailto:brreedlink@gmail.com');
  };

  const handlePhonePress = (phone: string) => {
    Linking.openURL(`tel:${phone}`);
  };

  return (
    <SafeAreaView style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity style={styles.backButton} onPress={() => router.back()}>
          <Icon name="arrow-back" size={24} color={colors.text} />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Support</Text>
        <View style={styles.headerSpacer} />
      </View>

      <ScrollView style={styles.scrollView} showsVerticalScrollIndicator={false}>
        {/* Custom Alert Demo */}
        <CustomAlert
          visible={alertVisible}
          type="success"
          title="Copied!"
          message="Email address has been copied to clipboard"
          confirmText="OK"
          onConfirm={() => setAlertVisible(false)}
        />

        {/* Main Contact Section */}
        <View style={styles.contactCard}>
          <View style={styles.iconContainer}>
            <Icon name="chatbubbles" size={40} color={colors.primary} />
          </View>

          <Text style={styles.mainTitle}>Say hello to us!</Text>
          
          <Text style={styles.description}>
            Let's talk cats or just share a purr!{'\n'}
            We'd love to hear from you and help your feline find their purr-fect match. 💕
          </Text>

          {/* Contact Details */}
          <View style={styles.detailsContainer}>
            {/* Address */}
            <View style={styles.contactItem}>
              <View style={styles.contactIconWrapper}>
                <Icon name="location" size={20} color={colors.primary} />
              </View>
              <View style={styles.contactTextContainer}>
                <Text style={styles.contactLabel}>Address</Text>
                <Text style={styles.contactValue}>Politeknik Ungku Omar Perak</Text>
              </View>
            </View>

            {/* Phone Numbers */}
            <View style={styles.contactItem}>
              <View style={styles.contactIconWrapper}>
                <Icon name="call" size={20} color={colors.primary} />
              </View>
              <View style={styles.contactTextContainer}>
                <Text style={styles.contactLabel}>Phone</Text>
                <TouchableOpacity onPress={() => handlePhonePress('+60193148928')}>
                  <Text style={styles.contactValueLink}>+60 19-314 8928</Text>
                </TouchableOpacity>
                <TouchableOpacity onPress={() => handlePhonePress('+60172396700')}>
                  <Text style={styles.contactValueLink}>+60 17-239 6700</Text>
                </TouchableOpacity>
                <TouchableOpacity onPress={() => handlePhonePress('+60166798900')}>
                  <Text style={styles.contactValueLink}>+60 16-679 8900</Text>
                </TouchableOpacity>
              </View>
            </View>

            {/* Email */}
            <View style={styles.contactItem}>
              <View style={styles.contactIconWrapper}>
                <Icon name="mail" size={20} color={colors.primary} />
              </View>
              <View style={styles.contactTextContainer}>
                <Text style={styles.contactLabel}>E-mail</Text>
                <TouchableOpacity onPress={handleEmailPress}>
                  <Text style={styles.contactValueLink}>brreedlink@gmail.com</Text>
                </TouchableOpacity>
              </View>
            </View>
          </View>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#FFF9F3',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingVertical: 16,
    backgroundColor: colors.white,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
  },
  backButton: {
    padding: 8,
    marginRight: 8,
  },
  headerTitle: {
    flex: 1,
    fontSize: 20,
    fontWeight: '600',
    color: colors.text,
    textAlign: 'center',
  },
  headerSpacer: {
    width: 40,
  },
  scrollView: {
    flex: 1,
    backgroundColor: '#FFF9F3',
  },
  contactCard: {
    backgroundColor: colors.white,
    margin: 20,
    padding: 24,
    borderRadius: 16,
    alignItems: 'center',
  },
  iconContainer: {
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: colors.backgroundAlt,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 20,
  },
  mainTitle: {
    fontSize: 24,
    fontWeight: '700',
    color: colors.text,
    marginBottom: 12,
    textAlign: 'center',
  },
  description: {
    fontSize: 16,
    color: colors.textLight,
    textAlign: 'center',
    lineHeight: 24,
    marginBottom: 32,
  },
  detailsContainer: {
    width: '100%',
    marginBottom: 24,
  },
  contactItem: {
    flexDirection: 'row',
    marginBottom: 24,
    alignItems: 'flex-start',
  },
  contactIconWrapper: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: colors.backgroundAlt,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 12,
  },
  contactTextContainer: {
    flex: 1,
  },
  contactLabel: {
    fontSize: 14,
    color: colors.textLight,
    marginBottom: 4,
    fontWeight: '500',
  },
  contactValue: {
    fontSize: 16,
    color: colors.text,
    lineHeight: 22,
  },
  contactValueLink: {
    fontSize: 16,
    color: colors.primary,
    lineHeight: 22,
    textDecorationLine: 'underline',
  },
});
