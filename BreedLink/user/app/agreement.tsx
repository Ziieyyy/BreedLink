import * as FileSystem from "expo-file-system";
import * as Print from "expo-print";
import * as Sharing from "expo-sharing";
import { useState, useEffect } from "react";
import {
  Modal,
  Pressable,
  ScrollView,
  StyleSheet,
  Switch,
  Text,
  TextInput,
  View,
  Platform,
} from "react-native";
import DateTimePicker from "@react-native-community/datetimepicker";
import { supabase } from "../supabase";
import AsyncStorage from "@react-native-async-storage/async-storage";
import CustomAlert, { AlertType } from "../components/CustomAlert";


interface Owner {
  id: string;
  name: string;
}

interface Cat {
  id: string;
  name: string;
}

interface Term {
  id: string;
  text: string;
}

export default function MutualAgreement({
  visible,
  onClose,
  onProceed,
  ownerA,
  ownerB,
  catA,
  catB,
  currentUserId,
  matchId,
}: {
  visible: boolean;
  onClose: () => void;
  onProceed?: () => void;
  ownerA: Owner;
  ownerB: Owner;
  catA: Cat;
  catB: Cat;
  currentUserId?: string | null;
  matchId?: number;
}) {
  const [terms, setTerms] = useState<Term[]>([]);
  const [notes, setNotes] = useState("");
  const [effectiveDate, setEffectiveDate] = useState<string>("");
  const [date, setDate] = useState<Date>(new Date());
  const [showDatePicker, setShowDatePicker] = useState(false);
  const [agreedA, setAgreedA] = useState(false);
  const [agreedB, setAgreedB] = useState(false);
  const [isLocked, setIsLocked] = useState(false);
  const [loading, setLoading] = useState(true);
  const [proceeded, setProceeded] = useState(false);
  const [matchStatus, setMatchStatus] = useState<string>("pending");
  const [alert, setAlert] = useState<{ visible: boolean; type: AlertType; title: string; message: string }>({ 
    visible: false, 
    type: 'error', 
    title: '', 
    message: '' 
  });
  const [showMatchSuccess, setShowMatchSuccess] = useState(false); // New state for match success message
  const [showInstructions, setShowInstructions] = useState(false); // State for showing/hiding instructions



  const bothAgreed = agreedA && agreedB;

  // 🟦 Fetch agreement
  useEffect(() => {
  const loadAgreement = async () => {
    if (!matchId) return;

    // 🟦 Fetch agreement data
    const { data, error } = await supabase
      .from("agreements")
      .select("*")
      .eq("match_id", matchId)
      .single();

    if (error && error.code !== "PGRST116") {
      console.error("Fetch error:", error);
      return;
    }

    if (data) {
      setAgreedA(!!data.signed_by_owner1);
      setAgreedB(!!data.signed_by_owner2);
      setIsLocked(!!data.signed_by_owner1 && !!data.signed_by_owner2);
      setEffectiveDate(data.effective_date ? data.effective_date.split("T")[0] : "");
      setNotes(data.additional_notes || "");
      if (data.terms) {
        const parsed = data.terms
          .split("\n")
          .filter((t: string) => t.trim() !== "")
          .map((t: string, i: number) => ({ id: `t${i}`, text: t }));
        setTerms(parsed);
      }
    } else {
      setTerms([]);
      setNotes("");
      setEffectiveDate("");
    }

    // 🟦 Fetch matchmaking status
    const { data: matchData, error: matchErr } = await supabase
      .from("matchmaking")
      .select("status")
      .eq("match_id", matchId)
      .single();

    if (!matchErr && matchData) {
      setMatchStatus(matchData.status);
    }

    setLoading(false);

    // 🟣 Load proceeded flag from local storage
   const proceededFlag = await AsyncStorage.getItem(`proceeded_${matchId}`);
   setProceeded(proceededFlag === "true");

  };

  loadAgreement();
}, [matchId]);


  const invalidateApprovals = () => {
    setAgreedA(false);
    setAgreedB(false);
    setIsLocked(false);
  };

  const saveAgreement = async (opts?: { asDraft?: boolean }) => {
  if (!matchId) return;

  const payload = {
    match_id: matchId,
    terms: terms.map((t) => t.text).join("\n"),
    signed_by_owner1: agreedA,
    signed_by_owner2: agreedB,
    signed_date: bothAgreed ? new Date().toISOString() : null,
    additional_notes: notes,
    effective_date: effectiveDate || null,
  };

  const { data: existing } = await supabase
    .from("agreements")
    .select("match_id")
    .eq("match_id", matchId)
    .single();

  const { error } = existing
    ? await supabase.from("agreements").update(payload).eq("match_id", matchId)
    : await supabase.from("agreements").insert(payload);

  if (error) {
    setAlert({ visible: true, type: 'error', title: 'Error', message: 'Failed to save agreement.' });
    console.error(error);
  } else {
    if (opts?.asDraft) {
      // ✅ Show a message for draft
      setAlert({ visible: true, type: 'success', title: 'Draft Saved', message: 'Your changes have been saved as a draft.' });
    } else {
      setAlert({ visible: true, type: 'success', title: 'Saved', message: 'Agreement updated successfully!' });
    }
  }
};


  const addTerm = () => {
    if (isLocked) return;
    const id = `t${Date.now()}`;
    setTerms([...terms, { id, text: "" }]);
    invalidateApprovals();
  };

  const removeTerm = (id: string) => {
    if (isLocked) return;
    setTerms(terms.filter((t) => t.id !== id));
    invalidateApprovals();
  };

  const updateTerm = (id: string, text: string) => {
    if (isLocked) return;
    setTerms(terms.map((t) => (t.id === id ? { ...t, text } : t)));
    invalidateApprovals();
  };

  const handleSign = async (owner: "A" | "B", value: boolean) => {
    if (owner === "A") setAgreedA(value);
    if (owner === "B") setAgreedB(value);
    await saveAgreement();
  };

  const exportToPdf = async () => {
    try {
      const html = `
        <html>
          <head>
            <style>
              body {
                font-family: 'Arial', sans-serif;
                padding: 30px;
                background-color: #f9f9f9;
                color: #333;
                line-height: 1.6;
              }
              .container {
                background: #fff;
                border-radius: 10px;
                padding: 25px;
                box-shadow: 0 0 10px rgba(0,0,0,0.1);
                max-width: 700px;
                margin: 0 auto;
              }
              h2 {
                text-align: center;
                color: #2c3e50;
              }
              hr {
                border: none;
                height: 1px;
                background-color: #ddd;
                margin: 20px 0;
              }
              .section-title {
                font-weight: bold;
                color: #34495e;
                margin-top: 15px;
              }
              ol {
                padding-left: 20px;
              }
              .signature {
                display: flex;
                justify-content: space-between;
                margin-top: 40px;
              }
              .sig-box {
                width: 45%;
                text-align: center;
                border-top: 1px solid #000;
                padding-top: 5px;
              }
              .terms {
                background: #f0f4f8;
                padding: 15px;
                border-radius: 8px;
                font-size: 14px;
                margin-top: 25px;
              }
            </style>
          </head>
          <body>
            <div class="container">
              <h2>BreedLink Match Agreement</h2>
              <hr>
              <p><span class="section-title">Owners:</span> ${ownerA.name} & ${ownerB.name}</p>
              <p><span class="section-title">Cats:</span> ${catA.name} & ${catB.name}</p>
              <p><span class="section-title">Effective Date:</span> ${effectiveDate || "Not set"}</p>
              <hr>
              <h3 style="margin-bottom:5px;">Agreement Terms</h3>
              <ol>${terms.map((t) => `<li>${t.text}</li>`).join("")}</ol>
              <hr>
              <p><span class="section-title">Notes:</span> ${notes || "None"}</p>

              <div class="terms">
                <h4 style="margin-top:0;">Terms & Conditions</h4>
                <p>1. Both owners agree that the cats involved are healthy, vaccinated, and free from contagious diseases.</p>
                <p>2. Any offspring produced from this pairing shall be discussed and divided based on mutual agreement.</p>
                <p>3. BreedLink is not responsible for disputes, injuries, or outcomes resulting from this agreement.</p>
                <p>4. Both parties confirm that the information provided above is true and accurate at the time of signing.</p>
                <p>5. Any modification to this agreement must be mutually agreed upon in writing.</p>
              </div>
            </div>
          </body>
        </html>
      `;
      const { uri } = await Print.printToFileAsync({ html });
      if (await Sharing.isAvailableAsync()) await Sharing.shareAsync(uri);
    } catch (err) {
      setAlert({ visible: true, type: 'error', title: 'Error', message: 'Could not export PDF.' });
    }
  };

  const handleDateChange = (event: any, selectedDate?: Date) => {
    setShowDatePicker(false);
    if (selectedDate) {
      // Check if selected date is today or in the future
      const today = new Date();
      today.setHours(0, 0, 0, 0); // Reset time part for comparison
      const selected = new Date(selectedDate);
      selected.setHours(0, 0, 0, 0);
      
      if (selected >= today) {
        setDate(selectedDate);
        setEffectiveDate(selectedDate.toISOString().split("T")[0]);
        invalidateApprovals();
      }
    }
  };

  if (loading) return null;

  // Show success message when match is confirmed
  if (showMatchSuccess) {
    return (
      <Modal visible={visible} animationType="slide" transparent onRequestClose={onClose}>
        <View style={styles.backdrop}>
          <View style={styles.container}>
            <View style={styles.successContainer}>
              <Text style={styles.successTitle}>🎉 Success!</Text>
              <Text style={styles.successMessage}>You have successfully matched your cat!</Text>
              <Text style={styles.successDetail}>
                {catA.name} and {catB.name} are now matched for breeding.
              </Text>
              <Pressable 
                style={{
                  backgroundColor: '#FF6B35',
                  padding: 15,
                  borderRadius: 12,
                  alignItems: 'center',
                  marginTop: 20,
                  minWidth: 150,
                  borderWidth: 2,
                  borderColor: '#ffffff',
                }} 
                onPress={() => {
                  setShowMatchSuccess(false);
                  onClose();
                }}
              >
                <Text style={{ 
                  color: '#ffffff', 
                  fontSize: 18, 
                  fontWeight: 'bold',
                  textShadowColor: 'rgba(0, 0, 0, 0.75)',
                  textShadowOffset: { width: 1, height: 1 },
                  textShadowRadius: 2
                }}>
                  CLOSE
                </Text>
              </Pressable>
            </View>
          </View>
        </View>
      </Modal>
    );
  }

  return (
    <Modal visible={visible} animationType="slide" transparent onRequestClose={onClose}>
      <CustomAlert
        visible={alert.visible}
        type={alert.type}
        title={alert.title}
        message={alert.message}
        onConfirm={() => setAlert({ ...alert, visible: false })}
      />
      <View style={styles.backdrop}>
        <View style={styles.container}>
          <View style={styles.header}>
            <Text style={styles.title}>Mutual Agreement</Text>
            <Text style={styles.subtitle}>
              {catA.name} ({ownerA.name}) ↔ {catB.name} ({ownerB.name})
            </Text>
          </View>

          {/* 🟢 Status Banner */}
          <View
            style={[
              styles.statusBanner,
              { backgroundColor: bothAgreed ? "#dcfce7" : "#fef9c3" },
            ]}
          >
            <Text style={{ textAlign: "center" }}>
              {bothAgreed
                ? "✅ Both owners have signed. Agreement locked."
                : "⚠️ Waiting for both owners to sign."}
            </Text>
          </View>

          {/* 📋 How to Use Button */}
          <View style={{ padding: 10 }}>
            <Pressable 
              style={styles.howToUseButton}
              onPress={() => setShowInstructions(!showInstructions)}
            >
              <Text style={styles.howToUseButtonText}>📋 How to Use</Text>
              <Text style={styles.howToUseIcon}>{showInstructions ? "▲" : "▼"}</Text>
            </Pressable>

            {/* Instructions Box (conditionally rendered) */}
            {showInstructions && (
              <View style={styles.instructionsBox}>
                <View style={styles.instructionItem}>
                  <Text style={styles.checkboxIcon}>☑️</Text>
                  <Text style={styles.instructionText}><Text style={styles.bold}>Step 1:</Text> Add Effective Date</Text>
                </View>
                <View style={styles.instructionItem}>
                  <Text style={styles.checkboxIcon}>☑️</Text>
                  <Text style={styles.instructionText}><Text style={styles.bold}>Step 2:</Text> Add Terms & Conditions</Text>
                </View>
                <View style={styles.instructionItem}>
                  <Text style={styles.checkboxIcon}>☑️</Text>
                  <Text style={styles.instructionText}><Text style={styles.bold}>Step 3:</Text> Add Additional Notes (Optional)</Text>
                </View>
                <View style={styles.instructionItem}>
                  <Text style={styles.checkboxIcon}>☑️</Text>
                  <Text style={styles.instructionText}><Text style={styles.bold}>Step 4:</Text> Turn ON your switch to save the agreement</Text>
                </View>
                <View style={styles.instructionItem}>
                  <Text style={styles.checkboxIcon}>☑️</Text>
                  <Text style={styles.instructionText}><Text style={styles.bold}>Step 5:</Text> Save Draft to store your changes</Text>
                </View>
                <View style={styles.instructionItem}>
                  <Text style={styles.checkboxIcon}>☑️</Text>
                  <Text style={styles.instructionText}><Text style={styles.bold}>Step 6:</Text> Wait for the other owner to turn ON their switch</Text>
                </View>
                <View style={styles.instructionItem}>
                  <Text style={styles.checkboxIcon}>☑️</Text>
                  <Text style={styles.instructionText}><Text style={styles.bold}>Step 7:</Text> After both agree, click Proceed button</Text>
                </View>
                <View style={styles.instructionItem}>
                  <Text style={styles.checkboxIcon}>☑️</Text>
                  <Text style={styles.instructionText}><Text style={styles.bold}>Step 8:</Text> Export PDF once match is completed</Text>
                </View>
                <View style={styles.instructionItem}>
                  <Text style={styles.checkboxIcon}>☑️</Text>
                  <Text style={styles.instructionText}><Text style={styles.bold}>Step 9:</Text> After breeding, click triple dots (⋮) to mark as complete</Text>
                </View>
              </View>
            )}
          </View>

          <ScrollView contentContainerStyle={styles.body}>
            {/* Switches */}
            <View style={styles.statusRow}>
              <View style={styles.statusCol}>
                <Text style={styles.statusLabel}>{ownerA.name}</Text>
                <Switch
                  value={agreedA}
                  onValueChange={(val) => {
                    if (currentUserId === ownerA.id) handleSign("A", val);
                  }}
                  disabled={currentUserId !== ownerA.id || isLocked}
                  trackColor={{ false: "#d1d5db", true: "#22c55e" }}
                  thumbColor={agreedA ? "#ffffff" : "#f4f4f5"}
                />
              </View>
              <View style={styles.statusCol}>
                <Text style={styles.statusLabel}>{ownerB.name}</Text>
                <Switch
                  value={agreedB}
                  onValueChange={(val) => {
                    if (currentUserId === ownerB.id) handleSign("B", val);
                  }}
                  disabled={currentUserId !== ownerB.id || isLocked}
                  trackColor={{ false: "#d1d5db", true: "#22c55e" }}
                  thumbColor={agreedB ? "#ffffff" : "#f4f4f5"}
                />
              </View>
            </View>

            {/* Date */}
            <View style={styles.fieldGroup}>
              <Text style={styles.fieldLabel}>Effective Date</Text>
              <Pressable
                onPress={() => !isLocked && setShowDatePicker(true)}
                style={styles.input}
              >
                <Text>{effectiveDate || "Select Date"}</Text>
              </Pressable>
              {showDatePicker &&
                (Platform.OS === "web" ? (
                  <input
                    type="date"
                    value={effectiveDate}
                    min={new Date().toISOString().split("T")[0]} // Only allow today or future dates
                    onChange={(e) => {
                      setEffectiveDate(e.target.value);
                      invalidateApprovals();
                    }}
                  />
                ) : (
                  <DateTimePicker
                    value={date}
                    mode="date"
                    display="default"
                    onChange={handleDateChange}
                    minimumDate={new Date()} // Only allow today or future dates
                  />
                ))}
            </View>

            {/* Terms */}
            <View style={styles.fieldGroup}>
              <View style={styles.rowBetween}>
                <Text style={styles.fieldLabel}>Terms & Conditions</Text>
                {!isLocked && (
                  <Pressable onPress={addTerm} style={styles.chip}>
                    <Text style={styles.chipText}>+ Add</Text>
                  </Pressable>
                )}
              </View>

              {terms.map((t, i) => (
                <View key={t.id} style={styles.termItem}>
                  <Text style={styles.termIndex}>{i + 1}.</Text>
                  <TextInput
                    multiline
                    value={t.text}
                    editable={!isLocked}
                    onChangeText={(txt) => updateTerm(t.id, txt)}
                    style={styles.termInput}
                  />
                  {!isLocked && (
                    <Pressable onPress={() => removeTerm(t.id)} style={styles.removeBtn}>
                      <Text style={styles.removeBtnText}>X</Text>
                    </Pressable>
                  )}
                </View>
              ))}
            </View>

            {/* Notes */}
            <View style={styles.fieldGroup}>
              <Text style={styles.fieldLabel}>Additional Notes</Text>
              <TextInput
                multiline
                editable={!isLocked}
                value={notes}
                onChangeText={(t) => setNotes(t)}
                style={[styles.input, { minHeight: 80 }]}
              />
            </View>
          </ScrollView>

          {/* Footer */}
          <View style={styles.footer}>
            <Pressable style={[styles.btn, styles.btnGhost]} onPress={onClose}>
              <Text>Close</Text>
            </Pressable>

            {!isLocked && (
              <Pressable
                style={[styles.btn, styles.btnOutline]}
                onPress={() => saveAgreement({ asDraft: true })}
              >
                <Text>Save Draft</Text>
              </Pressable>
            )}

            {matchStatus === "completed" ? (
  // 🟢 Show PDF when status = completed
  <Pressable
    style={[styles.btn, styles.btnOutline]}
    onPress={exportToPdf}
  >
    <Text>Export PDF</Text>
  </Pressable>
) : bothAgreed && !proceeded ? (
  // 🟡 Show Proceed before completion
  <Pressable
    style={[styles.btn, styles.btnPrimary]}
    onPress={async () => {
      await saveAgreement();
      await AsyncStorage.setItem(`proceeded_${matchId}`, "true");
      // Show success message instead of calling onProceed
      setShowMatchSuccess(true);
      setProceeded(true);
    }}
  >
    <Text style={{ color: "#fff" }}>Proceed</Text>
  </Pressable>
) : (
  // 🔹 Otherwise show default Save Draft / Close only
  <Pressable
    style={[styles.btn, styles.btnOutline]}
    onPress={exportToPdf}
  >
    <Text>Export PDF</Text>
  </Pressable>
)}


          </View>
        </View>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  backdrop: { flex: 1, backgroundColor: "rgba(0,0,0,0.35)", padding: 16, justifyContent: "flex-end" },
  container: { backgroundColor: "#fff", borderRadius: 20, maxHeight: "92%" },
  header: { padding: 16, borderBottomWidth: StyleSheet.hairlineWidth, borderBottomColor: "#e5e7eb" },
  title: { fontSize: 20, fontWeight: "700" },
  subtitle: { color: "#4b5563", marginTop: 4 },
  body: { padding: 16 },
  statusBanner: { padding: 10, borderRadius: 8, margin: 10 },
  statusRow: { flexDirection: "row", justifyContent: "space-between", marginBottom: 10 },
  statusCol: { flex: 1, alignItems: "center" },
  statusLabel: { fontWeight: "700", marginBottom: 4 },
  fieldGroup: { marginBottom: 10 },
  fieldLabel: { fontWeight: "700", marginBottom: 4 },
  input: { borderWidth: 1, borderColor: "#e5e7eb", borderRadius: 10, padding: 8 },
  rowBetween: { flexDirection: "row", justifyContent: "space-between", alignItems: "center" },
  chip: { backgroundColor: "#FFF0EB", paddingHorizontal: 10, paddingVertical: 6, borderRadius: 999 },
  chipText: { color: "#FF6B35", fontWeight: "600" },
  termItem: { flexDirection: "row", alignItems: "center", marginBottom: 8 },
  termIndex: { paddingTop: 10, fontWeight: "700", width: 20 },
  termInput: { flex: 1, borderWidth: 1, borderColor: "#e5e7eb", borderRadius: 10, padding: 8 },
  removeBtn: { backgroundColor: "#fee2e2", padding: 6, borderRadius: 6, marginLeft: 4 },
  removeBtnText: { color: "#991b1b", fontWeight: "600" },
  footer: { flexDirection: "row", gap: 10, padding: 12, borderTopWidth: StyleSheet.hairlineWidth, borderTopColor: "#e5e7eb" },
  btn: { flex: 1, padding: 12, borderRadius: 10, alignItems: "center" },
  btnGhost: { backgroundColor: "#f3f4f6" },
  btnOutline: { borderWidth: 1, borderColor: "#FF6B35" },
  btnPrimary: { backgroundColor: "#FF6B35" },
  // Success message styles
  successContainer: { 
    padding: 30, 
    alignItems: "center", 
    justifyContent: "center" 
  },
  successTitle: { 
    fontSize: 24, 
    fontWeight: "bold", 
    color: "#FF6B35", 
    marginBottom: 10 
  },
  successMessage: { 
    fontSize: 18, 
    color: "#333", 
    textAlign: "center", 
    marginBottom: 10 
  },
  successDetail: { 
    fontSize: 16, 
    color: "#666", 
    textAlign: "center", 
    marginBottom: 20 
  },
  successCloseButton: {
    backgroundColor: "#FF6B35",
    padding: 12,
    borderRadius: 10,
    alignItems: "center",
    marginTop: 10,
    minWidth: 120,
  },
  successCloseButtonText: {
    color: "#FFFFFF",
    fontSize: 16,
    fontWeight: "600",
  },
  // Instructions section styles
  howToUseButton: {
    backgroundColor: "#FF6B35",
    padding: 12,
    borderRadius: 8,
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },
  howToUseButtonText: {
    color: "#ffffff",
    fontSize: 16,
    fontWeight: "700",
  },
  howToUseIcon: {
    color: "#ffffff",
    fontSize: 16,
    fontWeight: "700",
  },
  instructionsBox: {
    backgroundColor: "#e0f2fe",
    padding: 12,
    marginTop: 10,
    borderRadius: 8,
    borderLeftWidth: 4,
    borderLeftColor: "#0284c7",
  },
  instructionsTitle: {
    fontSize: 16,
    fontWeight: "700",
    color: "#0c4a6e",
    marginBottom: 10,
  },
  instructionItem: {
    flexDirection: "row",
    alignItems: "flex-start",
    marginBottom: 6,
  },
  checkboxIcon: {
    fontSize: 16,
    marginRight: 8,
    marginTop: 2,
  },
  instructionText: {
    flex: 1,
    fontSize: 13,
    color: "#164e63",
    lineHeight: 18,
  },
  bold: {
    fontWeight: "700",
  },
});