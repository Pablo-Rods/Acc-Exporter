import React, { useState, useMemo, useCallback } from "react";
import {
  Box,
  List,
  ListItem,
  ListItemButton,
  ListItemIcon,
  ListItemText,
  Collapse,
  Typography,
} from "@mui/material";
import ExpandMoreIcon from "@mui/icons-material/ExpandMore";
import ChevronRightIcon from "@mui/icons-material/ChevronRight";
import FolderIcon from "@mui/icons-material/Folder";
import FolderOpenIcon from "@mui/icons-material/FolderOpen";

export interface FolderNode {
  id: string;
  name: string;
  children?: FolderNode[];
}

interface FolderTreeProps {
  folders: FolderNode[];
  onSelect: (folderId: string) => void;
}

export const FolderTree: React.FC<FolderTreeProps> = ({
  folders,
  onSelect,
}) => {
  const [expandedIds, setExpandedIds] = useState<string[]>([]);

  const expandedSet = useMemo(() => new Set(expandedIds), [expandedIds]);

  const handleToggle = useCallback((folderId: string) => {
    setExpandedIds((prev) => {
      if (prev.includes(folderId)) {
        return prev.filter((id) => id !== folderId);
      } else {
        return [...prev, folderId];
      }
    });
  }, []);

  const renderFolder = useCallback(
    (folder: FolderNode, depth = 0): React.ReactNode => {
      const isExpanded = expandedSet.has(folder.id);
      const hasChildren = folder.children && folder.children.length > 0;

      return (
        <Box key={folder.id}>
          <ListItem disablePadding sx={{ pl: depth * 2 }}>
            <ListItemButton
              onClick={() => {
                if (hasChildren) {
                  handleToggle(folder.id);
                }
                onSelect(folder.id);
              }}
            >
              <ListItemIcon sx={{ minWidth: 40 }}>
                {hasChildren ? (
                  isExpanded ? (
                    <FolderOpenIcon fontSize="small" />
                  ) : (
                    <FolderIcon fontSize="small" />
                  )
                ) : (
                  <FolderIcon fontSize="small" sx={{ opacity: 0.5 }} />
                )}
              </ListItemIcon>
              <ListItemText
                primary={folder.name}
                primaryTypographyProps={{ variant: "body2" }}
              />
              {hasChildren && (
                <Box sx={{ display: "flex", alignItems: "center" }}>
                  {isExpanded ? <ExpandMoreIcon /> : <ChevronRightIcon />}
                </Box>
              )}
            </ListItemButton>
          </ListItem>

          {hasChildren && (
            <Collapse in={isExpanded} timeout="auto" unmountOnExit>
              <List component="div" disablePadding>
                {folder.children!.map((child) => renderFolder(child, depth + 1))}
              </List>
            </Collapse>
          )}
        </Box>
      );
    },
    [expandedSet, handleToggle, onSelect]
  );

  const renderedFolders = useMemo(
    () => folders.map((folder) => renderFolder(folder)),
    [folders, renderFolder]
  );

  return (
    <Box>
      {folders.length === 0 ? (
        <Typography color="textSecondary" variant="body2">
          No hay carpetas disponibles
        </Typography>
      ) : (
        <List>{renderedFolders}</List>
      )}
    </Box>
  );
};

export default FolderTree;
