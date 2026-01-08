/*import { contextBridge, ipcRenderer } from "electron";

contextBridge.exposeInMainWorld("api", {
  chooseFolder: () => ipcRenderer.invoke("choose-folder"),
  listHlsVariants: (url) => ipcRenderer.invoke("list-hls-variants", url),
  downloadFile: (opts) => ipcRenderer.invoke("download-file", opts),
  extractAudioMp3: (opts) => ipcRenderer.invoke("extract-audio-mp3", opts),
  extractFrames: (opts) => ipcRenderer.invoke("extract-frames", opts),
});
*/

const { contextBridge, ipcRenderer } = require("electron");

contextBridge.exposeInMainWorld("api", {
  // Request main process to download
  downloadVideo: (url) => ipcRenderer.invoke("download-video", url),

  // Request main process to convert to mp3
  convertToMp3: (videoPath) => ipcRenderer.invoke("convert-mp3", videoPath),
});
