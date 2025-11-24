import React, { useState } from "react";
import {
  CssBaseline,
  Container,
  ThemeProvider,
  createTheme,
} from "@mui/material";
import LoginPage from "./pages/LoginPage";
import ExporterPage from "./pages/ExporterPage";

const theme = createTheme({
  palette: {
    primary: {
      main: "#1976d2",
    },
    secondary: {
      main: "#dc004e",
    },
  },
});

const App: React.FC = () => {
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [accessToken, setAccessToken] = useState<string | null>(null);

  const handleLoginSuccess = (token: string) => {
    setAccessToken(token);
    setIsAuthenticated(true);
    window.electronAPI.saveToken("acc-token", token);
  };

  const handleLogout = () => {
    setIsAuthenticated(false);
    setAccessToken(null);
    window.electronAPI.saveToken("acc-token", "");
  };

  return (
    <ThemeProvider theme={theme}>
      <CssBaseline />
      <Container maxWidth="xl" sx={{ py: { xs: 2, md: 4 }, px: { xs: 2, md: 3 } }}>
        {!isAuthenticated ? (
          <LoginPage onLoginSuccess={handleLoginSuccess} />
        ) : (
          <ExporterPage accessToken={accessToken!} onLogout={handleLogout} />
        )}
      </Container>
    </ThemeProvider>
  );
};

export default App;
