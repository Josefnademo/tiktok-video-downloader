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
} from "react-native";
import * as FileSystem from "expo-file-system";
import * as Sharing from "expo-sharing";

// CONFIGURATION

// If using USB Cable + adb reverse:
// const API_URL = "http://localhost:3000";

// If using Wi-Fi (Hotspot)Replace with your specific LAN IP Address:
const API_URL = "http://10.50.120.24:3000";
const API_TOKEN = "my_strong_token"; // Must match the token in server.js

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

        // Create a blob and force browser download
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
        // 1. Generate filename
        const filename = `tiktok_${Date.now()}.mp4`;
        const fileUri = FileSystem.documentDirectory + filename;

        // 2. Fetch the file data manually (since downloadAsync struggles with POST body)
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

        if (!response.ok) throw new Error("Mobile fetch failed");

        // 3. Convert Blob to Base64 to save it
        const blob = await response.blob();
        const reader = new FileReader();

        reader.readAsDataURL(blob);
        reader.onloadend = async () => {
          const base64data = reader.result.split(",")[1];

          // 4. Write file to system
          await FileSystem.writeAsStringAsync(fileUri, base64data, {
            encoding: "base64", // <--- FIXED: Use string directly
          });

          setStatus("Done! Opening share dialog...");

          // 5. Share
          if (await Sharing.isAvailableAsync()) {
            await Sharing.shareAsync(fileUri);
          } else {
            Alert.alert("Success", "Video saved to app cache");
          }
        };
      }
    } catch (error) {
      console.error(error);
      Alert.alert("Error", "Download failed. Check server connection.");
      setStatus("Error");
    } finally {
      setLoading(false);
    }
  };

  return (
    <View style={styles.container}>
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
  );
}

// STYLES
const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#121212",
    alignItems: "center",
    justifyContent: "center",
    padding: 20,
  },
  title: {
    fontSize: 32,
    fontWeight: "bold",
    color: "#ffffff",
    marginBottom: 30,
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
    maxWidth: 500, // Limit width on Web
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
    outlineStyle: "none", // Remove blue border on Web
  },
  button: {
    backgroundColor: "#fe2c55",
    padding: 15,
    borderRadius: 8,
    alignItems: "center",
    cursor: "pointer", // Show hand cursor on Web
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
});
