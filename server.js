// server.js (ES Module)
import express from "express";
import Bottleneck from "bottleneck";
import bodyParser from "body-parser";
import dotenv from "dotenv";
import { getVideoInfo } from "./src/services/tiktok.js";
import { downloadFile } from "./src/services/downloader.js";

dotenv.config();
const app = express();
app.use(bodyParser.json());

// Serve static frontend from ./public (place index.html + assets there)
app.use(express.static("public"));

// Simple health check
app.get("/health", (req, res) => res.send("ok"));

// Simple protection: API token (set via env API_TOKEN)
const API_TOKEN = process.env.API_TOKEN;

// rate limiter: ~1 req/sec, max 2 concurrent
const limiter = new Bottleneck({
  minTime: 1000,
  maxConcurrent: 2,
});

async function downloadJob(url, options) {
  try {
    // Get video info from TikTok
    const videoInfo = await getVideoInfo(url);

    // Get the quality requested (default to first quality available)
    const quality = options.quality || videoInfo.qualities[0].id;
    const selectedQuality =
      videoInfo.qualities.find((q) => q.id === quality) ||
      videoInfo.qualities[0];

    // Download the video file
    const filename = `${videoInfo.title || "tiktok-video"}.mp4`;
    const filePath = await downloadFile({
      url: selectedQuality.url,
      filename: filename,
      folder: null, // Uses default Downloads folder
    });

    return {
      success: true,
      title: videoInfo.title,
      path: filePath,
      quality: selectedQuality.label,
      author: videoInfo.author,
    };
  } catch (error) {
    throw new Error(`Download failed: ${error.message}`);
  }
}

app.post("/api/download", async (req, res) => {
  const token = req.headers["x-api-token"];
  if (token !== API_TOKEN)
    return res.status(401).json({ error: "Unauthorized" });

  const { url, quality } = req.body;
  if (!url) return res.status(400).json({ error: "missing url" });

  try {
    const result = await limiter.schedule(() => downloadJob(url, { quality }));
    res.json(result);
  } catch (e) {
    res.status(500).json({ error: e.message });
  }
});

app.post("/api/", async (req, res) => {});

const PORT = process.env.PORT ?? 3000;
app.listen(PORT, () => console.log("Server listening on", PORT));
