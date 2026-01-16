# TikTok Downloader (Local, Cross-Platform)

> ⚠️ Disclaimer: This project is for **educational purposes only**.  
> It is not affiliated with or endorsed by TikTok. Downloading and redistributing videos without permission may violate TikTok's Terms of Service.

---

## Purpose

This app aims to **simplify the process of downloading TikTok content** directly to your device without relying on external servers.  
It works locally on **PC (Windows/Linux/macOS via Electron)** and **Android (via React Native)** [WIP].

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

---

## Deployment

### Local Development (PM2)

Run the backend server locally with PM2 process manager:

```bash
# Install PM2 globally
npm install -g pm2

# Start server with ecosystem config
pm2 start ecosystem.config.cjs

# View logs
pm2 logs ttd-backend

# Stop/restart
pm2 restart ttd-backend
pm2 stop all
```

**Features:**

- Auto-restart on crashes
- Process monitoring
- Zero-downtime reloads
- Cluster mode (uses all CPU cores)

### Architecture

```
┌──────────────────────────────────────┐
│   Electron Desktop App                │
│   (npm start)                         │
│   ├─ Main window                      │
│   └─ IPC handlers → services          │
└─────────────┬──────────────────────────┘
              │
         Uses locally
              │
┌──────────────┴──────────────────────────┐
│   Backend Server (server.js)             │
│   ├─ Runs on localhost:3000 (local)     │
│   ├─ Runs on Railway (cloud)            │
│   └─ Services:                          │
│       ├─ tiktok.js (video info)         │
│       ├─ downloader.js (file transfer)  │
│       └─ ffmpeg.js (MP3 conversion)     │
└──────────────────────────────────────────┘
```

---

## License

This project is licensed under the **Creative Commons Attribution-NonCommercial 4.0 International (CC BY-NC 4.0)**.
**Commercial use of this software is strictly prohibited.**
