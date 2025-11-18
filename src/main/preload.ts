import { contextBridge, ipcRenderer } from "electron";

contextBridge.exposeInMainWorld("electronAPI", {
  // Auth
  openLoginWindow: () => ipcRenderer.invoke("auth:open-login-window"),
  saveToken: (key: string, value: string) =>
    ipcRenderer.invoke("keychain:save", key, value),
  getToken: (key: string) => ipcRenderer.invoke("keychain:get", key),

  // Logging
  log: (message: string) => ipcRenderer.invoke("log", message),
});

declare global {
  interface Window {
    electronAPI: {
      openLoginWindow: () => Promise<void>;
      saveToken: (key: string, value: string) => Promise<void>;
      getToken: (key: string) => Promise<string | null>;
      log: (message: string) => Promise<void>;
    };
  }
}

export {};
