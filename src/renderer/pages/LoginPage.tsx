import React, { useState } from "react";
import {
  Box,
  Button,
  Card,
  CardContent,
  Typography,
  Alert,
  CircularProgress,
} from "@mui/material";
import { authService } from "../services/authService";

interface LoginPageProps {
  onLoginSuccess: (token: string) => void;
}

const LoginPage: React.FC<LoginPageProps> = ({ onLoginSuccess }) => {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleLogin = async () => {
    try {
      setLoading(true);
      setError(null);

      // Inicia el flujo OAuth
      const { authUrl, requestId } = await authService.startAuth();

      // Abre el navegador con la URL de autenticación
      window.open(authUrl, "acc-login", "width=600,height=700");

      // En una aplicación real, necesitarías un servidor intermediario
      // que capture el callback y notifique a la app
      // Por ahora, simula el callback después de que el usuario autoriza

      // Espera a que el usuario complete la autenticación
      // En producción, esto debería venir de un IPC message
      const code = await new Promise<string>((resolve) => {
        const checkCode = setInterval(() => {
          // Aquí iría la lógica para capturar el código del callback
          // Por ahora, solo es un placeholder
        }, 1000);
      });

      // Intercambia el código por un token
      const tokenResponse = await authService.handleCallback(code, requestId);
      onLoginSuccess(tokenResponse.accessToken);
    } catch (err) {
      setError(
        err instanceof Error ? err.message : "Error en la autenticación"
      );
      console.error("Login error:", err);
    } finally {
      setLoading(false);
    }
  };

  return (
    <Box
      sx={{
        display: "flex",
        justifyContent: "center",
        alignItems: "center",
        minHeight: "100vh",
        backgroundColor: "#f5f5f5",
      }}
    >
      <Card sx={{ maxWidth: 400, width: "100%", m: 2 }}>
        <CardContent sx={{ textAlign: "center", py: 4 }}>
          <Typography
            variant="h4"
            gutterBottom
            sx={{ fontWeight: "bold", mb: 1 }}
          >
            ACC Metadata Exporter
          </Typography>
          <Typography variant="body2" color="textSecondary" sx={{ mb: 3 }}>
            Conecta con tu cuenta de Autodesk Construction Cloud para gestionar
            metadatos de proyectos
          </Typography>

          {error && (
            <Alert severity="error" sx={{ mb: 2 }}>
              {error}
            </Alert>
          )}

          <Button
            variant="contained"
            size="large"
            onClick={handleLogin}
            disabled={loading}
            fullWidth
            sx={{ py: 1.5 }}
          >
            {loading ? (
              <>
                <CircularProgress size={20} sx={{ mr: 1 }} />
                Conectando...
              </>
            ) : (
              "Conectar con ACC"
            )}
          </Button>
        </CardContent>
      </Card>
    </Box>
  );
};

export default LoginPage;
