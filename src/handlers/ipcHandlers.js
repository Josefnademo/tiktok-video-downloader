import { ipcMain, dialog, shell } from "electron";
import { getVideoInfo } from "../services/tiktok.js";
import { downloadFile } from "../services/downloader.js";
import { extractMp3 } from "../services/ffmpeg.js";

// State to prevent spamming the same video
let lastDownloadedId = null;

export function setupHandlers() {
  // --- Handler: Select Folder ---
  ipcMain.handle("select-folder", async () => {
    const result = await dialog.showOpenDialog({
      properties: ["openDirectory"],
    });
    return result.canceled ? null : result.filePaths[0];
  });

  // --- Handler: Open File Location ---
  ipcMain.handle("open-folder", async (event, filePath) => {
    shell.showItemInFolder(filePath);
  });

  // --- Handler: Download Video ---
  ipcMain.handle(
    "download-video",
    async (event, { url, qualityIndex, customFolder }) => {
      try {
        console.log(`[IPC] Processing: ${url}`);

        // 1. Get Info
        const videoData = await getVideoInfo(url);

        // 2. Anti-Spam Check
        // If user tries to download the EXACT same video immediately, block it.
        // This prevents accidental double-clicks and "Too Many Requests" loops.
        if (lastDownloadedId === videoData.id) {
          throw new Error(
            "You just downloaded this video! Please download a different one first to avoid API bans."
          );
        }

        // 3. Select Quality
        // Default to 0 (Best/HD) if not specified
        const selectedQuality =
          videoData.qualities[qualityIndex] || videoData.qualities[0];
        console.log(`[IPC] Quality: ${selectedQuality.label}`);

        // 4. Download
        const filename = `tiktok_${videoData.id}_${selectedQuality.id}.mp4`;

        const savedPath = await downloadFile({
          url: selectedQuality.url,
          filename: filename,
          folder: customFolder, // Pass the custom folder if selected
        });

        // Update last ID only on success
        lastDownloadedId = videoData.id;

        return { success: true, path: savedPath, title: videoData.desc };
      } catch (error) {
        console.error("[IPC] Error:", error.message);
        return { success: false, error: error.message };
      }
    }
  );

  // --- Handler: MP3 ---
  ipcMain.handle("convert-mp3", async (event, videoPath) => {
    try {
      const audioPath = await extractMp3(videoPath);
      return { success: true, path: audioPath };
    } catch (error) {
      return { success: false, error: error.message };
    }
  });
}
