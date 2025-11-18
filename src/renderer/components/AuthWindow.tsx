import React, { useEffect } from "react";
import { ipcService } from "../services/ipcService";

interface AuthWindowProps {
  authUrl: string;
  requestId: string;
  onAuthComplete: (code: string, requestId: string) => void;
}

export const AuthWindow: React.FC<AuthWindowProps> = ({
  authUrl,
  requestId,
  onAuthComplete,
}) => {
  useEffect(() => {
    const openAuthWindow = async () => {
      try {
        // Abre la ventana de login de Electron
        await ipcService.openLoginWindow();

        // En una aplicación real, necesitarías un mecanismo para
        // capturar el código del callback desde la ventana de Electron
        // Por ahora, redirige al authUrl en una ventana del navegador
        window.open(authUrl, "acc-login", "width=600,height=700");
      } catch (error) {
        console.error("Error abriendo ventana de autenticación:", error);
      }
    };

    openAuthWindow();
  }, [authUrl, requestId, onAuthComplete]);

  return null;
};
