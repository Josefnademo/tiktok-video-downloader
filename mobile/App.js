import { StatusBar } from "expo-status-bar";
import { useState } from "react";
import {
  StyleSheet,
  Text,
  View,
  TextInput,
  TouchableOpacity,
  ActivityIndicator,
  Alert,
} from "react-native";
import * as FileSystem from "expo-file-system";
import * as Sharing from "expo-sharing";

// CONFIGURATION
// Replace with your specific LAN IP Address
const API_URL = "http://10.50.120.24:3000";
const API_TOKEN = "my_strong_token"; // Must match the token in server.js

export default function App() {
  const [url, setUrl] = useState("");
  const [loading, setLoading] = useState(false);
  const [status, setStatus] = useState("");

  const downloadVideo = async () => {
    // Validation: Check if URL is empty
    if (!url) {
      Alert.alert("Error", "Please paste a TikTok URL");
      return;
    }

    setLoading(true);
    setStatus("Processing on server...");

    try {
      // 1. Generate a unique filename for the mobile device
      const filename = `tiktok_${Date.now()}.mp4`;
      const fileUri = FileSystem.documentDirectory + filename;

      // 2. Download the file from YOUR PC server
      // We hit the /api/download endpoint defined in server.js
      const downloadRes = await FileSystem.downloadAsync(
        `${API_URL}/api/download`,
        fileUri,
        {
          headers: {
            "Content-Type": "application/json",
            "x-api-token": API_TOKEN,
          },
          httpMethod: "POST",
          uploadType: FileSystem.FileSystemUploadType.BINARY_CONTENT,
          // Sending the request body as a string
          body: JSON.stringify({
            url: url,
            qualityIndex: 0,
            customFolder: null, // Mobile doesn't use custom paths like Windows
          }),
        },
      );

      // Check if server returned 200 OK
      if (downloadRes.status !== 200) {
        throw new Error("Download failed from server");
      }

      setStatus("Done! Opening share dialog...");

      // 3. Open the OS Share Sheet (Save to Gallery / Send to WhatsApp etc.)
      if (await Sharing.isAvailableAsync()) {
        await Sharing.shareAsync(downloadRes.uri);
      } else {
        Alert.alert("Success", "Video saved to app cache");
      }
    } catch (error) {
      console.error(error);
      Alert.alert(
        "Connection Error",
        "Could not reach server. Check if PC and Phone are on the same WiFi.",
      );
      setStatus("Error");
    } finally {
      setLoading(false);
    }
  };

  return (
    <View style={styles.container}>
      <StatusBar style="light" />

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

// STYLES (Based on your dark theme: #121212)
const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#121212", // --bg
    alignItems: "center",
    justifyContent: "center",
    padding: 20,
  },
  title: {
    fontSize: 32,
    fontWeight: "bold",
    color: "#ffffff", // --text
    marginBottom: 30,
  },
  titleSpan: {
    color: "#fe2c55", // --primary (TikTok Red)
  },
  card: {
    width: "100%",
    backgroundColor: "#1e1e1e", // --card
    padding: 20,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: "#333",
  },
  label: {
    color: "#a0a0a0", // --text-gray
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
  },
  button: {
    backgroundColor: "#fe2c55", // --primary
    padding: 15,
    borderRadius: 8,
    alignItems: "center",
  },
  buttonDisabled: {
    backgroundColor: "#444",
  },
  buttonText: {
    color: "#ffffff",
    fontWeight: "bold",
    fontSize: 16,
  },
  status: {
    marginTop: 15,
    color: "#25f4ee", // --cyan
    textAlign: "center",
  },
});
