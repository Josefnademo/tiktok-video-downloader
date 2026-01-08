import { ipcMain } from "electron";
import { getVideoInfo } from "../services/tiktok.js";
import { downloadFile } from "../services/downloader.js";
import { extractMp3 } from "../services/ffmpeg.js";

export function setupHandlers() {
  // Handler 1: Download Video
  ipcMain.handle("download-video", async (event, url) => {
    console.log(`[IPC] Request received to download: ${url}`);

    try {
      // Step 1: Get Data
      console.log("[IPC] Step 1: Fetching video info...");
      const videoData = await getVideoInfo(url);
      console.log(`[IPC] Video found: ID ${videoData.id}`);

      // Step 2: Download
      const filename = `tiktok_${videoData.id}.mp4`;
      console.log(`[IPC] Step 2: Downloading to ${filename}...`);

      const filePath = await downloadFile({
        url: videoData.url,
        filename: filename,
      });

      console.log(`[IPC] Success! Saved to: ${filePath}`);
      return { success: true, path: filePath };
    } catch (error) {
      console.error("[IPC] ❌ ERROR:", error);
      // Return the error message to the frontend so you can see it
      return { success: false, error: error.message };
    }
  });

  // Handler 2: Convert to MP3
  ipcMain.handle("convert-mp3", async (event, videoPath) => {
    console.log(`[IPC] Request to convert: ${videoPath}`);
    try {
      const audioPath = await extractMp3(videoPath);
      return { success: true, path: audioPath };
    } catch (error) {
      console.error("[IPC] ❌ Convert Error:", error);
      return { success: false, error: error.message };
    }
  });
}
