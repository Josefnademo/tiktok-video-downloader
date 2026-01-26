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

          // Теперь это будет работать благодаря импорту 'expo-file-system/legacy'
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
});
