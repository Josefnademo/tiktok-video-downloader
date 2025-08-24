# TikTok Downloader (Local, Cross-Platform)

> ⚠️ Disclaimer: This project is for **educational purposes only**.  
> It is not affiliated with or endorsed by TikTok. Downloading and redistributing videos without permission may violate TikTok's Terms of Service.

---

## Purpose

This app aims to **simplify the process of downloading TikTok content** directly to your device without relying on external servers.  
It works locally on **PC (Windows/Linux/macOS via Electron)** and **Android (via React Native)**.

### Key Features
- **Download TikTok videos** (local processing, quality options).
- **Extract audio (MP3)** from videos.
- **Save photo frames** from videos (or TikTok photo posts).
- **Select resolution / quality** (via HLS parsing).
- Works offline for processing (only internet needed for fetching files).
- **No external server** – all operations happen on the user’s device.

---

## 🛠️ Tech Stack

- **Electron (Desktop)** → Cross-platform desktop app using Node.js + Chromium.
- **React Native (Mobile)** → Android app for local downloading & processing.
- **Node.js** → Core logic, modules, file system access.
- **FFmpeg** → Media processing (audio extraction, frame extraction, format conversion).
- **m3u8-parser** → HLS playlist parsing for different quality streams.
- **node-fetch / react-native-fs** → Download files locally.

---

## Modules Overview

### `downloader.js`
Handles direct downloads:
- Saves video or photo post files locally.
- Supports resuming (Range headers).
- Ensures unique filenames.

### `hlsParser.js`
Parses `.m3u8` HLS playlists:
- Detects multiple quality variants.
- Lets users choose resolution/bitrate.
- Returns direct stream URLs.

### `audioExtractor.js`
Uses FFmpeg to:
- Extract audio track (`.mp3`) from video.
- Save in chosen folder.

### `frameExtractor.js`
Uses FFmpeg to:
- Split video into frames (`frame-%d.jpg`).
- Extract specific photos (from TikTok "photo mode" posts).

### `utils.js`
Helper functions:
- Path management.
- Filename generation.
- Logging and error handling.

---

## Installation
### 💻 Installation (Desktop)
    git clone https://github.com/YOURNAME/tiktok-downloader-app.git
    cd tiktok-downloader-app
    npm install
    npm start

### 📱 Installation (Android)
    git clone https://github.com/YOURNAME/tiktok-downloader-app.git
    cd tiktok-downloader-app/mobile
    npm install
    npm run android



