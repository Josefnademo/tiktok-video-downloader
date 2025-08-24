import { app, BrowserWindow, ipcMain, dialog } from "electron";
import path from "node:path";
import fs from "node:fs";
import fetch from "node-fetch";
import ffmpegPath from "ffmpeg-static";
import ffmpeg from "fluent-ffmpeg";
import { parseHls } from "./src/hls.js";
import { fileURLToPath } from "node:url";

ffmpeg.setFfmpegPath(ffmpegPath);

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

let win;
const downloadsDir = path.join(app.getPath("downloads"), "MediaDL");

async function createWindow() {
  win = new BrowserWindow({
    width: 980,
    height: 720,
    webPreferences: {
      preload: path.join(__dirname, "src", "preload.js"),
      contextIsolation: true,
      nodeIntegration: false,
    },
  });
  await win.loadFile("index.html");
}

app.whenReady().then(createWindow);

// Выбор папки
ipcMain.handle("choose-folder", async () => {
  const res = await dialog.showOpenDialog(win, {
    properties: ["openDirectory"],
  });
  return res.canceled ? null : res.filePaths[0];
});

// HLS варианты
ipcMain.handle("list-hls-variants", async (_evt, manifestUrl) => {
  return await parseHls(manifestUrl);
});

// Скачать файл (MP4/HLS/TikTok)
ipcMain.handle(
  "download-file",
  async (_evt, { url, outfile, onExists = "rename" }) => {
    await fs.promises.mkdir(downloadsDir, { recursive: true });

    // TikTok?
    if (url.includes("tiktok.com")) {
      url = await getTikTokVideoUrl(url);
    }

    const target = path.join(downloadsDir, outfile);
    const finalPath = await saveStream(url, target, onExists);
    return finalPath;
  }
);

// Извлечение MP3
ipcMain.handle("extract-audio-mp3", async (_evt, { videoPath, outName }) => {
  const outPath = path.join(
    path.dirname(videoPath),
    outName || path.basename(videoPath, path.extname(videoPath)) + ".mp3"
  );
  await new Promise((resolve, reject) => {
    ffmpeg(videoPath)
      .noVideo()
      .audioCodec("libmp3lame")
      .on("end", resolve)
      .on("error", reject)
      .save(outPath);
  });
  return outPath;
});

// Извлечение кадров
ipcMain.handle("extract-frames", async (_evt, { videoPath, fps = 1 }) => {
  const outDir = path.join(
    path.dirname(videoPath),
    path.basename(videoPath, path.extname(videoPath)) + "_frames"
  );
  await fs.promises.mkdir(outDir, { recursive: true });
  await new Promise((resolve, reject) => {
    ffmpeg(videoPath)
      .outputOptions([`-vf fps=${fps}`])
      .on("end", resolve)
      .on("error", reject)
      .save(path.join(outDir, "frame-%06d.jpg"));
  });
  return outDir;
});

// ==========================
// Вспомогательные функции
// ==========================
async function saveStream(url, target, onExists) {
  let dest = target;
  if (fs.existsSync(target)) {
    if (onExists === "skip") return target;
    if (onExists === "rename") {
      const { name, ext, dir } = split(target);
      let i = 1;
      while (
        fs.existsSync((dest = path.join(dir, `${name} (${i++})${ext}`)))
      ) {}
    }
  }

  const res = await fetch(url, { headers: { "User-Agent": "Mozilla/5.0" } });
  if (!res.ok) throw new Error(`HTTP ${res.status}`);

  await new Promise((resolve, reject) => {
    const file = fs.createWriteStream(dest);
    res.body.pipe(file);
    res.body.on("error", reject);
    file.on("finish", resolve);
  });
  return dest;
}

function split(p) {
  const ext = path.extname(p);
  const dir = path.dirname(p);
  const name = path.basename(p, ext);
  return { dir, name, ext };
}

// ==========================
// TikTok
// ==========================
async function getTikTokVideoUrl(pageUrl) {
  const res = await fetch(pageUrl, {
    headers: { "User-Agent": "Mozilla/5.0" },
  });
  if (!res.ok) throw new Error(`HTTP ${res.status}`);

  const html = await res.text();
  const match = html.match(
    /<script id="__NEXT_DATA__" type="application\/json">(.+?)<\/script>/
  );
  if (!match) throw new Error("TikTok JSON not found");

  const data = JSON.parse(match[1]);
  const videoUrl = data.props.pageProps.itemInfo.itemStruct.video.playAddr;
  if (!videoUrl) throw new Error("Video URL not found");

  return videoUrl;
}
