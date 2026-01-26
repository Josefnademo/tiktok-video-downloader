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
app.use(cors());
app.use(bodyParser.json());
app.use(express.static("public"));

const API_TOKEN = process.env.API_TOKEN || "my_strong_token";

// 2. RATE LIMITER
const limiter = new Bottleneck({
  minTime: 2000,
  maxConcurrent: 1,
});

let lastDownloadedId = null;

// --- MIDDLEWARE ---
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

app.get("/health", (req, res) => res.send("Server is running & healthy"));

app.post("/api/video-info", authenticate, async (req, res) => {
  const { url } = req.body;
  if (!url) return res.status(400).json({ error: "Missing URL" });

  try {
    const videoInfo = await limiter.schedule(() => getVideoInfo(url));
    res.json(videoInfo);
  } catch (error) {
    console.error("[Info Error]", error.message);
    res.status(500).json({ error: error.message });
  }
});

app.post("/api/download", authenticate, async (req, res) => {
  const { url } = req.body;
  if (!url) return res.status(400).json({ error: "Missing URL" });

  try {
    console.log(`[API] Processing Request: ${url}`);

    // get link for video
    const videoData = await limiter.schedule(() => getVideoInfo(url));

    // dublicate download check
    if (lastDownloadedId === videoData.id) {
      console.warn(`[Anti-Spam] Blocked duplicate: ${videoData.id}`);
      return res.status(400).json({
        error: "Wait a moment before downloading the same video.",
        isSpam: true,
      });
    }

    //streaming with headers
    const filename = `tiktok_${videoData.id}.mp4`;
    const fetch_module = (await import("node-fetch")).default;

    console.log(`[API] Fetching stream from: ${videoData.url}`);

    // added headers to avoid 500 error
    const videoResponse = await fetch_module(videoData.url, {
      headers: {
        "User-Agent":
          "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36",
        Referer: "https://www.tiktok.com/",
      },
    });

    if (!videoResponse.ok) {
      throw new Error(
        `Stream Error: ${videoResponse.status} ${videoResponse.statusText}`,
      );
    }

    res.setHeader("Content-Type", "video/mp4");
    res.setHeader("Content-Disposition", `attachment; filename="${filename}"`);

    videoResponse.body.pipe(res);

    lastDownloadedId = videoData.id;
    console.log(`[API] Streaming started for: ${videoData.id}`);
  } catch (error) {
    console.error("[Download Error]:", error.message);
    if (!res.headersSent) {
      res.status(500).json({ success: false, error: error.message });
    }
  }
});

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

const PORT = process.env.PORT || 3000;
app.listen(PORT, "0.0.0.0", () => {
  //listening on all IPs
  console.log(`✅ Server running on port ${PORT}`);
});
