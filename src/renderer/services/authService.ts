import axios from "axios";
import { ipcService } from "./ipcService";

const API_BASE = "http://localhost:5188/api";

interface TokenResponse {
  accessToken: string;
  refreshToken: string;
  tokenType: string;
  expiresIn: number;
  issuedAt: string;
}

interface AuthStartResponse {
  authUrl: string;
  requestId: string;
}

export const authService = {
  async startAuth(): Promise<AuthStartResponse> {
    try {
      const response = await axios.get<AuthStartResponse>(
        `${API_BASE}/auth/start`
      );
      return response.data;
    } catch (error) {
      console.error("Error iniciando autenticación:", error);
      throw error;
    }
  },

  async handleCallback(
    code: string,
    requestId: string
  ): Promise<TokenResponse> {
    try {
      const response = await axios.post<TokenResponse>(
        `${API_BASE}/auth/callback`,
        null,
        {
          params: { code, requestId },
        }
      );

      // Guarda el token en el keychain
      await ipcService.saveToken("acc-token", response.data.accessToken);
      await ipcService.saveToken(
        "acc-refresh-token",
        response.data.refreshToken
      );

      return response.data;
    } catch (error) {
      console.error("Error en callback de autenticación:", error);
      throw error;
    }
  },

  async refreshToken(refreshToken: string): Promise<TokenResponse> {
    try {
      const response = await axios.post<TokenResponse>(
        `${API_BASE}/auth/refresh`,
        refreshToken
      );

      await ipcService.saveToken("acc-token", response.data.accessToken);

      return response.data;
    } catch (error) {
      console.error("Error refrescando token:", error);
      throw error;
    }
  },

  async logout(): Promise<void> {
    await ipcService.saveToken("acc-token", "");
    await ipcService.saveToken("acc-refresh-token", "");
  },
};
