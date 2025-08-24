import { contextBridge, ipcRenderer } from "electron";

contextBridge.exposeInMainWorld("api", {
  chooseFolder: () => ipcRenderer.invoke("choose-folder"),
  listHlsVariants: (url) => ipcRenderer.invoke("list-hls-variants", url),
  downloadFile: (opts) => ipcRenderer.invoke("download-file", opts),
  extractAudioMp3: (opts) => ipcRenderer.invoke("extract-audio-mp3", opts),
  extractFrames: (opts) => ipcRenderer.invoke("extract-frames", opts),
});
