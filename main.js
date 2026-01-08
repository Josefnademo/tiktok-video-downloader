import { app, BrowserWindow } from "electron";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { setupHandlers } from "./src/handlers/ipcHandlers.js"; // Import handlers

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

  mainWindow.setMinimumSize(900, 1000);
  mainWindow.setMaximumSize(1920, 1080);
  // OPTIONAL: Open DevTools automatically to see frontend logs
  mainWindow.webContents.openDevTools();
}

app.whenReady().then(() => {
  createWindow();
  setupHandlers(); // Initialize the IPC handlers here
  console.log("✅ App started. Main process logs will appear here.");
});

app.on("window-all-closed", () => {
  if (process.platform !== "darwin") app.quit();
});
