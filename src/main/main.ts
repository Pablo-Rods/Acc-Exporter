import { app, BrowserWindow, ipcMain } from "electron";
import * as keytar from "keytar";
import * as path from "path";
import isDev from "electron-is-dev";
import { CallbackServer } from "./callbackServer";

let mainWindow: BrowserWindow | null = null;
let authWindow: BrowserWindow | null = null;
let callbackServer: CallbackServer | null = null;

const createWindow = () => {
  mainWindow = new BrowserWindow({
    width: 1200,
    height: 800,
    webPreferences: {
      preload: path.join(__dirname, "preload.js"),
      contextIsolation: true,
      nodeIntegration: false,
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

ipcMain.handle("auth:open-login-window", async (event, authUrl: string) => {
  console.log("=== AUTH WINDOW HANDLER CALLED ===");
  console.log("Auth URL:", authUrl);

  return new Promise<string | null>((resolve) => {
    // Iniciar servidor de callback
    callbackServer = new CallbackServer(3001);
    callbackServer
      .start((code) => {
        console.log("Code received from callback server:", code);
        if (code) {
          if (authWindow && !authWindow.isDestroyed()) {
            authWindow.close();
          }
          resolve(code);
        }
      })
      .then(() => {
        // Crear ventana de auth después de que el servidor esté listo
        authWindow = new BrowserWindow({
          width: 600,
          height: 700,
          parent: mainWindow ?? undefined,
          modal: true,
          webPreferences: {
            nodeIntegration: false,
            contextIsolation: true,
            sandbox: true,
          },
        });

        authWindow.loadURL(authUrl);

        if (isDev) {
          authWindow.webContents.openDevTools();
        }

        // Timeout después de 10 minutos
        const timeout = setTimeout(() => {
          console.log("=== TIMEOUT REACHED ===");
          if (authWindow && !authWindow.isDestroyed()) {
            authWindow.close();
          }
          authWindow = null;
          if (callbackServer) {
            callbackServer.stop();
            callbackServer = null;
          }
          resolve(null);
        }, 600000);

        // Si el usuario cierra la ventana manualmente
        if (authWindow) {
          authWindow.on("closed", () => {
            clearTimeout(timeout);
            authWindow = null;
            if (callbackServer) {
              callbackServer.stop();
              callbackServer = null;
            }
          });
        }
      });
  });
});

ipcMain.handle("log", async (event, message) => {
  console.log(`[RENDERER]: ${message}`);
});
