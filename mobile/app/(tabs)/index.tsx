import { useState } from "react";
import {
  StyleSheet,
  Text,
  View,
  TextInput,
  TouchableOpacity,
  ActivityIndicator,
  Alert,
  Platform,
  Linking, // import for opening links
  ScrollView, // import for scrolling
  Image, // import for icons
} from "react-native";
// --- Important change: added '/legacy' ---
import * as FileSystem from "expo-file-system/legacy";
import * as Sharing from "expo-sharing";

// CONFIGURATION

// Via USB cable (adb reverse tcp:3000 tcp:3000):
// const API_URL = "http://localhost:3000";

// Via Wi-Fi (your IP):
const API_URL = "http://10.50.120.24:3000";
const API_TOKEN = "my_strong_token";

export default function HomeScreen() {
  const [url, setUrl] = useState("");
  const [loading, setLoading] = useState(false);
  const [status, setStatus] = useState("");

  const downloadVideo = async () => {
    if (!url) {
      Alert.alert("Error", "Please paste a TikTok URL");
      return;
    }

    setLoading(true);
    setStatus("Processing on server...");

    try {
      const endpoint = `${API_URL}/api/download`;

      // ============================================================
      // WEB BROWSER LOGIC
      // ============================================================
      if (Platform.OS === "web") {
        const response = await fetch(endpoint, {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            "x-api-token": API_TOKEN,
          },
          body: JSON.stringify({
            url: url,
            qualityIndex: 0,
            customFolder: null,
          }),
        });

        if (!response.ok) throw new Error("Server returned error");

        const blob = await response.blob();
        const downloadUrl = window.URL.createObjectURL(blob);
        const a = document.createElement("a");
        a.href = downloadUrl;
        a.download = `tiktok_${Date.now()}.mp4`;
        document.body.appendChild(a);
        a.click();
        a.remove();

        setStatus("Download started in browser!");
      }

      // ============================================================
      // MOBILE (ANDROID/IOS) LOGIC
      // ============================================================
      else {
        const filename = `tiktok_${Date.now()}.mp4`;
        const fileUri = FileSystem.documentDirectory + filename;

        const response = await fetch(endpoint, {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            "x-api-token": API_TOKEN,
          },
          body: JSON.stringify({
            url: url,
            qualityIndex: 0,
            customFolder: null,
          }),
        });

        if (!response.ok)
          throw new Error(`Mobile fetch failed: ${response.status}`);

        const blob = await response.blob();
        const reader = new FileReader();

        reader.readAsDataURL(blob);
        reader.onloadend = async () => {
          const base64data = reader.result.split(",")[1];

          await FileSystem.writeAsStringAsync(fileUri, base64data, {
            encoding: "base64",
          });

          setStatus("Done! Opening share dialog...");

          if (await Sharing.isAvailableAsync()) {
            await Sharing.shareAsync(fileUri);
          } else {
            Alert.alert("Success", "Video saved to app cache");
          }
        };
      }
    } catch (error) {
      console.error(error);
      Alert.alert("Error", `Download failed: ${error.message}`);
      setStatus("Error");
    } finally {
      setLoading(false);
    }
  };

  const openLink = (url) => {
    Linking.openURL(url).catch((err) =>
      console.error("Couldn't load page", err),
    );
  };

  return (
    <ScrollView contentContainerStyle={styles.scrollContainer}>
      <View style={styles.container}>
        {/* Wrapper for Main Content to keep it centered vertically */}
        <View style={styles.mainContent}>
          <Text style={styles.title}>
            TikTok <Text style={styles.titleSpan}>Downloader</Text>
          </Text>

          <View style={styles.card}>
            <Text style={styles.label}>TikTok URL</Text>
            <TextInput
              style={styles.input}
              placeholder="Paste link here..."
              placeholderTextColor="#666"
              value={url}
              onChangeText={setUrl}
            />

            <TouchableOpacity
              style={[styles.button, loading && styles.buttonDisabled]}
              onPress={downloadVideo}
              disabled={loading}
            >
              {loading ? (
                <ActivityIndicator color="#fff" />
              ) : (
                <Text style={styles.buttonText}>Download Video</Text>
              )}
            </TouchableOpacity>

            {status ? <Text style={styles.status}>{status}</Text> : null}
          </View>
        </View>

        {/* --- FOOTER START --- */}
        <View style={styles.footer}>
          {
            <Image
              source={require("../../assets/tdd-icon.svg")}
              style={styles.footerIcon}
            />
            /* <Image
              source={require("../../assets/tiktok.png")}
              style={styles.footerIcon}
            />*/
          }

          <Text style={styles.footerTitle}>TikTok Downloader Pro</Text>
          <Text style={styles.footerSubtitle}>
            Download your favorite TikTok videos with ease
          </Text>

          <View style={styles.footerLinks}>
            <TouchableOpacity
              onPress={() => openLink("https://github.com/Josefnademo")}
            >
              <Text style={styles.linkText}>GitHub</Text>
            </TouchableOpacity>
            <Text style={styles.linkSeparator}>•</Text>
            <TouchableOpacity
              onPress={() => openLink("https://github.com/Josefnademo")}
            >
              <Text style={styles.linkText}>Feedback</Text>
            </TouchableOpacity>
            <Text style={styles.linkSeparator}>•</Text>
            <TouchableOpacity
              onPress={() => openLink("https://github.com/Josefnademo")}
            >
              <Text style={styles.linkText}>Report Bug</Text>
            </TouchableOpacity>
          </View>
        </View>
        {/* --- FOOTER END --- */}
      </View>
    </ScrollView>
  );
}

