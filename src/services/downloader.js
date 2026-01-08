// src/services/downloader.js
import fs from "node:fs";
import path from "node:path";
import fetch from "node-fetch";
import { app } from "electron";

const DOWNLOAD_DIR = path.join(app.getPath("downloads"), "MediaDL");

export async function downloadFile({ url, filename, headers = {} }) {
  await fs.promises.mkdir(DOWNLOAD_DIR, { recursive: true });

  // Важно: TikTok требует Referer при скачивании
  const fetchHeaders = {
    "User-Agent":
      "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36",
    Referer: "https://www.tiktok.com/",
    ...headers,
  };

  const res = await fetch(url, { headers: fetchHeaders });
  if (!res.ok) throw new Error(`Ошибка при скачивании: ${res.status}`);

  // Формируем уникальное имя, чтобы не перезатереть файлы
  const finalPath = getUniquePath(DOWNLOAD_DIR, filename);
  const fileStream = fs.createWriteStream(finalPath);

  return new Promise((resolve, reject) => {
    res.body.pipe(fileStream);
    res.body.on("error", reject);
    fileStream.on("finish", () => resolve(finalPath));
  });
}

function getUniquePath(dir, filename) {
  let name = path.parse(filename).name;
  let ext = path.parse(filename).ext || ".mp4";
  let counter = 1;
  let attempt = path.join(dir, filename);

  while (fs.existsSync(attempt)) {
    attempt = path.join(dir, `${name} (${counter})${ext}`);
    counter++;
  }
  return attempt;
}
