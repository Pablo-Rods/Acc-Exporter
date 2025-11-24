import React, { useEffect, useState, useCallback, useRef } from "react";
import {
  Card,
  CardContent,
  CardHeader,
  CircularProgress,
  FormControl,
  InputLabel,
  MenuItem,
  Select,
  SelectChangeEvent,
  Typography,
  Box,
  Alert,
  AlertColor,
} from "@mui/material";
import { accService, Project, FolderTreeNode } from "../services/accService";
import { FolderTree, FolderNode } from "./FolderTree";

interface ProjectSelectorProps {
  accessToken: string;
  onProjectSelect: (projectData: { projectId: string; hubId: string }) => void;
  onFolderSelect: (folderId: string, folderName: string) => void;
}

interface AlertState {
  message: string;
  severity: AlertColor;
}

export const ProjectSelector: React.FC<ProjectSelectorProps> = ({
  accessToken,
  onProjectSelect,
  onFolderSelect,
}) => {
  const [projects, setProjects] = useState<Project[]>([]);
  const [selectedProject, setSelectedProject] = useState<Project | null>(null);
  const [folderTree, setFolderTree] = useState<FolderNode[]>([]);
  const [loadingProjects, setLoadingProjects] = useState(false);
  const [loadingTree, setLoadingTree] = useState(false);
  const [alert, setAlert] = useState<AlertState | null>(null);

  // Cache de árboles por projectId
  const treeCache = useRef<Map<string, FolderNode[]>>(new Map());

  // Cargar proyectos al montar el componente
  useEffect(() => {
    const loadProjects = async () => {
      try {
        setLoadingProjects(true);
        setAlert(null);

        if (!accessToken) {
          throw new Error("Token de acceso no disponible");
        }

        const data = await accService.getProjects();

        if (!data || data.length === 0) {
          setAlert({
            message: "No hay proyectos disponibles",
            severity: "info",
          });
        }

        setProjects(data);
      } catch (err) {
        const errorMessage =
          err instanceof Error ? err.message : "Error desconocido";
        setAlert({
          message: `Error cargando proyectos: ${errorMessage}`,
          severity: "error",
        });
        console.error(err);
      } finally {
        setLoadingProjects(false);
      }
    };

    loadProjects();
  }, [accessToken]);

  // Función recursiva para cargar todo el árbol de carpetas
  const loadFolderTreeRecursively = useCallback(
    async (
      project: Project,
      folderId?: string
    ): Promise<FolderTreeNode[]> => {
      const folders = await accService.getFolders(
        project.id,
        project.hubId,
        folderId
      );

      // Procesar en paralelo todas las subcarpetas
      const nodesWithChildren = await Promise.all(
        folders.map(async (folder) => {
          if (folder.isFolder) {
            // Cargar recursivamente los hijos de esta carpeta
            const children = await loadFolderTreeRecursively(
              project,
              folder.id
            );
            return {
              ...folder,
              children: children.length > 0 ? children : undefined,
            };
          } else {
            // Es un archivo, no tiene hijos
            return folder;
          }
        })
      );

      return nodesWithChildren;
    },
    []
  );

  // Convertir FolderTreeNode a FolderNode (formato del componente FolderTree)
  const convertToFolderNode = useCallback(
    (node: FolderTreeNode): FolderNode => {
      return {
        id: node.id,
        name: node.name,
        children: node.children?.map(convertToFolderNode),
      };
    },
    []
  );

  const handleProjectChange = async (event: SelectChangeEvent) => {
    const projectId = event.target.value;
    const project = projects.find((p) => p.id === projectId);

    if (!project) return;

    setSelectedProject(project);
    setAlert(null);
    onProjectSelect({ projectId: project.id, hubId: project.hubId });

    // Verificar si ya tenemos el árbol en cache
    const cachedTree = treeCache.current.get(project.id);
    if (cachedTree) {
      setFolderTree(cachedTree);
      return;
    }

    // Cargar árbol completo recursivamente
    try {
      setLoadingTree(true);
      const tree = await loadFolderTreeRecursively(project);

      // Convertir al formato FolderNode (incluye carpetas y archivos)
      const folderNodes = tree.map(convertToFolderNode);

      setFolderTree(folderNodes);

      // Guardar en cache
      treeCache.current.set(project.id, folderNodes);
    } catch (err) {
      const errorMessage =
        err instanceof Error ? err.message : "Error desconocido";
      setAlert({
        message: `Error cargando árbol de carpetas: ${errorMessage}`,
        severity: "error",
      });
      console.error(err);
    } finally {
      setLoadingTree(false);
    }
  };

  const handleFolderSelect = (folderId: string) => {
    // Buscar el nombre de la carpeta en el árbol
    const findFolderName = (nodes: FolderNode[], id: string): string | null => {
      for (const node of nodes) {
        if (node.id === id) {
          return node.name;
        }
        if (node.children) {
          const found = findFolderName(node.children, id);
          if (found) return found;
        }
      }
      return null;
    };

    const folderName = findFolderName(folderTree, folderId) || folderId;
    onFolderSelect(folderId, folderName);
  };

  return (
    <Card>
      <CardHeader title="Seleccionar Proyecto y Carpeta" />
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

        <FormControl fullWidth sx={{ mb: 3 }} disabled={loadingProjects}>
          <InputLabel>Proyecto</InputLabel>
          <Select
            value={selectedProject?.id || ""}
            onChange={handleProjectChange}
            label="Proyecto"
            disabled={loadingProjects || projects.length === 0}
          >
            <MenuItem value="">
              <em>Selecciona un proyecto</em>
            </MenuItem>
            {projects.map((project) => (
              <MenuItem key={project.id} value={project.id}>
                {project.name}
              </MenuItem>
            ))}
          </Select>
        </FormControl>

        {loadingTree && (
          <Box sx={{ display: "flex", alignItems: "center", gap: 2, mb: 2 }}>
            <CircularProgress size={24} />
            <Typography variant="body2">
              Cargando árbol de carpetas...
            </Typography>
          </Box>
        )}

        {selectedProject && folderTree.length > 0 && !loadingTree && (
          <Box>
            <Typography variant="subtitle2" sx={{ mb: 2, fontWeight: 600 }}>
              Carpetas y archivos del proyecto:
            </Typography>
            <FolderTree folders={folderTree} onSelect={handleFolderSelect} />
          </Box>
        )}

        {selectedProject && folderTree.length === 0 && !loadingTree && (
          <Alert severity="info">
            No hay carpetas en este proyecto
          </Alert>
        )}
      </CardContent>
    </Card>
  );
};

export default ProjectSelector;
