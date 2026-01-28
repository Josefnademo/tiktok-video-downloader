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
  Linking,
  ScrollView,
  Image,
} from "react-native";

import * as FileSystem from "expo-file-system/legacy";
import * as Sharing from "expo-sharing";

export default function HomeScreen() {
  const [url, setUrl] = useState("");
  const [loading, setLoading] = useState(false);
  const [status, setStatus] = useState("");

  // --- logic without server---
  const getVideoDirectly = async (tiktokUrl) => {
    try {
      const cleanUrl = tiktokUrl.split("?")[0];

      const apiUrl = `https://www.tikwm.com/api/?url=${encodeURIComponent(cleanUrl)}`;

      const response = await fetch(apiUrl);
      const json = await response.json();

      if (json.code !== 0) {
        throw new Error(json.msg || "Error fetching video info");
      }

      const videoData = json.data;
      const downloadUrl = videoData.hdplay || videoData.play;

      return {
        downloadUrl: downloadUrl,
        id: videoData.id,
        title: videoData.title || "video",
      };
    } catch (error) {
      throw error;
    }
  };

  const downloadVideo = async () => {
    if (!url) {
      Alert.alert("Error", "Please paste a TikTok URL");
      return;
    }

    setLoading(true);
    setStatus("Analyzing video...");

    try {
      const videoInfo = await getVideoDirectly(url);

      setStatus("Downloading...");

      if (Platform.OS === "web") {
        window.open(videoInfo.downloadUrl, "_blank");
        setStatus("Opened in new tab!");
      } else {
        const filename = `tiktok_${videoInfo.id}.mp4`;
        const fileUri = FileSystem.documentDirectory + filename;

        const downloadRes = await FileSystem.downloadAsync(
          videoInfo.downloadUrl,
          fileUri,
        );

        if (downloadRes.status !== 200) {
          throw new Error("Failed to download video file");
        }

        setStatus("Done! Opening share dialog...");

        if (await Sharing.isAvailableAsync()) {
          await Sharing.shareAsync(fileUri);
        } else {
          Alert.alert("Success", "Video saved locally!");
        }
      }
    } catch (error) {
      console.error(error);
      Alert.alert("Error", `Failed: ${error.message}`);
      setStatus("Error");
    } finally {
      setLoading(false);
    }
  };

  const openLink = (link) => {
    Linking.openURL(link).catch((err) =>
      console.error("Couldn't load page", err),
    );
  };

  return (
    <ScrollView contentContainerStyle={styles.scrollContainer}>
      <View style={styles.container}>
        <View style={styles.mainContent}>
          <Text style={styles.title}>
            TikTok <Text style={styles.titleSpan}>Mobile</Text>
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

        {/* FOOTER */}
        <View style={styles.footer}>
          <Text style={styles.footerTitle}>TikTok Downloader Mobile</Text>
          <View style={styles.footerLinks}>
            <TouchableOpacity
              onPress={() => openLink("https://github.com/Josefnademo")}
            >
              <Text style={styles.linkText}>GitHub</Text>
            </TouchableOpacity>
          </View>
        </View>
      </View>
    </ScrollView>
  );
}

// STYLES
const styles = StyleSheet.create({
  scrollContainer: { flexGrow: 1, backgroundColor: "#121212" },
  container: {
    flex: 1,
    backgroundColor: "#121212",
    justifyContent: "space-between",
    alignItems: "center",
    padding: 20,
    minHeight: "100%",
  },
  mainContent: {
    width: "100%",
    alignItems: "center",
    justifyContent: "center",
    flex: 1,
  },
  title: {
    fontSize: 32,
    fontWeight: "bold",
    color: "#ffffff",
    marginBottom: 30,
    marginTop: 20,
  },
  titleSpan: { color: "#fe2c55" },
  card: {
    width: "100%",
    backgroundColor: "#1e1e1e",
    padding: 20,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: "#333",
    maxWidth: 500,
  },
  label: { color: "#a0a0a0", marginBottom: 10 },
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
  },
  buttonDisabled: { backgroundColor: "#444" },
  buttonText: { color: "#ffffff", fontWeight: "bold", fontSize: 16 },
  status: { marginTop: 15, color: "#25f4ee", textAlign: "center" },
  footer: {
    marginTop: 30,
    paddingTop: 20,
    paddingBottom: 20,
    width: "100%",
    borderTopWidth: 1,
    borderTopColor: "#333",
    alignItems: "center",
  },
  footerTitle: {
    color: "#fff",
    fontWeight: "600",
    fontSize: 14,
    marginBottom: 10,
  },
  footerLinks: { flexDirection: "row", alignItems: "center", gap: 10 },
  linkText: { color: "#25f4ee", fontSize: 13 },
});
