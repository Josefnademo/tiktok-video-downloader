import { ipcMain } from "electron";
import { getVideoInfo } from "../services/tiktok.js";
import { downloadFile } from "../services/downloader.js";
import { extractMp3 } from "../services/ffmpeg.js";

export function setupHandlers() {
  // Handler 1: Download
  ipcMain.handle("download-video", async (event, url) => {
    console.log(`[IPC] Received download request: ${url}`);

    try {
      // Step 1: Get Video Info (via Resolver API)
      const videoData = await getVideoInfo(url);

      // Step 2: Download the file
      const filename = `tiktok_${videoData.id}.mp4`;
      const filePath = await downloadFile({
        url: videoData.url,
        filename: filename,
      });

      console.log(`[IPC] Download complete: ${filePath}`);
      return { success: true, path: filePath };
    } catch (error) {
      console.error("[IPC] Error:", error.message);
      return { success: false, error: error.message };
    }
  });

  // Handler 2: MP3
  ipcMain.handle("convert-mp3", async (event, videoPath) => {
    try {
      const audioPath = await extractMp3(videoPath);
      return { success: true, path: audioPath };
    } catch (error) {
      return { success: false, error: error.message };
    }
  });
}
