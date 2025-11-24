import React, { useState } from "react";
import {
  Box,
  Grid,
  Button,
  AppBar,
  Toolbar,
  Typography,
  Container,
  Alert,
  AlertColor,
  CircularProgress,
  Card,
  CardContent,
  CardHeader,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Paper,
} from "@mui/material";
import LogoutIcon from "@mui/icons-material/Logout";
import FileDownloadIcon from "@mui/icons-material/FileDownload";
import PreviewIcon from "@mui/icons-material/Preview";
import ProjectSelector from "../components/ProjectSelector";
import { accService, FileVersionData } from "../services/accService";

interface ExporterPageProps {
  accessToken: string;
  onLogout: () => void;
}

interface AlertState {
  message: string;
  severity: AlertColor;
}

const ExporterPage: React.FC<ExporterPageProps> = ({
  accessToken,
  onLogout,
}) => {
  const [selectedFolderId, setSelectedFolderId] = useState<string | null>(null);
  const [selectedFolderName, setSelectedFolderName] = useState<string | null>(null);
  const [selectedProjectData, setSelectedProjectData] = useState<{
    projectId: string;
    hubId: string;
  } | null>(null);
  const [alert, setAlert] = useState<AlertState | null>(null);
  const [downloadingExcel, setDownloadingExcel] = useState(false);
  const [loadingPreview, setLoadingPreview] = useState(false);
  const [previewData, setPreviewData] = useState<FileVersionData[] | null>(null);
  const [selectedColumns, setSelectedColumns] = useState<string[]>([]);

  const handleFolderSelect = (folderId: string, folderName: string) => {
    setSelectedFolderId(folderId);
    setSelectedFolderName(folderName);
    setAlert({
      message: `Carpeta seleccionada: ${folderName}`,
      severity: "success",
    });

    // Auto-cerrar alerta
    setTimeout(() => setAlert(null), 3000);
  };

  const handleLogout = () => {
    if (window.confirm("¿Estás seguro de que deseas cerrar sesión?")) {
      onLogout();
    }
  };

  const handleDownloadExcel = async () => {
    if (!selectedFolderId || !selectedProjectData) {
      setAlert({
        message: "Debe seleccionar un proyecto y una carpeta",
        severity: "error",
      });
      return;
    }

    try {
      setDownloadingExcel(true);
      setAlert(null);

      const blob = await accService.exportFilesVersionsToExcel(
        selectedProjectData.hubId,
        selectedProjectData.projectId,
        selectedFolderId,
        selectedColumns // Pasar las columnas seleccionadas como excludeAttributes
      );

      // Descargar archivo
      const url = window.URL.createObjectURL(blob);
      const link = document.createElement("a");
      link.href = url;
      link.download = `custom_attributes_${new Date().getTime()}.xlsx`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      window.URL.revokeObjectURL(url);

      setAlert({
        message: "Excel descargado exitosamente",
        severity: "success",
      });

      // Auto-cerrar alerta
      setTimeout(() => setAlert(null), 3000);
    } catch (err) {
      const errorMessage =
        err instanceof Error ? err.message : "Error desconocido";
      setAlert({
        message: `Error descargando Excel: ${errorMessage}`,
        severity: "error",
      });
      console.error(err);
    } finally {
      setDownloadingExcel(false);
    }
  };

  const handlePreviewColumns = async () => {
    if (!selectedFolderId || !selectedProjectData) {
      setAlert({
        message: "Debe seleccionar un proyecto y una carpeta",
        severity: "error",
      });
      return;
    }

    try {
      setLoadingPreview(true);
      setAlert(null);
      setPreviewData(null);

      const response = await accService.getFileVersionsPreview(
        selectedProjectData.hubId,
        selectedProjectData.projectId,
        selectedFolderId
      );

      // Store the full data for table display
      setPreviewData(response.results);

      setAlert({
        message: `Vista previa generada: ${response.results.length} archivo(s) encontrado(s)`,
        severity: "success",
      });

      // Auto-cerrar alerta
      setTimeout(() => setAlert(null), 3000);
    } catch (err) {
      const errorMessage =
        err instanceof Error ? err.message : "Error desconocido";
      setAlert({
        message: `Error generando vista previa: ${errorMessage}`,
        severity: "error",
      });
      console.error(err);
    } finally {
      setLoadingPreview(false);
    }
  };

  const handleColumnToggle = (columnName: string) => {
    setSelectedColumns((prev) => {
      if (prev.includes(columnName)) {
        // Deselect
        const newSelection = prev.filter((col) => col !== columnName);
        console.log('Columnas seleccionadas:', newSelection);
        return newSelection;
      } else {
        // Select
        const newSelection = [...prev, columnName];
        console.log('Columnas seleccionadas:', newSelection);
        return newSelection;
      }
    });
  };

  const isDownloadReady = selectedFolderId && selectedProjectData;

  return (
    <>
      {/* AppBar */}
      <AppBar position="static" elevation={1}>
        <Toolbar>
          <Typography variant="h6" sx={{ flexGrow: 1, fontWeight: 600 }}>
            📊 ACC Metadata Exporter
          </Typography>
          <Button
            color="inherit"
            startIcon={<LogoutIcon />}
            onClick={handleLogout}
            variant="outlined"
            sx={{
              borderColor: "rgba(255,255,255,0.5)",
              "&:hover": {
                borderColor: "white",
                backgroundColor: "rgba(255,255,255,0.1)",
              },
            }}
          >
            Cerrar sesión
          </Button>
        </Toolbar>
      </AppBar>

      {/* Main Content */}
      <Box sx={{ bgcolor: "#f5f5f5", minHeight: "calc(100vh - 64px)", py: 3 }}>
        <Container maxWidth="xl">
          {/* Alerts */}
          {alert && (
            <Alert
              severity={alert.severity}
              onClose={() => setAlert(null)}
              sx={{ mb: 3 }}
            >
              {alert.message}
            </Alert>
          )}

          {/* Info Banner */}
          <Alert severity="info" sx={{ mb: 3 }}>
            <Typography variant="subtitle2" sx={{ fontWeight: 600, mb: 0.5 }}>
              ℹ️ Pasos para exportar:
            </Typography>
            <Typography variant="body2">
              1. Selecciona un proyecto • 2. Selecciona una carpeta • 3. Haz
              clic en "Descargar Excel con Versiones"
            </Typography>
          </Alert>

          <Grid container spacing={3}>
            {/* Left Column - Project Selector */}
            <Grid item xs={12} md={4}>
              <ProjectSelector
                accessToken={accessToken}
                onProjectSelect={setSelectedProjectData}
                onFolderSelect={handleFolderSelect}
              />
            </Grid>

            {/* Right Column - Download Area */}
            <Grid item xs={12} md={8}>
              <Box
                sx={{
                  p: 4,
                  bgcolor: "white",
                  borderRadius: 2,
                  border: "1px solid #e0e0e0",
                  minHeight: 300,
                }}
              >
                {/* Header Section */}
                <Box sx={{ textAlign: "center", mb: 4 }}>
                  <Typography
                    variant="h5"
                    color="textPrimary"
                    sx={{ mb: 2, fontWeight: 600 }}
                  >
                    📊 Exportar Versiones de Archivos
                  </Typography>
                  <Typography
                    variant="body1"
                    color="textSecondary"
                    sx={{ mb: 2 }}
                  >
                    Carpeta Seleccionada: {selectedFolderName || "Ninguna"}
                  </Typography>
                  <Typography
                    variant="body1"
                    color="textSecondary"
                    sx={{ mb: 4, maxWidth: 600, mx: "auto" }}
                  >
                    Selecciona un proyecto y una carpeta en el panel izquierdo,
                    luego haz clic en el botón para descargar un Excel con las
                    versiones de todos los archivos de esa carpeta de forma
                    recursiva.
                  </Typography>

                  {/* Preview Button */}
                  <Button
                    variant="outlined"
                    size="large"
                    startIcon={
                      loadingPreview ? (
                        <CircularProgress size={20} color="inherit" />
                      ) : (
                        <PreviewIcon />
                      )
                    }
                    onClick={handlePreviewColumns}
                    disabled={!isDownloadReady || loadingPreview}
                    sx={{
                      px: 4,
                      py: 1.5,
                      fontSize: "1rem",
                      fontWeight: 600,
                      mb: 2,
                    }}
                  >
                    {loadingPreview
                      ? "Cargando..."
                      : "Vista Previa de Columnas"}
                  </Button>
                </Box>

                {/* Preview Data Table - Full Width */}
                {previewData && previewData.length > 0 && (
                  <Box sx={{ mb: 3, width: "100%", maxHeight: 600, overflow: "auto" }}>
                    <TableContainer
                      component={Paper}
                      elevation={3}
                      sx={{
                        borderRadius: 2,
                        overflow: 'hidden',
                        border: '1px solid rgba(0, 0, 0, 0.08)',
                        '&::-webkit-scrollbar': {
                          width: '10px',
                          height: '10px',
                        },
                        '&::-webkit-scrollbar-track': {
                          background: '#f1f1f1',
                          borderRadius: '10px',
                        },
                        '&::-webkit-scrollbar-thumb': {
                          background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
                          borderRadius: '10px',
                          '&:hover': {
                            background: 'linear-gradient(135deg, #556bd9 0%, #653a91 100%)',
                          },
                        },
                      }}
                    >
                      <Table stickyHeader size="medium">
                        <TableHead>
                          <TableRow>
                            <TableCell
                              sx={{
                                fontWeight: 700,
                                fontSize: '0.95rem',
                                background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
                                color: 'white',
                                textTransform: 'uppercase',
                                letterSpacing: '0.5px',
                                borderBottom: '3px solid #5568d3',
                                py: 2,
                                px: 3,
                                position: 'sticky',
                                top: 0,
                                zIndex: 100,
                              }}
                            >
                              📄 Nombre del Archivo
                            </TableCell>
                            {/* Dynamic custom attribute columns */}
                            {Array.from(
                              new Set(
                                previewData.flatMap((file) =>
                                  file.customAttributes?.map((attr) => attr.name) || []
                                )
                              )
                            )
                              .sort()
                              .map((attrName) => {
                                const isSelected = selectedColumns.includes(attrName);
                                return (
                                  <TableCell
                                    key={attrName}
                                    onClick={() => handleColumnToggle(attrName)}
                                    sx={{
                                      fontWeight: 700,
                                      fontSize: '0.95rem',
                                      background: isSelected
                                        ? 'linear-gradient(135deg, #ef4444 0%, #dc2626 100%)'
                                        : 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
                                      color: 'white',
                                      textTransform: 'uppercase',
                                      letterSpacing: '0.5px',
                                      borderBottom: isSelected ? '3px solid #b91c1c' : '3px solid #5568d3',
                                      py: 2,
                                      px: 3,
                                      position: 'sticky',
                                      top: 0,
                                      zIndex: 100,
                                      cursor: 'pointer',
                                      transition: 'all 0.2s ease-in-out',
                                      '&:hover': {
                                        opacity: 0.9,
                                        transform: 'scale(1.02)',
                                      },
                                    }}
                                  >
                                    {attrName}
                                  </TableCell>
                                );
                              })}
                          </TableRow>
                        </TableHead>
                        <TableBody>
                          {previewData.map((file, index) => {
                            // Get all custom attributes for this file
                            const customAttrs = new Map(
                              file.customAttributes?.map((attr) => [attr.name, attr.value]) || []
                            );
                            // Get all possible custom attribute names
                            const allAttrNames = Array.from(
                              new Set(
                                previewData.flatMap((f) =>
                                  f.customAttributes?.map((attr) => attr.name) || []
                                )
                              )
                            ).sort();

                            return (
                              <TableRow
                                key={file.urn || index}
                                sx={{
                                  '&:nth-of-type(odd)': {
                                    bgcolor: 'rgba(102, 126, 234, 0.04)',
                                  },
                                  '&:hover': {
                                    bgcolor: 'rgba(102, 126, 234, 0.12)',
                                    transform: 'scale(1.001)',
                                    transition: 'all 0.2s ease-in-out',
                                    boxShadow: '0 2px 8px rgba(102, 126, 234, 0.15)',
                                  },
                                  transition: 'all 0.2s ease-in-out',
                                }}
                              >
                                <TableCell
                                  sx={{
                                    fontWeight: 600,
                                    color: '#1a1a2e',
                                    py: 2,
                                    px: 3,
                                    fontSize: '0.9rem',
                                    borderBottom: '1px solid rgba(0, 0, 0, 0.05)',
                                  }}
                                >
                                  {file.name}
                                </TableCell>
                                {/* Show custom attribute values */}
                                {allAttrNames.map((attrName) => {
                                  const isSelected = selectedColumns.includes(attrName);
                                  return (
                                    <TableCell
                                      key={attrName}
                                      sx={{
                                        color: '#2d3748',
                                        py: 2,
                                        px: 3,
                                        fontSize: '0.9rem',
                                        borderBottom: '1px solid rgba(0, 0, 0, 0.05)',
                                        fontFamily: 'Consolas, Monaco, "Courier New", monospace',
                                        bgcolor: isSelected ? 'rgba(239, 68, 68, 0.08)' : undefined,
                                      }}
                                    >
                                      {customAttrs.get(attrName) || (
                                        <span style={{ color: '#cbd5e0', fontStyle: 'italic' }}>—</span>
                                      )}
                                    </TableCell>
                                  );
                                })}
                              </TableRow>
                            );
                          })}
                        </TableBody>
                      </Table>
                    </TableContainer>
                    <Box
                      sx={{
                        mt: 2,
                        display: 'flex',
                        justifyContent: 'space-between',
                        alignItems: 'center',
                        px: 1,
                      }}
                    >
                      <Typography
                        variant="body2"
                        sx={{
                          color: '#667eea',
                          fontWeight: 600,
                          fontSize: '0.9rem',
                        }}
                      >
                        📊 Total: {previewData.length} archivo(s)
                      </Typography>
                      <Typography
                        variant="caption"
                        sx={{
                          color: '#718096',
                          fontStyle: 'italic',
                        }}
                      >
                        Vista previa de datos
                      </Typography>
                    </Box>
                  </Box>
                )}

                {/* Download Button - Centered */}
                <Box sx={{ textAlign: "center" }}>
                  <Button
                    variant="contained"
                    size="large"
                    startIcon={
                      downloadingExcel ? (
                        <CircularProgress size={20} color="inherit" />
                      ) : (
                        <FileDownloadIcon />
                      )
                    }
                    onClick={handleDownloadExcel}
                    disabled={!isDownloadReady || downloadingExcel}
                    sx={{
                      px: 4,
                      py: 1.5,
                      fontSize: "1rem",
                      fontWeight: 600,
                    }}
                  >
                    {downloadingExcel
                      ? "Descargando..."
                      : "Descargar Excel con Versiones"}
                  </Button>
                  {!isDownloadReady && (
                    <Typography
                      variant="caption"
                      color="textSecondary"
                      sx={{ display: "block", mt: 2 }}
                    >
                      Debes seleccionar un proyecto y una carpeta primero
                    </Typography>
                  )}
                </Box>
              </Box>
            </Grid>
          </Grid>

          {/* Footer */}
          <Box sx={{ mt: 6, textAlign: "center" }}>
            <Typography variant="caption" color="textSecondary">
              ACC Metadata Exporter v1.0 • Powered by Ayesa • © 2024
            </Typography>
          </Box>
        </Container>
      </Box>
    </>
  );
};

export default ExporterPage;
