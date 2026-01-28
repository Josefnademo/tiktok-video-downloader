import { useState, useEffect } from "react";
import {
  StyleSheet,
  Text,
  View,
  TextInput,
  TouchableOpacity,
  ActivityIndicator,
  Alert,
  Platform,
  Linking,
  ScrollView,
  Modal, // <-- Для всплывающего окна
  Image,
} from "react-native";
import * as FileSystem from "expo-file-system/legacy";
import * as Sharing from "expo-sharing";
// Иконки для красоты (встроены в Expo)
import { Ionicons } from "@expo/vector-icons";

export default function HomeScreen() {
  const [url, setUrl] = useState("");
  const [loading, setLoading] = useState(false);
  const [status, setStatus] = useState("");

  // --- ЛОГИКА БАННЕРА ---
  const [showBanner, setShowBanner] = useState(true); // show banner on app start
  const [bannerTimer, setBannerTimer] = useState(4); // timer 4 sec

  // Запускаем таймер при открытии приложения
  useEffect(() => {
    if (showBanner && bannerTimer > 0) {
      const timerId = setTimeout(() => {
        setBannerTimer(bannerTimer - 1);
      }, 1000);
      return () => clearTimeout(timerId);
    }
  }, [showBanner, bannerTimer]);

  const closeBanner = () => {
    setShowBanner(false);
  };

  // --- ЛОГИКА СКАЧИВАНИЯ ---
  const getVideoDirectly = async (tiktokUrl) => {
    try {
      const cleanUrl = tiktokUrl.split("?")[0];
      const apiUrl = `https://www.tikwm.com/api/?url=${encodeURIComponent(cleanUrl)}`;
      const response = await fetch(apiUrl);
      const json = await response.json();
      if (json.code !== 0)
        throw new Error(json.msg || "Error fetching video info");
      return {
        downloadUrl: json.data.hdplay || json.data.play,
        id: json.data.id,
      };
    } catch (error) {
      throw error;
    }
  };

  const downloadVideo = async () => {
    if (!url) {
      Alert.alert("Error", "Please paste a link");
      return;
    }
    setLoading(true);
    setStatus("Processing...");
    try {
      const videoInfo = await getVideoDirectly(url);
      if (Platform.OS === "web") {
        window.open(videoInfo.downloadUrl, "_blank");
      } else {
        const fileUri =
          FileSystem.documentDirectory + `tiktok_${videoInfo.id}.mp4`;
        const downloadRes = await FileSystem.downloadAsync(
          videoInfo.downloadUrl,
          fileUri,
        );
        if (downloadRes.status !== 200) throw new Error("Download failed");
        if (await Sharing.isAvailableAsync()) {
          await Sharing.shareAsync(fileUri);
        } else {
          Alert.alert("Success", "Saved!");
        }
      }
      setStatus("");
      setUrl(""); // Очистить поле после успеха
    } catch (error) {
      Alert.alert("Error", error.message);
      setStatus("Error");
    } finally {
      setLoading(false);
    }
  };

  const openLink = (link) =>
    Linking.openURL(link).catch((err) => console.error(err));

  return (
    <View style={styles.mainWrapper}>
      {/* --- POP-UP BANNER (AliExpress Style) --- */}
      <Modal
        animationType="fade"
        transparent={true}
        visible={showBanner}
        onRequestClose={() => {}} // Блокируем кнопку "Назад" на Андроиде пока идет таймер
      >
        <View style={styles.modalOverlay}>
          <View style={styles.bannerContainer}>
            <View style={styles.bannerImagePlaceholder}>
              {
                <Image
                  source={require("../assets/ad.jpg")}
                  style={styles.realBannerImage}
                />
              }
            </View>

            {/* Timer and cross */}
            <View style={styles.closeButtonContainer}>
              {bannerTimer > 0 ? (
                <View style={styles.timerCircle}>
                  <Text style={styles.timerText}>{bannerTimer}</Text>
                </View>
              ) : (
                <TouchableOpacity
                  onPress={closeBanner}
                  style={styles.closeButton}
                >
                  <Ionicons name="close" size={24} color="black" />
                </TouchableOpacity>
              )}
            </View>
          </View>
        </View>
      </Modal>

      {/* --- Main Ecran --- */}
      <ScrollView contentContainerStyle={styles.scrollContainer}>
        <View style={styles.container}>
          {/* Header Logo */}
          <View style={styles.header}>
            <Text style={styles.logoText}>
              TikTok <Text style={{ color: "#fe2c55" }}>Downloader</Text>{" "}
              <Text style={{ color: "#b0b0b0" }}>Pro</Text>
            </Text>
          </View>

          {/* Main Input Card */}
          <View style={styles.card}>
            <View style={styles.inputContainer}>
              <Ionicons
                name="link-outline"
                size={20}
                color="#666"
                style={{ marginRight: 10 }}
              />
              <TextInput
                style={styles.input}
                placeholder="Paste TikTok link..."
                placeholderTextColor="#666"
                value={url}
                onChangeText={setUrl}
              />
              {url.length > 0 && (
                <TouchableOpacity onPress={() => setUrl("")}>
                  <Ionicons name="close-circle" size={18} color="#666" />
                </TouchableOpacity>
              )}
            </View>

            <TouchableOpacity
              style={[styles.downloadBtn, loading && styles.btnDisabled]}
              onPress={downloadVideo}
              disabled={loading}
            >
              {loading ? (
                <ActivityIndicator color="#000" />
              ) : (
                <Text style={styles.btnText}>Download</Text>
              )}
            </TouchableOpacity>

            {status ? <Text style={styles.statusText}>{status}</Text> : null}
          </View>

          {/* Spacer to push footer down */}
          <View style={{ flex: 1 }} />

          {/* --- FOOTER (Donation & Links) --- */}
          <View style={styles.footer}>
            <TouchableOpacity
              style={styles.donateBtn}
              onPress={() => openLink("https://www.buymeacoffee.com/")}
            >
              <Text style={styles.donateText}>☕ Support Author</Text>
            </TouchableOpacity>

            <View style={styles.socialLinks}>
              <TouchableOpacity
                onPress={() => openLink("https://github.com/Josefnademo")}
              >
                <Ionicons name="logo-github" size={26} color="#666" />
              </TouchableOpacity>
              <TouchableOpacity onPress={() => openLink("https://t.me/")}>
                <Ionicons name="paper-plane-outline" size={26} color="#666" />
              </TouchableOpacity>
            </View>
            <Text style={styles.version}>v1.0.0</Text>
          </View>
        </View>
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  mainWrapper: { flex: 1, backgroundColor: "#000" },
  scrollContainer: { flexGrow: 1 },
  container: { flex: 1, padding: 20, alignItems: "center" },

  // --- BANNER STYLES ---
  modalOverlay: {
    flex: 1,
    backgroundColor: "rgba(0,0,0,0.85)", // Затемнение фона (85%)
    justifyContent: "center",
    alignItems: "center",
  },
  bannerContainer: {
    width: "90%",
    height: "80%",
    position: "relative",
    backgroundColor: "transparent", // Прозрачный контейнер, картинка задает форму
  },
  bannerImagePlaceholder: {
    width: "100%",
    height: "100%",
    backgroundColor: "#fe2c55", // Красный фон пока нет картинки
    borderRadius: 15,
    justifyContent: "center",
    alignItems: "center",
    overflow: "hidden",
  },
  realBannerImage: {
    width: "100%",
    height: "100%",
  },
  closeButtonContainer: {
    position: "absolute",
    top: -15,
    right: -15,
    zIndex: 10,
  },
  timerCircle: {
    width: 35,
    height: 35,
    borderRadius: 15,
    backgroundColor: "rgba(255,255,255,0.3)",
    justifyContent: "center",
    alignItems: "center",
    borderWidth: 1,
    borderColor: "#fff",
  },
  timerText: { color: "#fff", fontSize: 12, fontWeight: "bold" },
  closeButton: {
    width: 34,
    height: 34,
    borderRadius: 17,
    backgroundColor: "#fff",
    justifyContent: "center",
    alignItems: "center",
    elevation: 5, // shadow for Android
  },

  // --- APP STYLES ---
  header: { marginTop: 0, marginBottom: 20 },
  logoText: {
    fontSize: 36,
    fontWeight: "900",
    color: "#C0C0C0",
    letterSpacing: 1,
  },

  card: {
    width: "100%",
    backgroundColor: "#121212",
    borderRadius: 20,
    padding: 18,
    borderWidth: 1,
    borderColor: "#333",
  },
  inputContainer: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#1e1e1e",
    borderRadius: 12,
    paddingHorizontal: 15,
    height: 55,
    marginBottom: 20,
    borderWidth: 1,
    borderColor: "#333",
  },
  input: {
    flex: 1,
    color: "#fff",
    fontSize: 16,
    height: "100%",
    outlineStyle: "none",
  },

  downloadBtn: {
    backgroundColor: "#fe2c55",
    height: 55,
    borderRadius: 12,
    justifyContent: "center",
    alignItems: "center",
    shadowColor: "#fe2c55",
    shadowOpacity: 0.4,
    shadowRadius: 10,
    elevation: 5,
  },
  btnDisabled: { backgroundColor: "#555" },
  btnText: { color: "#fff", fontSize: 18, fontWeight: "bold" },
  statusText: {
    color: "#00ffcc",
    marginTop: 15,
    textAlign: "center",
    fontSize: 14,
  },

  // --- FOOTER ---
  footer: { width: "100%", alignItems: "center", paddingBottom: 10 },
  donateBtn: {
    backgroundColor: "#FFDD00",
    paddingVertical: 12,
    paddingHorizontal: 25,
    borderRadius: 30,
    marginBottom: 20,
  },
  donateText: { color: "#000", fontWeight: "bold", fontSize: 18 },
  socialLinks: { flexDirection: "row", gap: 25, marginBottom: 10 },
  version: { color: "#444", fontSize: 10 },
});
