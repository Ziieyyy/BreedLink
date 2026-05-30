import React, { useEffect, useState } from "react";
import {
  View,
  Text,
  TouchableOpacity,
  Image,
  ScrollView,
  StyleSheet,
  ActivityIndicator,
  Alert,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { supabase } from "../supabase";
import Icon from "../components/Icon";
import { useRouter } from "expo-router";
import { colors } from "../styles/commonStyles";
import * as Print from "expo-print";
import * as Sharing from "expo-sharing";
import MutualAgreement from "./agreement";





export default function CompletedMatches() {
  const [matches, setMatches] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [currentUserId, setCurrentUserId] = useState<string | null>(null);
  const [selectedMatch, setSelectedMatch] = useState<any | null>(null);
  const [showAgreementModal, setShowAgreementModal] = useState(false);

  const router = useRouter();

  useEffect(() => {
    const fetchMatches = async () => {
      try {
        const { data: session } = await supabase.auth.getSession();
        const userId = session?.session?.user?.id;
        if (!userId) return;

        setCurrentUserId(userId);

        const { data, error } = await supabase
          .from("matchmaking")
          .select(`
            match_id,
            status,
            created_at,
            male_cat:male_cat_id(name, owner_id, profile_image_url),
            female_cat:female_cat_id(name, owner_id, profile_image_url),
            owner_requester:requester_id(name),
            owner_receiver:receiver_id(name),
            agreements(match_id)
          `)
          .eq("status", "completed")
          .or(`requester_id.eq.${userId},receiver_id.eq.${userId}`);

        if (error) throw error;

        setMatches(data || []);
      } catch (err) {
        console.error("Error fetching completed matches:", err);
      } finally {
        setLoading(false);
      }
    };

    fetchMatches();
  }, []);

  const handleViewAgreement = (match: any) => {
    setSelectedMatch(match);
    setShowAgreementModal(true);
  };

  const getUserRole = (match: any) =>
    match.male_cat.owner_id === currentUserId ? "male" : "female";

  const getMyCat = (match: any) => {
    return match.male_cat.owner_id === currentUserId
      ? match.male_cat
      : match.female_cat;
  };

  const getOtherCat = (match: any) => {
    return match.male_cat.owner_id !== currentUserId
      ? match.male_cat
      : match.female_cat;
  };

  const getOtherOwner = (match: any) => {
    return match.male_cat.owner_id !== currentUserId
      ? match.owner_requester.name
      : match.owner_receiver.name;
  };

  if (loading) {
    return (
      <SafeAreaView style={styles.centered}>
        <ActivityIndicator size="large" color={colors.primary} />
        <Text style={{ marginTop: 10 }}>Loading completed matches...</Text>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()}>
          <Icon name="arrow-back" size={24} color={colors.text} />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Completed Matches</Text>
        <View style={{ width: 24 }} />
      </View>

      <ScrollView contentContainerStyle={styles.listContainer}>
        {matches.length === 0 ? (
          <Text style={styles.emptyText}>No completed matches yet.</Text>
        ) : (
          matches.map((match) => {
            const myCat = getMyCat(match);
            const otherCat = getOtherCat(match);
            const otherOwner = getOtherOwner(match);

            return (
              <View key={match.match_id} style={styles.card}>
                <View style={styles.catInfoContainer}>
                  <Image
                    source={{ uri: myCat.profile_image_url }}
                    style={styles.catImage}
                  />
                  <Image
                    source={{ uri: otherCat.profile_image_url }}
                    style={[styles.catImage, styles.overlapImage]}
                  />
                </View>

                <View style={styles.catDetails}>
                  <Text style={styles.catNames}>
                    {myCat.name} 🐾 x {otherCat.name}
                  </Text>
                  <Text style={styles.ownerText}>
                    With {otherOwner ? otherOwner : "Unknown Owner"}
                  </Text>
                  <TouchableOpacity
                    style={styles.viewButton}
                    onPress={() => {
                      setSelectedMatch(match);
                      setShowAgreementModal(true);
                    }}
                  >
                    <Text style={styles.viewButtonText}>View Agreement</Text>
                  </TouchableOpacity>

                </View>
              </View>
            );
          })
        )}
      </ScrollView>
      {selectedMatch && (
  <MutualAgreement
    visible={showAgreementModal}
    onClose={() => setShowAgreementModal(false)}
    ownerA={{
      id: selectedMatch.male_cat.owner_id,
      name: selectedMatch.owner_requester.name,
    }}
    ownerB={{
      id: selectedMatch.female_cat.owner_id,
      name: selectedMatch.owner_receiver.name,
    }}
    catA={{
      id: selectedMatch.male_cat_id,
      name: selectedMatch.male_cat.name,
    }}
    catB={{
      id: selectedMatch.female_cat_id,
      name: selectedMatch.female_cat.name,
    }}
    currentUserId={currentUserId}
    matchId={selectedMatch.match_id}
  />
)}

    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: "#fff" },
  centered: { flex: 1, justifyContent: "center", alignItems: "center" },
  header: {
    flexDirection: "row",
    alignItems: "center",
    padding: 16,
    borderBottomWidth: 1,
    borderBottomColor: "#eee",
  },
  headerTitle: {
    flex: 1,
    textAlign: "center",
    fontSize: 18,
    fontWeight: "bold",
  },
  listContainer: {
    padding: 16,
  },
  card: {
    backgroundColor: "#f8f8f8",
    borderRadius: 12,
    padding: 16,
    marginBottom: 16,
    flexDirection: "row",
    alignItems: "center",
  },
  catInfoContainer: {
    flexDirection: "row",
    marginRight: 12,
  },
  catImage: {
    width: 60,
    height: 60,
    borderRadius: 30,
  },
  overlapImage: {
    marginLeft: -15,
    borderWidth: 2,
    borderColor: "#fff",
  },
  catDetails: { flex: 1 },
  catNames: {
    fontSize: 16,
    fontWeight: "bold",
  },
  ownerText: {
    color: "#666",
    marginTop: 4,
    marginBottom: 8,
  },
  viewButton: {
    backgroundColor: colors.primary,
    paddingVertical: 6,
    borderRadius: 8,
    alignItems: "center",
  },
  viewButtonText: {
    color: "#fff",
    fontWeight: "bold",
  },
  emptyText: {
    textAlign: "center",
    color: "#777",
    marginTop: 30,
  },
});
