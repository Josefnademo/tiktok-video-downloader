import ffmpeg from "fluent-ffmpeg";
import ffmpegPath from "ffmpeg-static";
import path from "node:path";
import fs from "node:fs";

// Fix for Electron packaging: Ensures ffmpeg binary path is correct
const fixedFfmpegPath = ffmpegPath.replace("app.asar", "app.asar.unpacked");
ffmpeg.setFfmpegPath(fixedFfmpegPath);

export async function extractMp3(videoPath) {
  const outputName = path.basename(videoPath, path.extname(videoPath)) + ".mp3";
  const outputPath = path.join(path.dirname(videoPath), outputName);

  return new Promise((resolve, reject) => {
    ffmpeg(videoPath)
      .noVideo()
      .audioCodec("libmp3lame")
      .on("end", () => resolve(outputPath))
      .on("error", (err) => reject(err))
      .save(outputPath);
  });
}
