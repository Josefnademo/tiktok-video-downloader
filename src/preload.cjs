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
  downloadVideo: (opts) => ipcRenderer.invoke("download-video", opts),
  convertToMp3: (path) => ipcRenderer.invoke("convert-mp3", path),
  selectFolder: () => ipcRenderer.invoke("select-folder"), // New: Choose folder
  openFolder: (path) => ipcRenderer.invoke("open-folder", path), // New: Open after download
});
