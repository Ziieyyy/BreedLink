import React, { useState, useEffect } from "react";
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  ScrollView,
  KeyboardAvoidingView,
  Platform,
  Alert,
  Image,
  ActivityIndicator,
  Modal,
  Linking,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { useLocalSearchParams, useRouter } from "expo-router";
import * as ImagePicker from "expo-image-picker";
import * as DocumentPicker from "expo-document-picker";
import * as FileSystem from "expo-file-system/legacy"; // ✅ Legacy API for Base64
import { decode } from "base64-arraybuffer";
import { supabase } from '../../supabase';
import { colors, buttonStyles } from '../../styles/adminStyles';
import Icon from '../../components/Icon';

export default function EditFemaleCatScreen() {
  const router = useRouter();
  const { cat_id } = useLocalSearchParams();

  const [catData, setCatData] = useState({
    name: "",
    breed: "",
    age: "",
    health_status: "",
    vaccination_status_url: "",
    profile_image_url: "",
  });

  const [profileImage, setProfileImage] = useState<string | null>(null);
  const [vaccinationFileName, setVaccinationFileName] = useState<string | null>(
    null
  );
  const [uploading, setUploading] = useState(false);
  const [uploadMessage, setUploadMessage] = useState("");

  // ✅ Fetch existing cat data
  useEffect(() => {
    if (!cat_id) return;

    const fetchCatData = async () => {
      const { data, error } = await supabase
        .from("female_cats")
        .select(
          "name, breed, age, health_status, vaccination_status_url, profile_image_url"
        )
        .eq("female_cat_id", cat_id)
        .single();

      if (error) {
        Alert.alert("Error", error.message);
        return;
      }

      if (data) {
        setCatData({
          name: data.name || "",
          breed: data.breed || "",
          age: data.age ? String(data.age) : "",
          health_status: data.health_status || "",
          vaccination_status_url: data.vaccination_status_url || "",
          profile_image_url: data.profile_image_url || "",
        });
        if (data.profile_image_url) setProfileImage(data.profile_image_url);
      }
    };

    fetchCatData();
  }, [cat_id]);

  // ✅ Upload Base64 File
  const uploadBase64File = async (
    bucket: string,
    base64Data: string,
    fileName: string,
    contentType: string
  ): Promise<string | null> => {
    try {
      setUploading(true);
      setUploadMessage(`Uploading ${fileName}...`);

      const uniqueName = `${Date.now()}-${fileName}`;
      const { data, error } = await supabase.storage
        .from(bucket)
        .upload(uniqueName, decode(base64Data), { contentType });

      if (error) throw error;

      const { data: publicData } = supabase.storage
        .from(bucket)
        .getPublicUrl(uniqueName);

      return publicData.publicUrl;
    } catch (err: any) {
      Alert.alert("Upload Error", err.message);
      return null;
    } finally {
      setUploading(false);
    }
  };

  // ✅ Handle Profile Image Change
  const handleChangeImage = async () => {
    const permission = await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (!permission.granted) {
      Alert.alert("Permission Required", "Please allow photo access.");
      return;
    }

    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.Images,
      allowsEditing: true,
      aspect: [1, 1],
      quality: 0.8,
      base64: true,
    });

    if (!result.canceled && result.assets?.length > 0) {
      const image = result.assets[0];
      setProfileImage(image.uri);

      if (image.base64) {
        const uploadedUrl = await uploadBase64File(
          "cat-profile-image",
          image.base64,
          "profile.jpg",
          "image/jpeg"
        );
        if (uploadedUrl) {
          setProfileImage(uploadedUrl);
          setCatData((prev) => ({ ...prev, profile_image_url: uploadedUrl }));
          Alert.alert("Success", "Profile image updated!");
        }
      }
    }
  };

  // ✅ Handle Vaccination PDF Change
  const handleChangePDF = async () => {
    try {
      const result = await DocumentPicker.getDocumentAsync({
        type: "application/pdf",
        copyToCacheDirectory: true,
      });

      if (!result.canceled && result.assets?.length > 0) {
        const file = result.assets[0];
        setVaccinationFileName(file.name);

        const base64 = await FileSystem.readAsStringAsync(file.uri, {
          encoding: "base64",
        });

        const uploadedUrl = await uploadBase64File(
          "vaccination",
          base64,
          file.name,
          "application/pdf"
        );

        if (uploadedUrl) {
          setCatData((prev) => ({
            ...prev,
            vaccination_status_url: uploadedUrl,
          }));
          Alert.alert("Success", "Vaccination PDF updated!");
        }
      }
    } catch (error) {
      Alert.alert("Error", "Failed to upload vaccination file.");
    }
  };

  // ✅ Save Changes
  const handleSave = async () => {
    try {
      const { error } = await supabase
        .from("female_cats")
        .update({
          name: catData.name,
          breed: catData.breed,
          age: parseInt(catData.age) || null,
          health_status: catData.health_status,
          vaccination_status_url: catData.vaccination_status_url,
          profile_image_url: catData.profile_image_url,
        })
        .eq("female_cat_id", cat_id);

      if (error) throw error;

      Alert.alert("Success", "Cat details updated successfully!", [
        { text: "OK", onPress: () => router.back() },
      ]);
    } catch (err: any) {
      Alert.alert("Error", err.message);
    }
  };

  return (
    <SafeAreaView style={styles.container}>
      <KeyboardAvoidingView
        style={{ flex: 1 }}
        behavior={Platform.OS === "ios" ? "padding" : "height"}
      >
        {/* Upload Progress Modal */}
        <Modal visible={uploading} transparent animationType="fade">
          <View style={styles.overlay}>
            <View style={styles.overlayBox}>
              <ActivityIndicator size="large" color={colors.primary} />
              <Text style={styles.overlayText}>{uploadMessage}</Text>
            </View>
          </View>
        </Modal>

        {/* Header */}
        <View style={styles.header}>
          <TouchableOpacity onPress={() => router.back()}>
            <Icon name="arrow-back" size={24} color={colors.text} />
          </TouchableOpacity>
          <Text style={styles.headerTitle}>Edit Female Cat</Text>
          <TouchableOpacity onPress={handleSave}>
            <Text style={styles.saveText}>Save</Text>
          </TouchableOpacity>
        </View>

        {/* Form */}
        <ScrollView style={styles.scrollView}>
          <View style={styles.contentSection}>
            {/* Profile Image */}
            <View style={styles.profileImageWrapper}>
              <TouchableOpacity
                style={styles.profileImageCircle}
                onPress={handleChangeImage}
              >
                {profileImage ? (
                  <Image
                    source={{ uri: profileImage }}
                    style={styles.profileImage}
                  />
                ) : (
                  <Icon name="star" size={60} color={colors.card} />
                )}
              </TouchableOpacity>
              <TouchableOpacity
                style={styles.addIconContainer}
                onPress={handleChangeImage}
              >
                <Icon name="add" size={16} color={colors.text} />
              </TouchableOpacity>
            </View>

            {/* Inputs */}
            {[
              { label: "Name", key: "name", placeholder: "Cat Name" },
              { label: "Breed", key: "breed", placeholder: "Breed" },
              { label: "Age", key: "age", placeholder: "Age", type: "numeric" },
              {
                label: "Health Status",
                key: "health_status",
                placeholder: "Health Status",
              },
            ].map((field) => (
              <View style={styles.inputGroup} key={field.key}>
                <Text style={styles.inputLabel}>{field.label}</Text>
                <TextInput
                  style={styles.textInput}
                  placeholder={field.placeholder}
                  keyboardType={field.type === "numeric" ? "numeric" : "default"}
                  value={catData[field.key as keyof typeof catData]}
                  onChangeText={(text) =>
                    setCatData((prev) => ({ ...prev, [field.key]: text }))
                  }
                />
              </View>
            ))}

            {/* Vaccination PDF */}
            <TouchableOpacity
              style={[buttonStyles.secondary, { marginBottom: 20 }]}
              onPress={handleChangePDF}
            >
              <Text style={buttonStyles.primaryText}>
                {vaccinationFileName || "Change Vaccination PDF"}
              </Text>
            </TouchableOpacity>

            {catData.vaccination_status_url ? (
              <TouchableOpacity
                onPress={() => Linking.openURL(catData.vaccination_status_url)}
              >
                <Text
                  style={{
                    color: colors.primary,
                    textDecorationLine: "underline",
                    marginBottom: 20,
                  }}
                >
                  📄 View Current Vaccination PDF
                </Text>
              </TouchableOpacity>
            ) : null}
          </View>
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.background },
  header: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    padding: 16,
    backgroundColor: colors.card,
  },
  headerTitle: { fontSize: 18, fontWeight: "600", color: colors.text },
  saveText: { fontSize: 16, color: colors.primary, fontWeight: "600" },
  scrollView: { flex: 1 },
  contentSection: { padding: 20 },
  profileImageWrapper: { alignSelf: "center", marginBottom: 30, position: "relative" },
  profileImageCircle: {
    width: 100,
    height: 100,
    borderRadius: 50,
    backgroundColor: "#A8A8A8",
    alignItems: "center",
    justifyContent: "center",
    overflow: "hidden",
  },
  profileImage: { width: "100%", height: "100%", borderRadius: 50 },
  addIconContainer: {
    position: "absolute",
    bottom: 0,
    right: 0,
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: colors.card,
    alignItems: "center",
    justifyContent: "center",
    borderWidth: 1,
    borderColor: "#E0E0E0",
  },
  inputGroup: { marginBottom: 20 },
  inputLabel: {
    fontSize: 14,
    fontWeight: "500",
    marginBottom: 8,
    color: colors.text,
  },
  textInput: {
    backgroundColor: "#F8F9FA",
    padding: 12,
    borderRadius: 8,
    fontSize: 16,
    color: colors.text,
  },
  overlay: {
    flex: 1,
    backgroundColor: "rgba(0,0,0,0.6)",
    justifyContent: "center",
    alignItems: "center",
  },
  overlayBox: {
    backgroundColor: "#fff",
    padding: 20,
    borderRadius: 12,
    width: "70%",
    alignItems: "center",
  },
  overlayText: { fontSize: 16, marginTop: 10, textAlign: "center" },
});
