// server.js (ES Module)
import express from "express";
import Bottleneck from "bottleneck";
import bodyParser from "body-parser";
import dotenv from "dotenv";
import { getVideoInfo } from "./src/services/tiktok.js";
import { downloadFile } from "./src/services/downloader.js";
import { extractMp3 } from "./src/services/ffmpeg.js";

dotenv.config();
const app = express();
app.use(bodyParser.json());

// Serve static frontend from ./public
app.use(express.static("public"));

// Health check
app.get("/health", (req, res) => res.send("ok"));

// API token validation
const API_TOKEN = process.env.API_TOKEN;

// Rate limiter: ~1 req/sec, max 2 concurrent
const limiter = new Bottleneck({
  minTime: 1000,
  maxConcurrent: 2,
});

// State to prevent spamming the same video
let lastDownloadedId = null;

// ========== API ENDPOINTS ==========

// Get video info endpoint
app.post("/api/video-info", async (req, res) => {
  const token = req.headers["x-api-token"];
  if (token !== API_TOKEN)
    return res.status(401).json({ error: "Unauthorized" });

  const { url } = req.body;
  if (!url) return res.status(400).json({ error: "Missing URL" });

  try {
    const videoInfo = await getVideoInfo(url);
    res.json(videoInfo);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Download video endpoint (same logic as Electron handlers)
app.post("/api/download", async (req, res) => {
  const token = req.headers["x-api-token"];
  if (token !== API_TOKEN)
    return res.status(401).json({ error: "Unauthorized" });

  const { url, qualityIndex, customFolder } = req.body;
  if (!url) return res.status(400).json({ error: "Missing URL" });

  try {
    console.log(`[API] Processing: ${url}`);

    // 1. Get video info
    const videoData = await getVideoInfo(url);

    // 2. Anti-Spam Check
    if (lastDownloadedId === videoData.id) {
      throw new Error(
        "You just downloaded this video! Please download a different one first to avoid API bans."
      );
    }

    // 3. Select Quality
    const selectedQuality =
      videoData.qualities[qualityIndex || 0] || videoData.qualities[0];
    console.log(`[API] Quality: ${selectedQuality.label}`);

    // 4. Download video file directly (stream to client)
    const filename = `tiktok_${videoData.id}_${selectedQuality.id}.mp4`;

    // Fetch the video from TikTok URL
    const fetch_module = (await import("node-fetch")).default;
    const videoResponse = await fetch_module(selectedQuality.url);

    if (!videoResponse.ok) {
      throw new Error(`Failed to fetch video: ${videoResponse.statusText}`);
    }

    // Set response headers for file download
    res.setHeader("Content-Type", "video/mp4");
    res.setHeader("Content-Disposition", `attachment; filename="${filename}"`);

    // Stream the video directly to the client
    await new Promise((resolve, reject) => {
      videoResponse.body.pipe(res);
      videoResponse.body.on("error", reject);
      res.on("finish", resolve);
      res.on("error", reject);
    });

    // Update last ID only on success
    lastDownloadedId = videoData.id;

    console.log(`[API] Video streamed successfully: ${filename}`);
  } catch (error) {
    console.error("[API] Error:", error.message);
    res.status(500).json({ success: false, error: error.message });
  }
});

// Convert to MP3 endpoint
app.post("/api/convert-mp3", async (req, res) => {
  const token = req.headers["x-api-token"];
  if (token !== API_TOKEN)
    return res.status(401).json({ error: "Unauthorized" });

  const { videoPath } = req.body;
  if (!videoPath) return res.status(400).json({ error: "Missing videoPath" });

  try {
    const audioPath = await extractMp3(videoPath);
    res.json({ success: true, path: audioPath });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});

const PORT = process.env.PORT ?? 3000;
app.listen(PORT, () => console.log("Server listening on", PORT));
