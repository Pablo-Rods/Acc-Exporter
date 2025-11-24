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
      const { authUrl } = await authService.startAuth();

      // Abre la ventana de login de Electron
      const code = await window.electronAPI.openLoginWindow(authUrl);

      if (!code) {
        setError("Autenticación cancelada o falló");
        return;
      }

      // Intercambia el código por un token
      const tokenResponse = await authService.handleCallback(code);

      onLoginSuccess(tokenResponse.accessToken);
    } catch (err) {
      const errorMessage =
        err instanceof Error ? err.message : "Error en la autenticación";
      setError(errorMessage);
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
