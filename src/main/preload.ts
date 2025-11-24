import { contextBridge, ipcRenderer } from "electron";

contextBridge.exposeInMainWorld("electronAPI", {
  // Auth
  openLoginWindow: (authUrl: string) =>
    ipcRenderer.invoke("auth:open-login-window", authUrl),
  saveToken: (key: string, value: string) =>
    ipcRenderer.invoke("keychain:save", key, value),
  getToken: (key: string) => ipcRenderer.invoke("keychain:get", key),

  // Logging
  log: (message: string) => ipcRenderer.invoke("log", message),
});

declare global {
  interface Window {
    electronAPI: {
      openLoginWindow: (authUrl: string) => Promise<string | null>;
      saveToken: (key: string, value: string) => Promise<void>;
      getToken: (key: string) => Promise<string | null>;
      log: (message: string) => Promise<void>;
    };
  }
}

export {};
