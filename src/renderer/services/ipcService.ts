export const ipcService = {
  // Auth
  async openLoginWindow(authUrl: string): Promise<string | null> {
    return window.electronAPI.openLoginWindow(authUrl);
  },

  async saveToken(key: string, value: string): Promise<void> {
    return window.electronAPI.saveToken(key, value);
  },

  async getToken(key: string): Promise<string | null> {
    return window.electronAPI.getToken(key);
  },

  async log(message: string): Promise<void> {
    return window.electronAPI.log(message);
  },
};
