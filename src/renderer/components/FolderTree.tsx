import React, { useState } from "react";
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
  const [expanded, setExpanded] = useState<Set<string>>(new Set());

  const handleToggle = (folderId: string) => {
    const newExpanded = new Set(expanded);
    if (newExpanded.has(folderId)) {
      newExpanded.delete(folderId);
    } else {
      newExpanded.add(folderId);
    }
    setExpanded(newExpanded);
  };

  const renderFolder = (folder: FolderNode, depth = 0) => {
    const isExpanded = expanded.has(folder.id);
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
  };

  return (
    <Box>
      {folders.length === 0 ? (
        <Typography color="textSecondary" variant="body2">
          No hay carpetas disponibles
        </Typography>
      ) : (
        <List>{folders.map((folder) => renderFolder(folder))}</List>
      )}
    </Box>
  );
};

export default FolderTree;
