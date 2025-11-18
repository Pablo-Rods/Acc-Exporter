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
} from "@mui/material";
import FileDownloadIcon from "@mui/icons-material/FileDownload";
import {
  accService,
  FileMetadata,
  MetadataField,
} from "../services/accService";

interface MetadataGridProps {
  accessToken: string;
  projectId: string;
  folderId: string;
}

export const MetadataGrid: React.FC<MetadataGridProps> = ({
  accessToken,
  projectId,
  folderId,
}) => {
  const [files, setFiles] = useState<FileMetadata[]>([]);
  const [metadataFields, setMetadataFields] = useState<MetadataField[]>([]);
  const [selectedColumns, setSelectedColumns] = useState<Set<string>>(
    new Set()
  );
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [exporting, setExporting] = useState(false);

  // Cargar datos cuando se selecciona una carpeta
  useEffect(() => {
    const loadData = async () => {
      if (!folderId) return;

      try {
        setLoading(true);
        accService.setAuthToken(accessToken);

        // Cargar archivos
        const filesData = await accService.getFiles(projectId, folderId);
        setFiles(filesData);

        // Cargar campos de metadatos disponibles
        const fieldsData = await accService.getMetadataFields(
          projectId,
          folderId
        );
        setMetadataFields(fieldsData);

        // Seleccionar todos los campos por defecto
        const allFieldNames = new Set(fieldsData.map((f) => f.fieldName));
        allFieldNames.add("Filename"); // Agregar nombre de archivo
        setSelectedColumns(allFieldNames);
      } catch (err) {
        setError("Error cargando datos");
        console.error(err);
      } finally {
        setLoading(false);
      }
    };

    loadData();
  }, [folderId, projectId, accessToken]);

  const handleColumnToggle = (columnName: string) => {
    const newSelected = new Set(selectedColumns);
    if (newSelected.has(columnName)) {
      newSelected.delete(columnName);
    } else {
      newSelected.add(columnName);
    }
    setSelectedColumns(newSelected);
  };

  const handleExport = async () => {
    try {
      setExporting(true);

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

      setDialogOpen(false);
    } catch (err) {
      setError("Error exportando Excel");
      console.error(err);
    } finally {
      setExporting(false);
    }
  };

  const displayColumns = Array.from(selectedColumns);

  return (
    <Card>
      <CardHeader
        title="Metadatos de Archivos"
        action={
          <Button
            variant="contained"
            startIcon={<FileDownloadIcon />}
            onClick={() => setDialogOpen(true)}
            disabled={files.length === 0}
          >
            Exportar a Excel
          </Button>
        }
      />
      <CardContent>
        {error && (
          <Alert severity="error" sx={{ mb: 2 }}>
            {error}
          </Alert>
        )}

        {loading && <CircularProgress />}

        {!loading && files.length === 0 && (
          <Alert severity="info">No hay archivos en esta carpeta</Alert>
        )}

        {!loading && files.length > 0 && (
          <>
            <TableContainer component={Paper}>
              <Table size="small">
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
                            : JSON.stringify(file.metadata[column] || "")}
                        </TableCell>
                      ))}
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </TableContainer>

            <Box sx={{ mt: 2 }}>
              <strong>Registros: {files.length}</strong>
            </Box>
          </>
        )}
      </CardContent>

      {/* Dialog de selección de columnas */}
      <Dialog
        open={dialogOpen}
        onClose={() => setDialogOpen(false)}
        maxWidth="sm"
        fullWidth
      >
        <DialogTitle>Seleccionar Columnas para Exportar</DialogTitle>
        <DialogContent>
          <FormGroup sx={{ mt: 2 }}>
            <FormControlLabel
              control={
                <Checkbox
                  checked={selectedColumns.has("Filename")}
                  onChange={() => handleColumnToggle("Filename")}
                />
              }
              label="Nombre de Archivo"
            />
            {metadataFields.map((field) => (
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
            ))}
          </FormGroup>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setDialogOpen(false)}>Cancelar</Button>
          <Button
            onClick={handleExport}
            variant="contained"
            disabled={exporting || selectedColumns.size === 0}
          >
            {exporting ? <CircularProgress size={24} /> : "Exportar"}
          </Button>
        </DialogActions>
      </Dialog>
    </Card>
  );
};

export default MetadataGrid;