// STYLES
const styles = StyleSheet.create({
  scrollContainer: {
    flexGrow: 1,
    backgroundColor: "#121212",
  },
  container: {
    flex: 1,
    backgroundColor: "#121212",
    // CHANGED: 'space-between' pushes content to top and footer to bottom
    justifyContent: "space-between",
    alignItems: "center",
    padding: 20,
    minHeight: "100%",
  },
  // NEW: Wrapper to keep the card centered visually in the top space
  mainContent: {
    width: "100%",
    alignItems: "center",
    justifyContent: "center",
    flex: 1, // Takes up all available space, pushing footer down
  },
  title: {
    fontSize: 32,
    fontWeight: "bold",
    color: "#ffffff",
    marginBottom: 30,
    marginTop: 20,
  },
  titleSpan: {
    color: "#fe2c55",
  },
  card: {
    width: "100%",
    backgroundColor: "#1e1e1e",
    padding: 20,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: "#333",
    maxWidth: 500,
  },
  label: {
    color: "#a0a0a0",
    marginBottom: 10,
  },
  input: {
    backgroundColor: "#2a2a2a",
    color: "#ffffff",
    padding: 15,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: "#333",
    marginBottom: 20,
    outlineStyle: "none",
  },
  button: {
    backgroundColor: "#fe2c55",
    padding: 15,
    borderRadius: 8,
    alignItems: "center",
    cursor: "pointer",
  },
  buttonDisabled: {
    backgroundColor: "#444",
    cursor: "default",
  },
  buttonText: {
    color: "#ffffff",
    fontWeight: "bold",
    fontSize: 16,
  },
  status: {
    marginTop: 15,
    color: "#25f4ee",
    textAlign: "center",
  },

  // --- Footer Styles ---
  footer: {
    marginTop: 30,
    paddingTop: 20,
    paddingBottom: 20, // Added padding at bottom for phones with notches
    width: "100%",
    borderTopWidth: 1,
    borderTopColor: "#333",
    alignItems: "center",
  },
  footerIcon: {
    width: 60,
    height: 60,
    marginBottom: 10,
    opacity: 0.9,
  },
  footerTitle: {
    color: "#fff",
    fontWeight: "600",
    fontSize: 14,
  },
  footerSubtitle: {
    color: "#666",
    fontSize: 12,
    marginTop: 5,
    marginBottom: 15,
    textAlign: "center",
  },
  footerLinks: {
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
  },
  linkText: {
    color: "#25f4ee",
    fontSize: 13,
  },
  linkSeparator: {
    color: "#444",
  },
});
