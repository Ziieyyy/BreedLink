import React, { useEffect, useState } from "react";
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
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { useRouter } from "expo-router";
import * as ImagePicker from "expo-image-picker";
import * as DocumentPicker from "expo-document-picker";
import * as FileSystem from "expo-file-system/legacy"; // ✅ use legacy to fix base64 warning
import { decode } from "base64-arraybuffer";
import { Picker } from "@react-native-picker/picker";
import { colors, buttonStyles } from "../styles/commonStyles";
import Icon from "../components/Icon";
import { supabase } from "supabase";

export default function InsertFemaleCatScreen() {
  const router = useRouter();

  const [catData, setCatData] = useState({
    owner_id: "",
    name: "",
    breed: "",
    age: "",
    health_status: "",
    vaccination_status_url: "",
  });

  const [profileImage, setProfileImage] = useState<string | null>(null);
  const [profileImageBase64, setProfileImageBase64] = useState<string | null>(
    null
  );
  const [vaccinationFileName, setVaccinationFileName] = useState<string | null>(
    null
  );
  const [vaccinationBase64, setVaccinationBase64] = useState<string | null>(
    null
  );
  const [owners, setOwners] = useState<{ owner_id: string; name: string }[]>([]);
  const [uploading, setUploading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);
  const [uploadMessage, setUploadMessage] = useState("");

  // ✅ Fetch owner list
  useEffect(() => {
    const fetchOwners = async () => {
      const { data, error } = await supabase
        .from("owner")
        .select("owner_id, name")
        .order("name");
      if (error) Alert.alert("Error", error.message);
      else setOwners(data || []);
    };
    fetchOwners();
  }, []);

  // ✅ Upload Base64 File to Supabase Storage
  const uploadBase64File = async (
    bucket: string,
    base64Data: string,
    fileName: string,
    contentType: string
  ): Promise<string | null> => {
    try {
      setUploading(true);
      setUploadProgress(0);
      setUploadMessage(`Uploading to ${bucket}...`);

      const uniqueName = `${Date.now()}-${fileName}`;

      const { data, error } = await supabase.storage
        .from(bucket)
        .upload(uniqueName, decode(base64Data), {
          contentType,
        });

      if (error) {
        Alert.alert("Upload Error", error.message);
        return null;
      }

      const { data: publicUrlData } = supabase.storage
        .from(bucket)
        .getPublicUrl(uniqueName);

      setUploadProgress(100);
      setUploadMessage(`Upload complete!`);
      return publicUrlData.publicUrl;
    } catch (err: any) {
      Alert.alert("Upload Error", err.message);
      return null;
    } finally {
      setTimeout(() => {
        setUploading(false);
        setUploadProgress(0);
      }, 1500);
    }
  };

  // ✅ Handle Save
  const handleSave = async () => {
    if (!catData.name) {
      Alert.alert("Error", "Cat name is required");
      return;
    }

    try {
      setUploading(true);
      setUploadMessage("Uploading files...");
      let profileImageUrl: string | null = null;
      let vaccinationUrl: string | null = null;

      if (profileImageBase64) {
        profileImageUrl = await uploadBase64File(
          "cat-profile-image",
          profileImageBase64,
          "cat-profile.jpg",
          "image/jpeg"
        );
      }

      if (vaccinationBase64) {
        vaccinationUrl = await uploadBase64File(
          "vaccination",
          vaccinationBase64,
          vaccinationFileName || "vaccination.pdf",
          "application/pdf"
        );
      }

      const { error } = await supabase.from("female_cats").insert([
        {
          owner_id: catData.owner_id || null,
          name: catData.name,
          breed: catData.breed,
          age: catData.age ? parseInt(catData.age) : null,
          health_status: catData.health_status,
          vaccination_status_url: vaccinationUrl,
          profile_image_url: profileImageUrl,
        },
      ]);

      if (error) throw error;

      Alert.alert("Success", "Female cat added successfully!", [
        { text: "OK", onPress: () => router.back() },
      ]);
    } catch (err: any) {
      Alert.alert("Error", err.message || "Failed to save cat");
    } finally {
      setUploading(false);
    }
  };

  // ✅ Pick Image
  const handleImagePicker = async () => {
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

    if (!result.canceled && result.assets && result.assets.length > 0) {
      const image = result.assets[0];
      setProfileImage(image.uri);
      setProfileImageBase64(image.base64 || null);
    }
  };

  // ✅ Pick PDF (using legacy filesystem for base64)
  const handlePDFPicker = async () => {
    try {
      const result = await DocumentPicker.getDocumentAsync({
        type: "application/pdf",
        copyToCacheDirectory: true,
      });

      if (!result.canceled && result.assets && result.assets.length > 0) {
        const file = result.assets[0];
        const base64 = await FileSystem.readAsStringAsync(file.uri, {
          encoding: "base64",
        });

        setVaccinationFileName(file.name);
        setVaccinationBase64(base64);
        setCatData((prev) => ({
          ...prev,
          vaccination_status_url: file.uri,
        }));
      }
    } catch (error) {
      console.error("Error picking document:", error);
    }
  };

  const handleCancel = () => router.back();

  return (
    <SafeAreaView style={styles.container}>
      <KeyboardAvoidingView
        style={{ flex: 1 }}
        behavior={Platform.OS === "ios" ? "padding" : "height"}
      >
        {/* Upload Progress Overlay */}
        <Modal visible={uploading} transparent animationType="fade">
          <View style={styles.overlay}>
            <View style={styles.overlayBox}>
              <ActivityIndicator size="large" color={colors.primary} />
              <Text style={styles.overlayText}>{uploadMessage}</Text>
              {uploadProgress > 0 && (
                <Text style={styles.progressText}>{uploadProgress}%</Text>
              )}
            </View>
          </View>
        </Modal>

        {/* Header */}
        <View style={styles.header}>
          <TouchableOpacity onPress={handleCancel}>
            <Icon name="arrow-back" size={24} color={colors.text} />
          </TouchableOpacity>
          <Text style={styles.headerTitle}>Add Female Cat</Text>
          <TouchableOpacity disabled={uploading} onPress={handleSave}>
            <Text style={[styles.saveText, uploading && { opacity: 0.5 }]}>
              Save
            </Text>
          </TouchableOpacity>
        </View>

        <ScrollView style={styles.scrollView} showsVerticalScrollIndicator={false}>
          <View style={styles.contentSection}>
            {/* Profile Image */}
            <View style={styles.profileImageWrapper}>
              <TouchableOpacity
                style={styles.profileImageCircle}
                onPress={handleImagePicker}
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
                onPress={handleImagePicker}
              >
                <Icon name="add" size={16} color={colors.text} />
              </TouchableOpacity>
            </View>

            {/* Owner Picker */}
            <View style={styles.inputGroup}>
              <Text style={styles.inputLabel}>Owner</Text>
              <View style={styles.pickerWrapper}>
                <Picker
                  selectedValue={catData.owner_id}
                  onValueChange={(value) =>
                    setCatData((prev) => ({ ...prev, owner_id: value }))
                  }
                >
                  <Picker.Item label="Select Owner" value="" />
                  {owners.map((o) => (
                    <Picker.Item
                      key={o.owner_id}
                      label={o.name}
                      value={o.owner_id}
                    />
                  ))}
                </Picker>
              </View>
            </View>

            {/* Cat Info */}
            <View style={styles.inputGroup}>
              <Text style={styles.inputLabel}>Name</Text>
              <TextInput
                style={styles.textInput}
                placeholder="Cat Name"
                value={catData.name}
                onChangeText={(text) =>
                  setCatData((prev) => ({ ...prev, name: text }))
                }
              />
            </View>

            <View style={styles.inputGroup}>
              <Text style={styles.inputLabel}>Breed</Text>
              <TextInput
                style={styles.textInput}
                placeholder="Breed"
                value={catData.breed}
                onChangeText={(text) =>
                  setCatData((prev) => ({ ...prev, breed: text }))
                }
              />
            </View>

            <View style={styles.inputGroup}>
              <Text style={styles.inputLabel}>Age</Text>
              <TextInput
                style={styles.textInput}
                placeholder="Age (number)"
                keyboardType="numeric"
                value={catData.age}
                onChangeText={(text) =>
                  setCatData((prev) => ({ ...prev, age: text }))
                }
              />
            </View>

            <View style={styles.inputGroup}>
              <Text style={styles.inputLabel}>Health Status</Text>
              <TextInput
                style={styles.textInput}
                placeholder="Health Status"
                value={catData.health_status}
                onChangeText={(text) =>
                  setCatData((prev) => ({ ...prev, health_status: text }))
                }
              />
            </View>

            {/* Vaccination PDF */}
            <View style={styles.inputGroup}>
              <Text style={styles.inputLabel}>Vaccination Certificate (PDF)</Text>
              <TouchableOpacity
                style={[buttonStyles.secondary, { padding: 12, borderRadius: 8 }]}
                onPress={handlePDFPicker}
              >
                <Text>
                  {vaccinationFileName
                    ? vaccinationFileName
                    : "Select PDF File"}
                </Text>
              </TouchableOpacity>
            </View>

            {/* Buttons */}
            <View style={styles.buttonContainer}>
              <TouchableOpacity
                style={[buttonStyles.secondary, styles.cancelButton]}
                onPress={handleCancel}
                disabled={uploading}
              >
                <Text style={styles.cancelButtonText}>Cancel</Text>
              </TouchableOpacity>

              <TouchableOpacity
                style={[buttonStyles.primary, styles.saveButton]}
                onPress={handleSave}
                disabled={uploading}
              >
                <Text style={buttonStyles.primaryText}>Add Cat</Text>
              </TouchableOpacity>
            </View>
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
  profileImageWrapper: {
    alignSelf: "center",
    marginBottom: 30,
    position: "relative",
  },
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
    backgroundColor: colors.backgroundAlt,
    padding: 12,
    borderRadius: 8,
    fontSize: 16,
    color: colors.text,
  },
  pickerWrapper: {
    backgroundColor: colors.backgroundAlt,
    borderRadius: 8,
    overflow: "hidden",
  },
  buttonContainer: { flexDirection: "row", gap: 12, marginTop: 24 },
  cancelButton: { flex: 1 },
  cancelButtonText: { color: colors.text, fontWeight: "600", fontSize: 16 },
  saveButton: { flex: 1 },
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
  progressText: {
    fontSize: 18,
    fontWeight: "700",
    marginTop: 8,
    color: colors.primary,
  },
});
