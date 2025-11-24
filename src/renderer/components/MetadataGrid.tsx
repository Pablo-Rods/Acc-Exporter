import React, { useEffect, useState } from "react";
import {
  Box,
  Button,
  Card,
  CardContent,
  CardHeader,
  Checkbox,
  CircularProgress,
  FormGroup,
  FormControlLabel,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Paper,
  Alert,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Stack,
  LinearProgress,
  Typography,
  Chip,
  AlertColor,
} from "@mui/material";
import FileDownloadIcon from "@mui/icons-material/FileDownload";
import CheckCircleIcon from "@mui/icons-material/CheckCircle";
import ErrorIcon from "@mui/icons-material/Error";
import {
  accService,
  FileMetadata,
  MetadataField,
  Folder,
} from "../services/accService";

interface MetadataGridProps {
  accessToken: string;
  projectId: string;
  folderId: string;
  files?: Folder[];
}

interface AlertState {
  message: string;
  severity: AlertColor;
}

export const MetadataGrid: React.FC<MetadataGridProps> = ({
  accessToken,
  projectId,
  folderId,
  files: initialFiles,
}) => {
  const [files, setFiles] = useState<FileMetadata[]>([]);
  const [metadataFields, setMetadataFields] = useState<MetadataField[]>([]);
  const [selectedColumns, setSelectedColumns] = useState<Set<string>>(
    new Set()
  );
  const [loading, setLoading] = useState(false);
  const [loadingMetadata, setLoadingMetadata] = useState(false);
  const [alert, setAlert] = useState<AlertState | null>(null);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [exporting, setExporting] = useState(false);
  const [exportSuccess, setExportSuccess] = useState(false);
  const [progress, setProgress] = useState(0);

  // Cargar metadatos de cada archivo
  useEffect(() => {
    const loadFilesWithMetadata = async () => {
      if (!folderId) return;

      try {
        setLoading(true);
        setLoadingMetadata(true);
        setAlert(null);

        let filesList: FileMetadata[] = [];

        // Si ya tienes los archivos desde el ProjectSelector, conviértelos
        if (initialFiles && initialFiles.length > 0) {
          filesList = initialFiles
            .filter((item) => !item.isFolder)
            .map((item) => ({
              id: item.id,
              name: item.name,
              metadata: {},
            }));
        } else {
          // Si no, carga desde la API
          filesList = await accService.getFiles(projectId, folderId);
        }

        if (filesList.length === 0) {
          setAlert({
            message: "No hay archivos en esta carpeta",
            severity: "info",
          });
          setLoadingMetadata(false);
          setLoading(false);
          return;
        }

        // Ahora carga los metadatos de cada archivo
        setProgress(0);
        const filesWithMetadata: FileMetadata[] = [];
        const failedFiles: string[] = [];

        for (let i = 0; i < filesList.length; i++) {
          const file = filesList[i];
          try {
            const metadata = await accService.getFileMetadata(
              projectId,
              file.id
            );
            filesWithMetadata.push({
              id: file.id,
              name: file.name,
              metadata: metadata,
            });
          } catch (err) {
            // Si falla cargando metadatos de un archivo, lo incluye sin metadatos
            console.warn(`Error cargando metadatos para ${file.name}:`, err);
            filesWithMetadata.push({
              id: file.id,
              name: file.name,
              metadata: {},
            });
            failedFiles.push(file.name);
          }
          setProgress(((i + 1) / filesList.length) * 100);
        }

        setFiles(filesWithMetadata);

        if (failedFiles.length > 0) {
          setAlert({
            message: `Se cargaron ${filesWithMetadata.length} archivos, pero hubo problemas con ${failedFiles.length}`,
            severity: "warning",
          });
        }

        setLoadingMetadata(false);

        // Cargar campos de metadatos disponibles
        try {
          const fieldsData = await accService.getMetadataFields(
            projectId,
            folderId
          );
          setMetadataFields(fieldsData);

          // Seleccionar todos los campos por defecto
          const allFieldNames = new Set(fieldsData.map((f) => f.fieldName));
          allFieldNames.add("Filename");
          setSelectedColumns(allFieldNames);
        } catch (err) {
          console.warn("Error cargando campos de metadatos:", err);
          // Usar campos disponibles en los archivos
          const allFields = new Set<string>(["Filename"]);
          filesWithMetadata.forEach((file) => {
            Object.keys(file.metadata).forEach((key) => allFields.add(key));
          });
          setSelectedColumns(allFields);
        }
      } catch (err) {
        const errorMessage =
          err instanceof Error ? err.message : "Error desconocido";
        setAlert({
          message: `Error cargando datos: ${errorMessage}`,
          severity: "error",
        });
        console.error(err);
      } finally {
        setLoading(false);
        setLoadingMetadata(false);
      }
    };

    loadFilesWithMetadata();
  }, [folderId, projectId, accessToken, initialFiles]);

  const handleColumnToggle = (columnName: string) => {
    const newSelected = new Set(selectedColumns);
    if (newSelected.has(columnName)) {
      newSelected.delete(columnName);
    } else {
      newSelected.add(columnName);
    }
    setSelectedColumns(newSelected);
  };

  const handleSelectAll = () => {
    if (selectedColumns.size === metadataFields.length + 1) {
      setSelectedColumns(new Set());
    } else {
      const allFields = new Set<string>(["Filename"]);
      metadataFields.forEach((f) => allFields.add(f.fieldName));
      setSelectedColumns(allFields);
    }
  };

  const handleExport = async () => {
    try {
      setExporting(true);
      setExportSuccess(false);

      if (selectedColumns.size === 0) {
        setAlert({
          message: "Debe seleccionar al menos una columna",
          severity: "error",
        });
        return;
      }

      const filesData = files.map((file) => ({
        filename: file.name,
        metadata: file.metadata,
      }));

      const blob = await accService.exportToExcel(
        filesData,
        Array.from(selectedColumns)
      );

      // Descargar archivo
      const url = window.URL.createObjectURL(blob);
      const link = document.createElement("a");
      link.href = url;
      link.download = `metadata-${new Date().getTime()}.xlsx`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      window.URL.revokeObjectURL(url);

      setExportSuccess(true);
      setTimeout(() => {
        setDialogOpen(false);
        setExportSuccess(false);
      }, 2000);
    } catch (err) {
      const errorMessage =
        err instanceof Error ? err.message : "Error desconocido";
      setAlert({
        message: `Error exportando Excel: ${errorMessage}`,
        severity: "error",
      });
      console.error(err);
    } finally {
      setExporting(false);
    }
  };

  const displayColumns = Array.from(selectedColumns).sort((a, b) => {
    if (a === "Filename") return -1;
    if (b === "Filename") return 1;
    return a.localeCompare(b);
  });

  const isAllSelected = selectedColumns.size === metadataFields.length + 1;
  const isPartialSelected =
    selectedColumns.size > 0 &&
    selectedColumns.size < metadataFields.length + 1;

  return (
    <Card>
      <CardHeader
        title="Metadatos de Archivos"
        subheader={
          files.length > 0
            ? `${files.length} archivo(s) encontrado(s)`
            : undefined
        }
        action={
          <Button
            variant="contained"
            startIcon={<FileDownloadIcon />}
            onClick={() => setDialogOpen(true)}
            disabled={files.length === 0 || loadingMetadata}
          >
            Exportar a Excel
          </Button>
        }
      />
      <CardContent>
        {alert && (
          <Alert
            severity={alert.severity}
            sx={{ mb: 2 }}
            onClose={() => setAlert(null)}
          >
            {alert.message}
          </Alert>
        )}

        {(loading || loadingMetadata) && (
          <Box sx={{ mb: 2 }}>
            <Stack spacing={1}>
              <Typography variant="body2">
                Cargando metadatos... ({Math.round(progress)}%)
              </Typography>
              <LinearProgress variant="determinate" value={progress} />
            </Stack>
          </Box>
        )}

        {!loading && files.length === 0 && !loadingMetadata && (
          <Alert severity="info">No hay archivos en esta carpeta</Alert>
        )}

        {!loading && files.length > 0 && !loadingMetadata && (
          <>
            <TableContainer component={Paper} sx={{ mb: 2, maxHeight: 600 }}>
              <Table size="small" stickyHeader>
                <TableHead>
                  <TableRow sx={{ backgroundColor: "#f5f5f5" }}>
                    {displayColumns.map((column) => (
                      <TableCell key={column} align="left">
                        <strong>{column}</strong>
                      </TableCell>
                    ))}
                  </TableRow>
                </TableHead>
                <TableBody>
                  {files.map((file, idx) => (
                    <TableRow key={idx} hover>
                      {displayColumns.map((column) => (
                        <TableCell key={`${idx}-${column}`} align="left">
                          {column === "Filename"
                            ? file.name
                            : file.metadata[column] !== undefined
                              ? formatCellValue(file.metadata[column])
                              : "-"}
                        </TableCell>
                      ))}
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </TableContainer>

            <Box sx={{ mb: 2 }}>
              <Chip
                label={`Total: ${files.length} registro(s)`}
                variant="outlined"
              />
            </Box>
          </>
        )}
      </CardContent>

      {/* Dialog de selección de columnas */}
      <Dialog
        open={dialogOpen}
        onClose={() => !exporting && setDialogOpen(false)}
        maxWidth="sm"
        fullWidth
      >
        <DialogTitle>Seleccionar Columnas para Exportar</DialogTitle>
        <DialogContent>
          {exportSuccess ? (
            <Box
              sx={{
                display: "flex",
                flexDirection: "column",
                alignItems: "center",
                justifyContent: "center",
                py: 4,
              }}
            >
              <CheckCircleIcon
                sx={{ fontSize: 64, color: "success.main", mb: 2 }}
              />
              <Typography variant="h6" color="success.main">
                ¡Exportación completada!
              </Typography>
              <Typography variant="body2" color="textSecondary" sx={{ mt: 1 }}>
                Tu archivo ha sido descargado correctamente
              </Typography>
            </Box>
          ) : (
            <FormGroup sx={{ mt: 2 }}>
              <Box sx={{ mb: 2 }}>
                <FormControlLabel
                  control={
                    <Checkbox
                      checked={isAllSelected}
                      indeterminate={isPartialSelected}
                      onChange={handleSelectAll}
                    />
                  }
                  label={
                    <Typography variant="subtitle2" sx={{ fontWeight: 600 }}>
                      Seleccionar todos
                    </Typography>
                  }
                />
              </Box>

              <FormControlLabel
                control={
                  <Checkbox
                    checked={selectedColumns.has("Filename")}
                    onChange={() => handleColumnToggle("Filename")}
                  />
                }
                label="Nombre de Archivo"
              />

              {metadataFields.length > 0 ? (
                metadataFields.map((field) => (
                  <FormControlLabel
                    key={field.fieldName}
                    control={
                      <Checkbox
                        checked={selectedColumns.has(field.fieldName)}
                        onChange={() => handleColumnToggle(field.fieldName)}
                      />
                    }
                    label={`${field.displayName} (${field.dataType})`}
                  />
                ))
              ) : (
                <Alert severity="info" sx={{ mt: 2 }}>
                  No se encontraron campos de metadatos adicionales
                </Alert>
              )}
            </FormGroup>
          )}
        </DialogContent>
        <DialogActions>
          <Button
            onClick={() => setDialogOpen(false)}
            disabled={exporting || exportSuccess}
          >
            {exportSuccess ? "Cerrar" : "Cancelar"}
          </Button>
          {!exportSuccess && (
            <Button
              onClick={handleExport}
              variant="contained"
              disabled={exporting || selectedColumns.size === 0}
              startIcon={
                exporting ? (
                  <CircularProgress size={20} />
                ) : (
                  <FileDownloadIcon />
                )
              }
            >
              {exporting ? "Exportando..." : "Exportar"}
            </Button>
          )}
        </DialogActions>
      </Dialog>
    </Card>
  );
};

function formatCellValue(value: unknown): string {
  if (value === null || value === undefined) {
    return "-";
  }

  if (typeof value === "boolean") {
    return value ? "Sí" : "No";
  }

  if (typeof value === "object") {
    try {
      return JSON.stringify(value);
    } catch {
      return String(value);
    }
  }

  return String(value);
}

export default MetadataGrid;
