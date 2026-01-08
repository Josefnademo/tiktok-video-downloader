import fs from "node:fs";
import path from "node:path";
import fetch from "node-fetch";
import { app } from "electron";
import { pipeline } from "node:stream/promises";

// Saves files to Downloads/MediaDL folder
const DOWNLOAD_DIR = path.join(app.getPath("downloads"), "MediaDL");

export async function downloadFile({ url, filename }) {
  // Ensure folder exists
  await fs.promises.mkdir(DOWNLOAD_DIR, { recursive: true });

  const finalPath = path.join(DOWNLOAD_DIR, filename);
  console.log(`[Downloader] Starting download to: ${finalPath}`);

  // Fetch the file stream
  const res = await fetch(url);
  if (!res.ok) throw new Error(`Download HTTP Error: ${res.status}`);

  // Pipe data to file
  const fileStream = fs.createWriteStream(finalPath);
  await pipeline(res.body, fileStream);

  return finalPath;
}
