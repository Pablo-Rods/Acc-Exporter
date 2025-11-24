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
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Paper,
  useTheme,
  useMediaQuery,
  Checkbox,
  ListItemText,
  OutlinedInput,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  SelectChangeEvent,
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

  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down("md"));
  const isSmallScreen = useMediaQuery(theme.breakpoints.down("sm"));

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

  // Define mapping between display names and property names
  const columnMapping: Record<string, string> = {
    'Versión': 'revisionNumber',
    'Fecha creación': 'createTime',
    'Creado por': 'createUserName',
    'Última actualización': 'lastModifiedTime',
    'Actualizado por': 'lastModifiedUserName',
    'Tamaño': 'storageSize'
  };

  // Define all available columns (display names)
  const standardColumns = [
    'Versión',
    'Fecha creación',
    'Creado por',
    'Última actualización',
    'Actualizado por',
    'Tamaño'
  ];

  const handleColumnChange = (event: SelectChangeEvent<string[]>) => {
    const {
      target: { value },
    } = event;

    // value contains the INCLUDED columns (display names).
    // We need to calculate the EXCLUDED columns to update selectedColumns state.

    const includedDisplayNames = typeof value === 'string' ? value.split(',') : value;

    if (!previewData) return;

    // Get all custom attribute names
    const customAttrNames = Array.from(
      new Set(
        previewData.flatMap((file) =>
          file.customAttributes?.map((attr) => attr.name) || []
        )
      )
    );

    // Combine standard columns and custom attributes (all display names)
    const allDisplayNames = [...standardColumns, ...customAttrNames];

    // Get excluded display names
    const excludedDisplayNames = allDisplayNames.filter(col => !includedDisplayNames.includes(col));

    // Convert excluded display names to property names
    const excludedPropertyNames = excludedDisplayNames.map(displayName =>
      columnMapping[displayName] || displayName // Use mapping for standard columns, keep custom attr names as-is
    );

    setSelectedColumns(excludedPropertyNames);
  };

  const isDownloadReady = selectedFolderId && selectedProjectData;

  return (
    <>
      {/* AppBar */}
      <AppBar position="static" elevation={1}>
        <Toolbar sx={{ flexDirection: { xs: "column", sm: "row" }, py: { xs: 1, sm: 0 } }}>
          <Typography variant="h6" sx={{ flexGrow: 1, fontWeight: 600, mb: { xs: 1, sm: 0 }, fontSize: { xs: "1.1rem", sm: "1.25rem" } }}>
            ACC Metadata Exporter
          </Typography>
          <Button
            color="inherit"
            startIcon={<LogoutIcon />}
            onClick={handleLogout}
            variant="outlined"
            size={isSmallScreen ? "small" : "medium"}
            sx={{
              width: { xs: "100%", sm: "auto" },
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
      <Box sx={{ bgcolor: "#f5f5f5", minHeight: "calc(100vh - 64px)", py: { xs: 2, md: 3 } }}>
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
              Pasos para exportar:
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
                  p: { xs: 2, md: 4 },
                  bgcolor: "white",
                  borderRadius: 2,
                  border: "1px solid #e0e0e0",
                  minHeight: 300,
                }}
              >
                {/* Header Section */}
                <Box sx={{ textAlign: "center", mb: 4 }}>
                  <Typography
                    variant={isMobile ? "h6" : "h5"}
                    color="textPrimary"
                    sx={{ mb: 2, fontWeight: 600 }}
                  >
                    Exportar Versiones de Archivos
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
                      px: { xs: 2, md: 4 },
                      py: 1.5,
                      fontSize: { xs: "0.875rem", md: "1rem" },
                      fontWeight: 600,
                      mb: 2,
                      width: { xs: "100%", sm: "auto" },
                    }}
                  >
                    {loadingPreview
                      ? "Cargando..."
                      : "Vista Previa de Columnas"}
                  </Button>
                </Box>

                {/* Preview Data Table - Full Width */}
                {previewData && previewData.length > 0 && (
                  <Box sx={{ mb: 3, width: "100%" }}>

                    {/* Column Selector Dropdown */}
                    <Box sx={{ mb: 2 }}>
                      <FormControl sx={{ m: 1, width: 300 }}>
                        <InputLabel id="column-multiple-checkbox-label">Columnas Visibles</InputLabel>
                        <Select
                          labelId="column-multiple-checkbox-label"
                          id="column-multiple-checkbox"
                          multiple
                          value={
                            // Calculate included columns for the Select value (display names)
                            (() => {
                              const customAttrNames = Array.from(
                                new Set(
                                  previewData.flatMap((file) =>
                                    file.customAttributes?.map((attr) => attr.name) || []
                                  )
                                )
                              );
                              const allDisplayNames = [...standardColumns, ...customAttrNames];

                              // Filter out excluded columns by checking property names
                              return allDisplayNames.filter(displayName => {
                                const propertyName = columnMapping[displayName] || displayName;
                                return !selectedColumns.includes(propertyName);
                              });
                            })()
                          }
                          onChange={handleColumnChange}
                          input={<OutlinedInput label="Columnas Visibles" />}
                          renderValue={(selected) => selected.join(', ')}
                          MenuProps={{
                            PaperProps: {
                              style: {
                                maxHeight: 48 * 4.5 + 8,
                                width: 250,
                              },
                            },
                          }}
                        >
                          {/* Standard columns */}
                          {standardColumns.map((displayName) => {
                            const propertyName = columnMapping[displayName];
                            return (
                              <MenuItem key={displayName} value={displayName}>
                                <Checkbox checked={!selectedColumns.includes(propertyName)} />
                                <ListItemText primary={displayName} />
                              </MenuItem>
                            );
                          })}
                          {/* Custom attribute columns */}
                          {Array.from(
                            new Set(
                              previewData.flatMap((file) =>
                                file.customAttributes?.map((attr) => attr.name) || []
                              )
                            )
                          ).sort().map((name) => (
                            <MenuItem key={name} value={name}>
                              <Checkbox checked={!selectedColumns.includes(name)} />
                              <ListItemText primary={name} />
                            </MenuItem>
                          ))}
                        </Select>
                      </FormControl>
                    </Box>

                    <TableContainer
                      component={Paper}
                      elevation={1}
                      sx={{
                        maxHeight: 600,
                        borderRadius: 1,
                        overflow: 'auto',
                        border: '1px solid #d0d0d0',
                        '&::-webkit-scrollbar': {
                          width: '8px',
                          height: '8px',
                        },
                        '&::-webkit-scrollbar-track': {
                          background: '#f9f9f9',
                        },
                        '&::-webkit-scrollbar-thumb': {
                          background: '#bdbdbd',
                          borderRadius: '4px',
                          '&:hover': {
                            background: '#999',
                          },
                        },
                      }}
                    >
                      <Table stickyHeader size="small">
                        <TableHead>
                          <TableRow sx={{ bgcolor: '#f5f5f5' }}>
                            <TableCell
                              sx={{
                                fontWeight: 600,
                                fontSize: '0.8rem',
                                backgroundColor: '#f5f5f5',
                                color: '#333',
                                borderBottom: '1px solid #d0d0d0',
                                py: 1.2,
                                px: 2,
                                position: 'sticky',
                                top: 0,
                                zIndex: 100,
                              }}
                            >
                              Nombre
                            </TableCell>

                            {!selectedColumns.includes('revisionNumber') && (
                              <TableCell
                                sx={{
                                  fontWeight: 600,
                                  fontSize: '0.8rem',
                                  backgroundColor: '#f5f5f5',
                                  color: '#333',
                                  borderBottom: '1px solid #d0d0d0',
                                  py: 1.2,
                                  px: 2,
                                  position: 'sticky',
                                  top: 0,
                                  zIndex: 100,
                                }}
                              >
                                Versión
                              </TableCell>
                            )}

                            {!selectedColumns.includes('createTime') && (
                              <TableCell
                                sx={{
                                  fontWeight: 600,
                                  fontSize: '0.8rem',
                                  backgroundColor: '#f5f5f5',
                                  color: '#333',
                                  borderBottom: '1px solid #d0d0d0',
                                  py: 1.2,
                                  px: 2,
                                  position: 'sticky',
                                  top: 0,
                                  zIndex: 100,
                                }}
                              >
                                Fecha creación
                              </TableCell>
                            )}

                            {!selectedColumns.includes('createUserName') && (
                              <TableCell
                                sx={{
                                  fontWeight: 600,
                                  fontSize: '0.8rem',
                                  backgroundColor: '#f5f5f5',
                                  color: '#333',
                                  borderBottom: '1px solid #d0d0d0',
                                  py: 1.2,
                                  px: 2,
                                  position: 'sticky',
                                  top: 0,
                                  zIndex: 100,
                                }}
                              >
                                Creado por
                              </TableCell>
                            )}

                            {!selectedColumns.includes('lastModifiedTime') && (
                              <TableCell
                                sx={{
                                  fontWeight: 600,
                                  fontSize: '0.8rem',
                                  backgroundColor: '#f5f5f5',
                                  color: '#333',
                                  borderBottom: '1px solid #d0d0d0',
                                  py: 1.2,
                                  px: 2,
                                  position: 'sticky',
                                  top: 0,
                                  zIndex: 100,
                                }}
                              >
                                Última actualización
                              </TableCell>
                            )}

                            {!selectedColumns.includes('lastModifiedUserName') && (
                              <TableCell
                                sx={{
                                  fontWeight: 600,
                                  fontSize: '0.8rem',
                                  backgroundColor: '#f5f5f5',
                                  color: '#333',
                                  borderBottom: '1px solid #d0d0d0',
                                  py: 1.2,
                                  px: 2,
                                  position: 'sticky',
                                  top: 0,
                                  zIndex: 100,
                                }}
                              >
                                Actualizado por
                              </TableCell>
                            )}

                            {!selectedColumns.includes('storageSize') && (
                              <TableCell
                                sx={{
                                  fontWeight: 600,
                                  fontSize: '0.8rem',
                                  backgroundColor: '#f5f5f5',
                                  color: '#333',
                                  borderBottom: '1px solid #d0d0d0',
                                  py: 1.2,
                                  px: 2,
                                  position: 'sticky',
                                  top: 0,
                                  zIndex: 100,
                                }}
                              >
                                Tamaño
                              </TableCell>
                            )}

                            {/* Dynamic custom attribute columns */}
                            {Array.from(
                              new Set(
                                previewData.flatMap((file) =>
                                  file.customAttributes?.map((attr) => attr.name) || []
                                )
                              )
                            )
                              .sort()
                              .filter(attrName => !selectedColumns.includes(attrName))
                              .map((attrName) => {
                                return (
                                  <TableCell
                                    key={attrName}
                                    sx={{
                                      fontWeight: 600,
                                      fontSize: '0.8rem',
                                      backgroundColor: '#f5f5f5',
                                      color: '#333',
                                      borderBottom: '1px solid #d0d0d0',
                                      py: 1.2,
                                      px: 2,
                                      position: 'sticky',
                                      top: 0,
                                      zIndex: 100,
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
                                    bgcolor: '#fafafa',
                                  },
                                  '&:hover': {
                                    bgcolor: '#f0f0f0',
                                  },
                                  transition: 'background-color 0.2s ease',
                                }}
                              >
                                <TableCell
                                  sx={{
                                    fontWeight: 500,
                                    color: '#333',
                                    py: 1,
                                    px: 2,
                                    fontSize: '0.8rem',
                                    borderBottom: '1px solid #e8e8e8',
                                  }}
                                >
                                  {file.name}
                                </TableCell>
                                {!selectedColumns.includes('revisionNumber') && (
                                  <TableCell
                                    sx={{
                                      color: '#555',
                                      py: 1,
                                      px: 2,
                                      fontSize: '0.8rem',
                                      borderBottom: '1px solid #e8e8e8',
                                    }}
                                  >
                                    {file.revisionNumber}
                                  </TableCell>
                                )}
                                {!selectedColumns.includes('createTime') && (
                                  <TableCell
                                    sx={{
                                      color: '#555',
                                      py: 1,
                                      px: 2,
                                      fontSize: '0.8rem',
                                      borderBottom: '1px solid #e8e8e8',
                                    }}
                                  >
                                    {file.createTime}
                                  </TableCell>
                                )}
                                {!selectedColumns.includes('createUserName') && (
                                  <TableCell
                                    sx={{
                                      color: '#555',
                                      py: 1,
                                      px: 2,
                                      fontSize: '0.8rem',
                                      borderBottom: '1px solid #e8e8e8',
                                    }}
                                  >
                                    {file.createUserName}
                                  </TableCell>
                                )}
                                {!selectedColumns.includes('lastModifiedTime') && (
                                  <TableCell
                                    sx={{
                                      color: '#555',
                                      py: 1,
                                      px: 2,
                                      fontSize: '0.8rem',
                                      borderBottom: '1px solid #e8e8e8',
                                    }}
                                  >
                                    {file.lastModifiedTime}
                                  </TableCell>
                                )}
                                {!selectedColumns.includes('lastModifiedUserName') && (
                                  <TableCell
                                    sx={{
                                      color: '#555',
                                      py: 1,
                                      px: 2,
                                      fontSize: '0.8rem',
                                      borderBottom: '1px solid #e8e8e8',
                                    }}
                                  >
                                    {file.lastModifiedUserName}
                                  </TableCell>
                                )}

                                {!selectedColumns.includes('storageSize') && (
                                  <TableCell
                                    sx={{
                                      color: '#555',
                                      py: 1,
                                      px: 2,
                                      fontSize: '0.8rem',
                                      borderBottom: '1px solid #e8e8e8',
                                    }}
                                  >
                                    {file.storageSize}
                                  </TableCell>
                                )}
                                {/* Show custom attribute values */}
                                {allAttrNames
                                  .filter(attrName => !selectedColumns.includes(attrName))
                                  .map((attrName) => {
                                    return (
                                      <TableCell
                                        key={attrName}
                                        sx={{
                                          color: '#666',
                                          py: 1,
                                          px: 2,
                                          fontSize: '0.8rem',
                                          borderBottom: '1px solid #e8e8e8',
                                          fontFamily: 'system-ui, -apple-system, sans-serif',
                                        }}
                                      >
                                        {customAttrs.get(attrName) || (
                                          <span style={{ color: '#ccc' }}>—</span>
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
                          color: '#666',
                          fontWeight: 500,
                          fontSize: '0.8rem',
                        }}
                      >
                        Total: {previewData.length} archivo(s)
                      </Typography>
                      <Typography
                        variant="caption"
                        sx={{
                          color: '#999',
                          fontSize: '0.75rem',
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
                      px: { xs: 2, md: 4 },
                      py: 1.5,
                      fontSize: { xs: "0.875rem", md: "1rem" },
                      fontWeight: 600,
                      width: { xs: "100%", sm: "auto" },
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
        </Container>
      </Box>
    </>
  );
};

export default ExporterPage;