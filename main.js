import { app, BrowserWindow } from "electron";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { setupHandlers } from "./src/handlers/ipcHandlers.js";
// IMPORT THE SERVER SO IT STARTS WITH THE APPLICATION
import "./server.js";

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

    autoHideMenuBar: true,
  });

  mainWindow.loadFile("public/index.html");

  // Uncomment this line if you want to see errors (console on the right)
  // mainWindow.webContents.openDevTools();
}

app.whenReady().then(() => {
  setupHandlers();
  createWindow();
  console.log("✅ App started with internal server.");
});

app.on("window-all-closed", () => {
  if (process.platform !== "darwin") app.quit();
});
