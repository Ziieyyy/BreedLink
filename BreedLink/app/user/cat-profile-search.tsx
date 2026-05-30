import React, { useState, useEffect } from "react";
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  ScrollView,
  Image,
  Dimensions,
  ActivityIndicator,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { useRouter, useLocalSearchParams } from "expo-router";
import Icon from "../components/Icon";
import CustomAlert, { AlertType } from "../components/CustomAlert";
import { colors } from "../styles/commonStyles";
import { supabase } from "../supabase";

const { width } = Dimensions.get("window");

interface CatData {
  id: string;
  name: string;
  breed: string;
  age: string;
  health_status: string;
  image: string;
  owner: string;
  owner_id?: string;
  location_address?: string | null;
  active_status: boolean;
  gender: "male" | "female";
}

export default function CatProfileScreen() {
  const router = useRouter();
  const params = useLocalSearchParams();
  const [catData, setCatData] = useState<CatData | null>(null);
  const [loading, setLoading] = useState(true);
  const [myCat, setMyCat] = useState<{ id: number; gender: string } | null>(
    null
  );
  const [alert, setAlert] = useState<{ visible: boolean; type: AlertType; title: string; message: string; showCancelButton?: boolean; onConfirm?: () => void }>({ 
    visible: false, 
    type: 'error', 
    title: '', 
    message: '',
    showCancelButton: false 
  });

  const catId = params.catId as string;
  const gender = params.gender as "male" | "female";
  

  useEffect(() => {
  fetchCatData();

  if (params.myCatId && params.myCatGender) {
    setMyCat({
      id: Number(params.myCatId),
      gender: params.myCatGender as string,
    });
  } else {
    console.warn("No myCat info found in params");
  }
}, []);

  // 🐾 Fetch the selected cat
  const fetchCatData = async () => {
    try {
      setLoading(true);
      if (!catId || !gender) {
        setAlert({ visible: true, type: 'error', title: 'Error', message: 'Invalid cat details.' });
        return;
      }

      const tableName = gender === "female" ? "female_cats" : "male_cats";
      const idColumn = gender === "female" ? "female_cat_id" : "male_cat_id";

      const { data: cat, error: catError } = await supabase
        .from(tableName)
        .select("*")
        .eq(idColumn, catId)
        .single();

      if (catError || !cat) {
        console.error("Error fetching cat data:", catError);
        setAlert({ visible: true, type: 'error', title: 'Error', message: 'Failed to load cat data.' });
        return;
      }

      let ownerName = "Unknown Owner";
      const { data: owner, error: ownerError } = await supabase
        .from("owner")
        .select("name")
        .eq("owner_id", cat.owner_id)
        .single();

      if (!ownerError && owner?.name) ownerName = owner.name;

      const transformed: CatData = {
        id: catId,
        name: cat.name,
        breed: cat.breed || "Unknown",
        age: `${cat.age ?? "N/A"} years`,
        health_status: cat.health_status || "No health info available",
        image: cat.profile_image_url || "https://placekitten.com/400/400",
        owner: ownerName,
        owner_id: cat.owner_id,
        location_address: cat.location_address,
        active_status: cat.active_status ?? true,
        gender,
      };

      setCatData(transformed);
    } catch (err) {
      console.error("Unexpected error:", err);
      setAlert({ visible: true, type: 'error', title: 'Error', message: 'Failed to load cat profile.' });
    } finally {
      setLoading(false);
    }
  };

  // 🧍 Fetch logged-in user’s cat (auto)
  const fetchMyCat = async () => {
    try {
      const {
        data: { user },
      } = await supabase.auth.getUser();

      if (!user) return;

      // Try to find user's male cat
      const { data: maleCat } = await supabase
        .from("male_cats")
        .select("male_cat_id")
        .eq("owner_id", user.id)
        .maybeSingle();

      if (maleCat) {
        setMyCat({ id: maleCat.male_cat_id, gender: "male" });
        return;
      }

      // Try female cat
      const { data: femaleCat } = await supabase
        .from("female_cats")
        .select("female_cat_id")
        .eq("owner_id", user.id)
        .maybeSingle();

      if (femaleCat) {
        setMyCat({ id: femaleCat.female_cat_id, gender: "female" });
      }
    } catch (err) {
      console.error("Error fetching user’s cat:", err);
    }
  };

  // 💬 Start Chat
  // const handleStartChat = () => {
  //   if (!catData) return;
  //   router.push(
  //     `/chat?catId=${catData.id}&catName=${catData.name}&catImage=${encodeURIComponent(
  //       catData.image
  //     )}`
  //   );
  // };

  // ❤️ Match Handler
  // ❤️ Match Handler (with requester_id and receiver_id)
const handleMatch = async () => {
  if (!catData) return;
  if (!myCat) {
    setAlert({ visible: true, type: 'error', title: 'Error', message: "You don't have a registered cat profile yet!" });
    return;
  }

  setAlert({
    visible: true,
    type: 'warning',
    title: 'Confirm Match',
    message: 'Are you sure you want to match this cat?',
    showCancelButton: true,
    onConfirm: async () => {
      try {
        setLoading(true);
        setAlert({ ...alert, visible: false });

        // 🧠 Get logged-in user info
        const {
          data: { user },
        } = await supabase.auth.getUser();

        if (!user) {
          setAlert({ visible: true, type: 'error', title: 'Error', message: 'You must be logged in to send a match.' });
          return;
        }

        // 🧩 Determine male & female cat IDs
        const maleId = myCat.gender === "male" ? myCat.id : Number(catId);
        const femaleId = myCat.gender === "female" ? myCat.id : Number(catId);

        // 👥 Determine who sends and who receives
        const requesterId = user.id;
        const receiverId = catData.owner_id;

        // ✅ Insert matchmaking request
        const { error } = await supabase.from("matchmaking").insert([
          {
            male_cat_id: maleId,
            female_cat_id: femaleId,
            requester_id: requesterId,
            receiver_id: receiverId,
            status: "pending",
          },
        ]);

        if (error) {
          console.error("Matchmaking insert error:", error);
          setAlert({ visible: true, type: 'error', title: 'Error', message: 'Failed to send match request.' });
        } else {
          setAlert({ 
            visible: true, 
            type: 'success', 
            title: 'Success', 
            message: 'Match request has been sent successfully! 🐾',
            onConfirm: () => {
              setAlert({ ...alert, visible: false });
              router.back();
              setTimeout(() => {
                router.replace("/search-partner?refresh=true");
              }, 300);
            }
          });
        }
      } catch (err) {
        console.error("Unexpected error:", err);
        setAlert({ visible: true, type: 'error', title: 'Error', message: 'Something went wrong while matching.' });
      } finally {
        setLoading(false);
      }
    }
  });
};


  if (loading) {
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color={colors.primary} />
          <Text style={styles.loadingText}>Loading cat profile...</Text>
        </View>
      </SafeAreaView>
    );
  }

  if (!catData) {
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.loadingContainer}>
          <Text style={styles.loadingText}>Cat not found 😿</Text>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.container}>
      <CustomAlert
        visible={alert.visible}
        type={alert.type}
        title={alert.title}
        message={alert.message}
        showCancelButton={alert.showCancelButton}
        confirmText="OK"
        onConfirm={alert.onConfirm || (() => setAlert({ ...alert, visible: false }))}
        onCancel={() => setAlert({ ...alert, visible: false })}
      />
      <View style={{ flex: 1 }}>
        <ScrollView showsVerticalScrollIndicator={false} style={styles.scrollView}>
          {/* Header */}
          <View style={styles.header}>
            <TouchableOpacity onPress={() => router.back()}>
              <Icon name="arrow-back" size={24} color={colors.text} />
            </TouchableOpacity>
            <Text style={styles.headerTitle}>{catData.name}</Text>
            <View style={{ width: 24 }} />
          </View>

        {/* Cat Image */}
        <View style={styles.imageContainer}>
          <Image source={{ uri: catData.image }} style={styles.catImage} />
        </View>

        {/* Info */}
        <View style={styles.infoContainer}>
          <Text style={styles.catName}>{catData.name}</Text>
          <Text style={styles.ownerText}>Owned by {catData.owner}</Text>

          <View style={styles.row}>
            <Text style={styles.infoText}>Breed: {catData.breed}</Text>
            <Text style={styles.infoText}>Age: {catData.age}</Text>
          </View>

          {catData.location_address && (
            <Text style={styles.infoText}>📍 {catData.location_address}</Text>
          )}

          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Health Status</Text>
            <Text style={styles.sectionContent}>{catData.health_status}</Text>
          </View>
        </View>
      </ScrollView>
      </View>

      {/* Action Buttons */}
      <View style={styles.bottomContainer}>
        <TouchableOpacity style={styles.matchButton} onPress={handleMatch}>
          <Text style={styles.matchButtonText}>Match</Text>
        </TouchableOpacity>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.background },
  scrollView: { flex: 1 },
  header: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    padding: 16,
  },
  headerTitle: { fontSize: 20, fontWeight: "700", color: colors.text },
  imageContainer: {
    width: "100%",
    height: width * 0.6,
    borderRadius: 16,
    overflow: "hidden",
    marginBottom: 20,
  },
  catImage: { width: "100%", height: "100%" },
  infoContainer: { paddingHorizontal: 16 },
  catName: {
    fontSize: 28,
    fontWeight: "700",
    color: colors.text,
    textAlign: "center",
  },
  ownerText: {
    textAlign: "center",
    color: colors.textLight,
    marginBottom: 16,
  },
  row: {
    flexDirection: "row",
    justifyContent: "space-around",
    marginBottom: 8,
  },
  infoText: { fontSize: 16, color: colors.text },
  section: { marginTop: 16 },
  sectionTitle: {
    fontSize: 18,
    fontWeight: "700",
    color: colors.text,
    marginBottom: 6,
  },
  sectionContent: { fontSize: 15, color: colors.textLight },
  bottomContainer: {
    padding: 16,
    backgroundColor: colors.white,
    borderTopWidth: 1,
    borderTopColor: colors.border,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
  },
  loadingText: { marginTop: 10, color: colors.textLight },
  matchButton: {
    backgroundColor: "#FF7A00",
    borderColor: "#FF7A00",
    borderWidth: 3,
    borderRadius: 12,
    paddingVertical: 14,
    alignItems: "center",
    justifyContent: "center",
    width: "100%",
  },
  matchButtonText: {
    fontSize: 22,
    fontWeight: "700",
    color: "#FFFFFF",
  },
});
