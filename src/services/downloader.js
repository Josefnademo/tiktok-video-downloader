import fs from "node:fs";
import path from "node:path";
import fetch from "node-fetch";
import { app } from "electron";
import { pipeline } from "node:stream/promises";

const DOWNLOAD_DIR = path.join(app.getPath("downloads"), "MediaDL");

export async function downloadFile({ url, filename }) {
  await fs.promises.mkdir(DOWNLOAD_DIR, { recursive: true });
  const finalPath = path.join(DOWNLOAD_DIR, filename); // Simplified for testing

  console.log(`[Downloader] Starting download from: ${url}`);

  const res = await fetch(url, {
    headers: {
      "User-Agent":
        "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36",
      Referer: "https://www.tiktok.com/",
    },
  });

  if (!res.ok) throw new Error(`HTTP Error ${res.status}`);

  const fileStream = fs.createWriteStream(finalPath);
  await pipeline(res.body, fileStream);

  return finalPath;
}
