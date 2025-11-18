import React, { useEffect, useState } from "react";
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
  Collapse,
  List,
  ListItem,
  ListItemButton,
  ListItemText,
} from "@mui/material";
import ExpandMoreIcon from "@mui/icons-material/ExpandMore";
import ChevronRightIcon from "@mui/icons-material/ChevronRight";
import FolderIcon from "@mui/icons-material/Folder";
import { accService, Project, Folder } from "../services/accService";

interface ProjectSelectorProps {
  accessToken: string;
  onProjectSelect: (projectId: string) => void;
  onFolderSelect: (folderId: string) => void;
}

export const ProjectSelector: React.FC<ProjectSelectorProps> = ({
  accessToken,
  onProjectSelect,
  onFolderSelect,
}) => {
  const [projects, setProjects] = useState<Project[]>([]);
  const [selectedProject, setSelectedProject] = useState<string>("");
  const [folders, setFolders] = useState<Folder[]>([]);
  const [expandedFolders, setExpandedFolders] = useState<Set<string>>(
    new Set()
  );
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Cargar proyectos al montar el componente
  useEffect(() => {
    const loadProjects = async () => {
      try {
        setLoading(true);
        accService.setAuthToken(accessToken);
        const data = await accService.getProjects();
        setProjects(data);
      } catch (err) {
        setError("Error cargando proyectos");
        console.error(err);
      } finally {
        setLoading(false);
      }
    };

    loadProjects();
  }, [accessToken]);

  // Cargar carpetas cuando se selecciona un proyecto
  useEffect(() => {
    const loadFolders = async () => {
      if (!selectedProject) return;

      try {
        setLoading(true);
        const data = await accService.getFolders(selectedProject);
        setFolders(data);
        onProjectSelect(selectedProject);
      } catch (err) {
        setError("Error cargando carpetas");
        console.error(err);
      } finally {
        setLoading(false);
      }
    };

    loadFolders();
  }, [selectedProject, onProjectSelect]);

  const handleProjectChange = (event: SelectChangeEvent) => {
    setSelectedProject(event.target.value);
    setFolders([]);
    setExpandedFolders(new Set());
  };

  const handleFolderToggle = (folderId: string) => {
    const newExpanded = new Set(expandedFolders);
    if (newExpanded.has(folderId)) {
      newExpanded.delete(folderId);
    } else {
      newExpanded.add(folderId);
    }
    setExpandedFolders(newExpanded);
  };

  const handleFolderSelect = (folderId: string) => {
    onFolderSelect(folderId);
  };

  const renderFolderTree = (folderList: Folder[], depth = 0) => {
    return (
      <List sx={{ pl: depth * 2 }}>
        {folderList.map((folder) => (
          <React.Fragment key={folder.id}>
            <ListItem disablePadding>
              <ListItemButton
                onClick={() => {
                  handleFolderToggle(folder.id);
                  handleFolderSelect(folder.id);
                }}
                sx={{ pl: 2 }}
              >
                <FolderIcon sx={{ mr: 1, fontSize: 20 }} />
                <ListItemText
                  primary={folder.name}
                  primaryTypographyProps={{ variant: "body2" }}
                />
              </ListItemButton>
            </ListItem>
            {folder.children && folder.children.length > 0 && (
              <Collapse
                in={expandedFolders.has(folder.id)}
                timeout="auto"
                unmountOnExit
              >
                {renderFolderTree(folder.children, depth + 1)}
              </Collapse>
            )}
          </React.Fragment>
        ))}
      </List>
    );
  };

  return (
    <Card>
      <CardHeader title="Seleccionar Proyecto y Carpeta" />
      <CardContent>
        {error && <Alert severity="error">{error}</Alert>}

        <FormControl fullWidth sx={{ mb: 3 }}>
          <InputLabel>Proyecto</InputLabel>
          <Select
            value={selectedProject}
            onChange={handleProjectChange}
            label="Proyecto"
            disabled={loading || projects.length === 0}
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

        {loading && <CircularProgress size={24} />}

        {selectedProject && folders.length > 0 && (
          <Box>
            <Typography variant="subtitle2" sx={{ mb: 1 }}>
              Carpetas:
            </Typography>
            {renderFolderTree(folders)}
          </Box>
        )}

        {selectedProject && folders.length === 0 && !loading && (
          <Alert severity="info">No hay carpetas en este proyecto</Alert>
        )}
      </CardContent>
    </Card>
  );
};

export default ProjectSelector;
