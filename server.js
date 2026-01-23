import express from "express";
import cors from "cors";
import Bottleneck from "bottleneck";
import bodyParser from "body-parser";
import dotenv from "dotenv";
import { getVideoInfo } from "./src/services/tiktok.js";
import { extractMp3 } from "./src/services/ffmpeg.js";

dotenv.config();

// 1. INIT & SECURITY
const app = express();
app.use(cors()); // Enable CORS for access from Phone/USB
app.use(bodyParser.json());
app.use(express.static("public"));

const API_TOKEN = process.env.API_TOKEN || "my_strong_token";

// 2. RATE LIMITER (Smart Queue)
// Bottleneck is better than a simple pause. It queues requests,
// preventing TikTok from banning the server for too many API calls.
const limiter = new Bottleneck({
  minTime: 2000, // Minimum 2 seconds between requests to TikTok API
  maxConcurrent: 1, // Process only 1 request at a time (for safety)
});

// 3. ANTI-SPAM STATE
let lastDownloadedId = null;

// --- MIDDLEWARE: PROXY VALIDATOR ---
const authenticate = (req, res, next) => {
  const token = req.headers["x-api-token"];
  if (token !== API_TOKEN) {
    return res.status(401).json({ error: "Unauthorized: Invalid Token" });
  }
  next();
};

// ==================================================================
// API ENDPOINTS
// ==================================================================

// [GET] Health Check
app.get("/health", (req, res) => res.send("Server is running & healthy"));

// [POST] Get Video Info (Without downloading)
// Useful if you want to show a video preview on the phone first
app.post("/api/video-info", authenticate, async (req, res) => {
  const { url } = req.body;
  if (!url) return res.status(400).json({ error: "Missing URL" });

  try {
    // Use Limiter to avoid getting 429 when fetching info
    const videoInfo = await limiter.schedule(() => getVideoInfo(url));
    res.json(videoInfo);
  } catch (error) {
    console.error("[Info Error]", error.message);
    res.status(500).json({ error: error.message });
  }
});

// [POST] Download Video (Main Function)
app.post("/api/download", authenticate, async (req, res) => {
  const { url } = req.body;
  if (!url) return res.status(400).json({ error: "Missing URL" });

  try {
    console.log(`[API] Processing Request: ${url}`);

    // STEP 1: Get direct link (via Rate Limiter)
    const videoData = await limiter.schedule(() => getVideoInfo(url));

    // STEP 2: Duplicate Check (Anti-Spam)
    // If user tries to download the exact same video twice in a row
    if (lastDownloadedId === videoData.id) {
      console.warn(`[Anti-Spam] Blocked duplicate: ${videoData.id}`);
      return res.status(400).json({
        error:
          "You just downloaded this video. Please wait or download a different one.",
        isSpam: true,
      });
    }

    // STEP 3: Stream video to client
    // We don't download the file to the server disk; we pipe it directly to the phone.
    const filename = `tiktok_${videoData.id}.mp4`;

    // Dynamic import of node-fetch (since it is an ESM module)
    const fetch_module = (await import("node-fetch")).default;

    // Use videoData.url which we got from the updated tiktok.js
    const videoResponse = await fetch_module(videoData.url);

    if (!videoResponse.ok) {
      throw new Error(
        `Failed to fetch video stream: ${videoResponse.statusText}`
      );
    }

    // Set headers so the phone understands this is a file
    res.setHeader("Content-Type", "video/mp4");
    res.setHeader("Content-Disposition", `attachment; filename="${filename}"`);

    // Pipe the data stream (TikTok -> Server -> Phone)
    videoResponse.body.pipe(res);

    // Update ID only after streaming starts successfully
    lastDownloadedId = videoData.id;
    console.log(`[API] Streaming started for: ${videoData.id}`);
  } catch (error) {
    console.error("[Download Error]:", error.message);
    // If headers haven't been sent yet, send JSON error
    if (!res.headersSent) {
      res.status(500).json({ success: false, error: error.message });
    }
  }
});

// [POST] Convert to MP3 (Restored function)
// Note: This only works if the file exists locally.
// For the mobile version, this is difficult as the file is streamed to the phone.
// But I am keeping this for the Electron version.
app.post("/api/convert-mp3", authenticate, async (req, res) => {
  const { videoPath } = req.body;
  if (!videoPath) return res.status(400).json({ error: "Missing videoPath" });

  try {
    const audioPath = await extractMp3(videoPath);
    res.json({ success: true, path: audioPath });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});

// START SERVER
const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
  console.log(`✅ Server running on port ${PORT}`);
  console.log(`✅ Mode: Independent (Direct TikTok API)`);
  console.log(`✅ Rate Limiter: Active (2s delay)`);
});
