import fs from "node:fs";
import path from "node:path";
import os from "node:os";
import fetch from "node-fetch";
import { pipeline } from "node:stream/promises";

// Get downloads folder - works in both Electron and Node.js contexts
function getDownloadsFolder() {
  try {
    // Try Electron first (if running in Electron context)
    const { app } = require("electron");
    return app.getPath("downloads");
  } catch (error) {
    // Fallback to Node.js (when running in PM2/server context)
    return path.join(os.homedir(), "Downloads");
  }
}

export async function downloadFile({ url, filename, folder }) {
  // Use custom folder OR default Downloads folder
  const targetDir = folder || path.join(getDownloadsFolder(), "MediaDL");

  await fs.promises.mkdir(targetDir, { recursive: true });

  const finalPath = path.join(targetDir, filename);

  const res = await fetch(url);
  if (!res.ok) throw new Error(`HTTP Error ${res.status}`);

  const fileStream = fs.createWriteStream(finalPath);
  await pipeline(res.body, fileStream);

  return finalPath;
}
