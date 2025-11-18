import React, { useState } from "react";
import { Box, Grid, Button, AppBar, Toolbar, Typography } from "@mui/material";
import ProjectSelector from "../components/ProjectSelector";
import MetadataGrid from "../components/MetadataGrid";

interface ExporterPageProps {
  accessToken: string;
  onLogout: () => void;
}

const ExporterPage: React.FC<ExporterPageProps> = ({
  accessToken,
  onLogout,
}) => {
  const [selectedFolderId, setSelectedFolderId] = useState<string | null>(null);
  const [selectedProjectId, setSelectedProjectId] = useState<string | null>(
    null
  );

  return (
    <>
      <AppBar position="static">
        <Toolbar>
          <Typography variant="h6" sx={{ flexGrow: 1 }}>
            ACC Metadata Exporter
          </Typography>
          <Button color="inherit" onClick={onLogout}>
            Cerrar sesión
          </Button>
        </Toolbar>
      </AppBar>

      <Box sx={{ p: 3 }}>
        <Grid container spacing={3}>
          <Grid item xs={12} md={4}>
            <ProjectSelector
              accessToken={accessToken}
              onProjectSelect={setSelectedProjectId}
              onFolderSelect={setSelectedFolderId}
            />
          </Grid>

          <Grid item xs={12} md={8}>
            {selectedFolderId && selectedProjectId ? (
              <MetadataGrid
                accessToken={accessToken}
                projectId={selectedProjectId}
                folderId={selectedFolderId}
              />
            ) : (
              <Typography color="textSecondary">
                Selecciona un proyecto y una carpeta para comenzar
              </Typography>
            )}
          </Grid>
        </Grid>
      </Box>
    </>
  );
};

export default ExporterPage;
