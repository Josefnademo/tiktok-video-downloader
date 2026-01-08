import { app, BrowserWindow } from "electron";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { setupHandlers } from "./src/handlers/ipcHandlers.js";

const __dirname = path.dirname(fileURLToPath(import.meta.url));

let mainWindow;

function createWindow() {
  mainWindow = new BrowserWindow({
    width: 1000,
    height: 800,
    webPreferences: {
      preload: path.join(__dirname, "src", "preload.cjs"),
      contextIsolation: true,
      nodeIntegration: false,
    },
  });

  mainWindow.loadFile("index.html");

  // OPTIONAL: Open DevTools automatically to see frontend logs
  mainWindow.webContents.openDevTools();
}

app.whenReady().then(() => {
  createWindow();
  setupHandlers(); // Register IPC events
  console.log("✅ App started. Ready to process requests.");
});

app.on("window-all-closed", () => {
  if (process.platform !== "darwin") app.quit();
});
