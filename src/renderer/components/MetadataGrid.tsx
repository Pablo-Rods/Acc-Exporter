import React, { useEffect, useState } from "react";
import {
  Box,
  Button,
  Card,
  CardContent,
  CardHeader,
  CircularProgress,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Paper,
  Alert,
  Stack,
  LinearProgress,
  Typography,
  Chip,
  AlertColor,
} from "@mui/material";
import FileDownloadIcon from "@mui/icons-material/FileDownload";
import {
  accService,
  FileVersionData,
} from "../services/accService";

interface MetadataGridProps {
  hubId: string;
  projectId: string;
  folderId: string;
}

interface AlertState {
  message: string;
  severity: AlertColor;
}

export const MetadataGrid: React.FC<MetadataGridProps> = ({
  hubId,
  projectId,
  folderId,
}) => {
  const [fileVersions, setFileVersions] = useState<FileVersionData[]>([]);
  const [loading, setLoading] = useState(false);
  const [alert, setAlert] = useState<AlertState | null>(null);
  const [exporting, setExporting] = useState(false);

  // Cargar versiones de archivos
  useEffect(() => {
    const loadFileVersions = async () => {
      if (!folderId || !projectId || !hubId) return;

      try {
        setLoading(true);
        setAlert(null);

        const response = await accService.getFileVersionsPreview(
          hubId,
          projectId,
          folderId
        );

        if (!response.results || response.results.length === 0) {
          setAlert({
            message: "No se encontraron archivos en esta carpeta",
            severity: "info",
          });
          setFileVersions([]);
        } else {
          setFileVersions(response.results);
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
      }
    };

    loadFileVersions();
  }, [folderId, projectId, hubId]);

  const handleExport = async () => {
    try {
      setExporting(true);
      setAlert(null);

      const blob = await accService.exportFilesVersionsToExcel(
        hubId,
        projectId,
        folderId,
        [] // excludeAttributes vacío por defecto
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
        message: "¡Archivo exportado exitosamente!",
        severity: "success",
      });
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

  // Extraer todos los nombres de atributos personalizados únicos
  const getUniqueCustomAttributeNames = (): string[] => {
    const attributeNames = new Set<string>();
    fileVersions.forEach((file) => {
      file.customAttributes?.forEach((attr) => {
        attributeNames.add(attr.name);
      });
    });
    return Array.from(attributeNames).sort();
  };

  const customAttributeNames = getUniqueCustomAttributeNames();

  // Función para obtener el valor de un atributo personalizado
  const getCustomAttributeValue = (
    file: FileVersionData,
    attributeName: string
  ): string => {
    const attr = file.customAttributes?.find((a) => a.name === attributeName);
    return attr?.value || "-";
  };

  return (
    <Card>
      <CardHeader
        title="Versiones de Archivos"
        subheader={
          fileVersions.length > 0
            ? `${fileVersions.length} archivo(s) encontrado(s)`
            : undefined
        }
        action={
          <Button
            variant="contained"
            startIcon={exporting ? <CircularProgress size={20} /> : <FileDownloadIcon />}
            onClick={handleExport}
            disabled={fileVersions.length === 0 || loading || exporting}
          >
            {exporting ? "Exportando..." : "Exportar a Excel"}
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

        {loading && (
          <Box sx={{ mb: 2 }}>
            <Stack spacing={1}>
              <Typography variant="body2">
                Cargando versiones de archivos...
              </Typography>
              <LinearProgress />
            </Stack>
          </Box>
        )}

        {!loading && fileVersions.length === 0 && (
          <Alert severity="info">No hay archivos en esta carpeta</Alert>
        )}

        {!loading && fileVersions.length > 0 && (
          <>
            <TableContainer component={Paper} sx={{ mb: 2, maxHeight: 600 }}>
              <Table size="small" stickyHeader>
                <TableHead>
                  <TableRow sx={{ backgroundColor: "#f5f5f5" }}>
                    <TableCell align="left"><strong>Nombre</strong></TableCell>
                    <TableCell align="left"><strong>Título</strong></TableCell>
                    <TableCell align="left"><strong>Versión</strong></TableCell>
                    <TableCell align="left"><strong>Creado Por</strong></TableCell>
                    <TableCell align="left"><strong>Fecha Creación</strong></TableCell>
                    <TableCell align="left"><strong>Modificado Por</strong></TableCell>
                    <TableCell align="left"><strong>Última Modificación</strong></TableCell>
                    <TableCell align="left"><strong>Estado</strong></TableCell>
                    <TableCell align="left"><strong>Tamaño (bytes)</strong></TableCell>
                    {customAttributeNames.map((attrName) => (
                      <TableCell key={attrName} align="left">
                        <strong>{attrName}</strong>
                      </TableCell>
                    ))}
                  </TableRow>
                </TableHead>
                <TableBody>
                  {fileVersions.map((file, idx) => (
                    <TableRow key={idx} hover>
                      <TableCell align="left">{file.name}</TableCell>
                      <TableCell align="left">{file.title || "-"}</TableCell>
                      <TableCell align="left">{file.revisionNumber}</TableCell>
                      <TableCell align="left">{file.createUserName || "-"}</TableCell>
                      <TableCell align="left">
                        {file.createTime ? new Date(file.createTime).toLocaleString() : "-"}
                      </TableCell>
                      <TableCell align="left">{file.lastModifiedUserName || "-"}</TableCell>
                      <TableCell align="left">
                        {file.lastModifiedTime ? new Date(file.lastModifiedTime).toLocaleString() : "-"}
                      </TableCell>
                      <TableCell align="left">{file.processState || "-"}</TableCell>
                      <TableCell align="left">
                        {file.storageSize?.toLocaleString() || "-"}
                      </TableCell>
                      {customAttributeNames.map((attrName) => (
                        <TableCell key={`${idx}-${attrName}`} align="left">
                          {getCustomAttributeValue(file, attrName)}
                        </TableCell>
                      ))}
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </TableContainer>

            <Box sx={{ mb: 2 }}>
              <Chip
                label={`Total: ${fileVersions.length} archivo(s)`}
                variant="outlined"
              />
              {customAttributeNames.length > 0 && (
                <Chip
                  label={`${customAttributeNames.length} atributo(s) personalizado(s)`}
                  variant="outlined"
                  sx={{ ml: 1 }}
                />
              )}
            </Box>
          </>
        )}
      </CardContent>
    </Card>
  );
};

export default MetadataGrid;
