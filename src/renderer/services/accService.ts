import axios, { AxiosInstance, AxiosError } from "axios";
import { ipcService } from "./ipcService";

const API_BASE = "http://localhost:5188/api";

export interface Project {
  id: string;
  name: string;
  hubId: string;
}

export interface Folder {
  id: string;
  name: string;
  isFolder: boolean;
}

export interface FileMetadata {
  id: string;
  name: string;
  metadata: Record<string, unknown>;
}

export interface MetadataField {
  fieldName: string;
  displayName: string;
  dataType: string;
  isSelected: boolean;
}

export interface FolderTreeNode extends Folder {
  children?: FolderTreeNode[];
}

export interface CustomAttribute {
  id: number;
  type: string;
  name: string;
  value: string;
}

export interface FileVersionData {
  urn: string;
  itemUrn: string;
  name: string;
  title: string;
  createTime: string;
  createUserId: string;
  createUserName: string;
  lastModifiedTime: string;
  lastModifiedUserId: string;
  lastModifiedUserName: string;
  entityType: string;
  revisionNumber: number;
  processState: string;
  customAttributes: CustomAttribute[];
  storageUrn: string;
  storageSize: number;
}

export interface FileVersionResponse {
  results: FileVersionData[];
}

export interface ApiErrorResponse {
  error: string;
  details?: string;
}

class AccService {
  private client: AxiosInstance;

  constructor() {
    this.client = axios.create({
      baseURL: API_BASE,
      headers: {
        "Content-Type": "application/json",
      },
      timeout: 60000, // 60 segundos
    });

    // Interceptor para agregar automáticamente el token a cada request
    this.client.interceptors.request.use(
      async (config) => {
        try {
          const token = await ipcService.getToken("acc-token");
          if (token) {
            config.headers.Authorization = `Bearer ${token}`;
          }
        } catch (error) {
          console.error("Error obteniendo token:", error);
        }
        return config;
      },
      (error) => {
        return Promise.reject(error);
      }
    );

    // Interceptor para manejo de errores
    this.client.interceptors.response.use(
      (response) => response,
      (error: AxiosError<ApiErrorResponse>) => {
        const message =
          error.response?.data?.error ||
          error.response?.data?.details ||
          error.message ||
          "Error desconocido";
        console.error("API Error:", message);
        return Promise.reject(new Error(message));
      }
    );
  }

  async getProjects(): Promise<Project[]> {
    try {
      const response = await this.client.get<Project[]>("/acc/projects");
      return response.data || [];
    } catch (error) {
      console.error("Error obteniendo proyectos:", error);
      throw error;
    }
  }

  async getFolders(
    projectId: string,
    hubId: string,
    folderId?: string
  ): Promise<Folder[]> {
    try {
      if (!projectId || !hubId) {
        throw new Error("projectId y hubId son requeridos");
      }

      const params = new URLSearchParams({
        projectId,
        hubId,
      });

      if (folderId) {
        params.append("folderId", folderId);
      }

      const response = await this.client.get<Folder[]>(
        `/acc/folders?${params.toString()}`
      );
      return response.data || [];
    } catch (error) {
      console.error("Error obteniendo carpetas:", error);
      throw error;
    }
  }

  async getFiles(projectId: string, folderId: string): Promise<FileMetadata[]> {
    try {
      if (!projectId || !folderId) {
        throw new Error("projectId y folderId son requeridos");
      }

      const response = await this.client.get<FileMetadata[]>(
        `/acc/files?projectId=${projectId}&folderId=${folderId}`
      );
      return response.data || [];
    } catch (error) {
      console.error("Error obteniendo archivos:", error);
      throw error;
    }
  }

  async getFileMetadata(
    projectId: string,
    fileId: string
  ): Promise<Record<string, unknown>> {
    try {
      if (!projectId || !fileId) {
        throw new Error("projectId y fileId son requeridos");
      }

      const response = await this.client.get<Record<string, unknown>>(
        `/acc/file-metadata?projectId=${projectId}&fileId=${fileId}`
      );
      return response.data || {};
    } catch (error) {
      console.error("Error obteniendo metadatos del archivo:", error);
      throw error;
    }
  }

  async getMetadataFields(
    projectId: string,
    folderId: string
  ): Promise<MetadataField[]> {
    try {
      if (!projectId || !folderId) {
        throw new Error("projectId y folderId son requeridos");
      }

      const response = await this.client.get<MetadataField[]>(
        `/acc/metadata-fields?projectId=${projectId}&folderId=${folderId}`
      );
      return response.data || [];
    } catch (error) {
      console.error("Error obteniendo campos de metadatos:", error);
      throw error;
    }
  }

  async exportToExcel(
    files: Array<{ filename: string; metadata: Record<string, unknown> }>,
    selectedColumns: string[]
  ): Promise<Blob> {
    try {
      if (!files || files.length === 0) {
        throw new Error("No hay archivos para exportar");
      }

      if (!selectedColumns || selectedColumns.length === 0) {
        throw new Error("Debe seleccionar al menos una columna");
      }

      const response = await this.client.post(
        "/acc/export/excel",
        {
          files,
          selectedColumns,
        },
        {
          responseType: "blob",
        }
      );
      return response.data;
    } catch (error) {
      console.error("Error exportando a Excel:", error);
      throw error;
    }
  }

  async exportFilesVersionsToExcel(
    hubId: string,
    projectId: string,
    folderId: string,
    excludeAttributes: string[] = []
  ): Promise<Blob> {
    try {
      if (!hubId || !projectId || !folderId) {
        throw new Error("hubId, projectId y folderId son requeridos");
      }

      const response = await this.client.post(
        "/acc/files/versions/excel",
        {
          hubId,
          projectId,
          folderId,
          excludeAttributes,
        },
        {
          responseType: "blob",
        }
      );
      return response.data;
    } catch (error) {
      console.error("Error exportando versiones a Excel:", error);
      throw error;
    }
  }

  async getFileVersionsPreview(
    hubId: string,
    projectId: string,
    folderId: string
  ): Promise<FileVersionResponse> {
    try {
      if (!hubId || !projectId || !folderId) {
        throw new Error("hubId, projectId y folderId son requeridos");
      }

      const response = await this.client.post<FileVersionResponse>(
        "/acc/files/versions",
        {
          hubId,
          projectId,
          folderId,
        }
      );
      return response.data;
    } catch (error) {
      console.error("Error obteniendo preview de versiones:", error);
      throw error;
    }
  }
}

export const accService = new AccService();
