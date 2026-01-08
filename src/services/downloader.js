import fs from "node:fs";
import path from "node:path";
import fetch from "node-fetch";
import { app } from "electron";
import { pipeline } from "node:stream/promises";

export async function downloadFile({ url, filename, folder }) {
  // Use custom folder OR default "Downloads/MediaDL"
  const targetDir = folder || path.join(app.getPath("downloads"), "MediaDL");

  await fs.promises.mkdir(targetDir, { recursive: true });

  const finalPath = path.join(targetDir, filename);

  const res = await fetch(url);
  if (!res.ok) throw new Error(`HTTP Error ${res.status}`);

  const fileStream = fs.createWriteStream(finalPath);
  await pipeline(res.body, fileStream);

  return finalPath;
}
