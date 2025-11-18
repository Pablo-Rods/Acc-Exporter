import axios, { AxiosInstance } from "axios";

const API_BASE = "http://localhost:5188/api";

export interface Project {
  id: string;
  name: string;
  status: string;
}

export interface Folder {
  id: string;
  name: string;
  parentId: string;
  children?: Folder[];
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

class AccService {
  private client: AxiosInstance;

  constructor() {
    this.client = axios.create({
      baseURL: API_BASE,
      headers: {
        "Content-Type": "application/json",
      },
    });
  }

  setAuthToken(token: string): void {
    this.client.defaults.headers.common["Authorization"] = `Bearer ${token}`;
  }

  clearAuthToken(): void {
    delete this.client.defaults.headers.common["Authorization"];
  }

  async getProjects(): Promise<Project[]> {
    try {
      const response = await this.client.get<Project[]>("/acc/projects");
      return response.data;
    } catch (error) {
      console.error("Error obteniendo proyectos:", error);
      throw error;
    }
  }

  async getFolders(
    projectId: string,
    parentFolderId?: string
  ): Promise<Folder[]> {
    try {
      const params = new URLSearchParams({
        projectId,
      });

      if (parentFolderId) {
        params.append("parentFolderId", parentFolderId);
      }

      const response = await this.client.get<Folder[]>(
        `/acc/folders?${params.toString()}`
      );
      return response.data;
    } catch (error) {
      console.error("Error obteniendo carpetas:", error);
      throw error;
    }
  }

  async getFiles(projectId: string, folderId: string): Promise<FileMetadata[]> {
    try {
      const response = await this.client.get<FileMetadata[]>(
        `/acc/files?projectId=${projectId}&folderId=${folderId}`
      );
      return response.data;
    } catch (error) {
      console.error("Error obteniendo archivos:", error);
      throw error;
    }
  }

  async getMetadataFields(
    projectId: string,
    folderId: string
  ): Promise<MetadataField[]> {
    try {
      const response = await this.client.get<MetadataField[]>(
        `/acc/metadata-fields?projectId=${projectId}&folderId=${folderId}`
      );
      return response.data;
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
      const response = await this.client.post(
        "/export/excel",
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
}

export const accService = new AccService();
