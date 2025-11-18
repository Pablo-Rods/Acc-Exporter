import { app, BrowserWindow, ipcMain } from "electron";
import * as keytar from "keytar";
import * as path from "path";
import isDev from "electron-is-dev";

let mainWindow: BrowserWindow | null = null;

const createWindow = () => {
  mainWindow = new BrowserWindow({
    width: 1200,
    height: 800,
    webPreferences: {
      preload: path.join(__dirname, "preload.js"),
      contextIsolation: true,
      nodeIntegration: false,
      // enableRemoteModule: false,
      sandbox: true,
    },
  });

  const startUrl = isDev
    ? "http://localhost:3000"
    : `file://${path.join(__dirname, "../renderer/index.html")}`;

  mainWindow.loadURL(startUrl);

  if (isDev) {
    mainWindow.webContents.openDevTools();
  }

  mainWindow.on("closed", () => {
    mainWindow = null;
  });
};

app.on("ready", createWindow);

app.on("window-all-closed", () => {
  if (process.platform !== "darwin") {
    app.quit();
  }
});

app.on("activate", () => {
  if (mainWindow === null) {
    createWindow();
  }
});

// IPC Handlers
ipcMain.handle("keychain:save", async (event, key, value) => {
  try {
    await keytar.setPassword("acc-exporter", key, value);
    return { success: true };
  } catch (error) {
    console.error("Error saving to keychain:", error);
    return { success: false, error };
  }
});

ipcMain.handle("keychain:get", async (event, key) => {
  try {
    const password = await keytar.getPassword("acc-exporter", key);
    return password;
  } catch (error) {
    console.error("Error reading from keychain:", error);
    return null;
  }
});

ipcMain.handle("auth:open-login-window", async () => {
  const authWindow = new BrowserWindow({
    width: 600,
    height: 700,
    parent: mainWindow || undefined,
    modal: true,
    webPreferences: {
      nodeIntegration: false,
      contextIsolation: true,
      sandbox: true,
    },
  });

  authWindow.loadURL("http://localhost:5188/api/Auth/start");

  return new Promise((resolve) => {
    authWindow.webContents.on("will-redirect", (event, url) => {
      if (url.includes("callback")) {
        const urlObj = new URL(url);
        const code = urlObj.searchParams.get("code");
        authWindow.close();
        resolve(code);
      }
    });
  });
});

ipcMain.handle("log", async (event, message) => {
  console.log(`[RENDERER]: ${message}`);
});
