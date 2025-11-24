import axios, { AxiosInstance, AxiosError } from "axios";
import { ipcService } from "./ipcService";

const API_BASE = "http://172.23.6.174:30025/api";

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

  /**
   * Obtiene todos los proyectos disponibles
   * Endpoint: GET /api/Project/all
   */
  async getProjects(): Promise<Project[]> {
    try {
      const response = await this.client.get<Project[]>("/Project/all");
      return response.data || [];
    } catch (error) {
      console.error("Error obteniendo proyectos:", error);
      throw error;
    }
  }

  /**
   * Obtiene la estructura de carpetas de un proyecto
   * Endpoint: GET /api/Project/{projectId}/structure
   */
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
        hubId,
      });

      if (folderId) {
        params.append("folderId", folderId);
      }

      const response = await this.client.get<Folder[]>(
        `/Project/${projectId}/structure?${params.toString()}`
      );
      return response.data || [];
    } catch (error) {
      console.error("Error obteniendo carpetas:", error);
      throw error;
    }
  }

  /**
   * Obtiene las versiones de archivos para preview
   * Endpoint: POST /api/acc/files/versions
   */
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

  /**
   * Exporta las versiones de archivos a Excel
   * Endpoint: POST /api/acc/files/versions/excel
   */
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
}

export const accService = new AccService();
