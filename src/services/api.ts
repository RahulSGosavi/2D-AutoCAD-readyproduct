// API Service for backend communication
import type { BlockDefinition } from '../data/blockCatalog';
const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:3001/api';

export interface ApiResponse<T> {
  data?: T;
  error?: string;
  errors?: Array<{ msg: string; param: string }>;
}

class ApiService {
  private getToken(): string | null {
    return localStorage.getItem('auth_token');
  }

  private async request<T>(
    endpoint: string,
    options: RequestInit = {}
  ): Promise<ApiResponse<T>> {
    const token = this.getToken();
    const headers: HeadersInit = {
      'Content-Type': 'application/json',
      ...options.headers,
    };

    if (token) {
      headers['Authorization'] = `Bearer ${token}`;
    }

    try {
      const response = await fetch(`${API_URL}${endpoint}`, {
        ...options,
        headers,
      });

      const data = await response.json();

      if (!response.ok) {
        return {
          error: data.error || `HTTP error! status: ${response.status}`,
          errors: data.errors,
        };
      }

      return { data };
    } catch (error) {
      return {
        error: error instanceof Error ? error.message : 'Network error',
      };
    }
  }

  // Auth endpoints
  async register(userData: {
    email: string;
    password: string;
    companyName: string;
    firstName?: string;
    lastName?: string;
  }) {
    const response = await this.request<{
      token: string;
      user: any;
      company: any;
    }>('/auth/register', {
      method: 'POST',
      body: JSON.stringify(userData),
    });

    if (response.data?.token) {
      localStorage.setItem('auth_token', response.data.token);
      localStorage.setItem('user', JSON.stringify(response.data.user));
      localStorage.setItem('company', JSON.stringify(response.data.company));
    }

    return response;
  }

  async login(email: string, password: string) {
    const response = await this.request<{
      token: string;
      user: any;
      company: any;
    }>('/auth/login', {
      method: 'POST',
      body: JSON.stringify({ email, password }),
    });

    if (response.data?.token) {
      localStorage.setItem('auth_token', response.data.token);
      localStorage.setItem('user', JSON.stringify(response.data.user));
      localStorage.setItem('company', JSON.stringify(response.data.company));
    }

    return response;
  }

  logout() {
    localStorage.removeItem('auth_token');
    localStorage.removeItem('user');
    localStorage.removeItem('company');
  }

  isAuthenticated(): boolean {
    return !!this.getToken();
  }

  // Project endpoints
  async getProjects() {
    return this.request<{ projects: any[] }>('/projects');
  }

  async getProject(id: string) {
    return this.request<{ project: any }>(`/projects/${id}`);
  }

  async createProject(projectData: {
    name: string;
    description?: string;
    data?: any;
  }) {
    const response = await this.request<{ project: any }>('/projects', {
      method: 'POST',
      body: JSON.stringify(projectData),
    });
    
    // Log for debugging
    if (response.error) {
      console.error('Create project error:', response.error, response.errors);
    }
    
    return response;
  }

  async updateProject(id: string, projectData: { name?: string; description?: string }) {
    return this.request<{ project: any }>(`/projects/${id}`, {
      method: 'PUT',
      body: JSON.stringify(projectData),
    });
  }

  async saveProjectData(id: string, data: any) {
    return this.request<{ message: string; version: number }>(`/projects/${id}/data`, {
      method: 'POST',
      body: JSON.stringify({ data }),
    });
  }

  async deleteProject(id: string) {
    return this.request<{ message: string }>(`/projects/${id}`, {
      method: 'DELETE',
    });
  }

  async createShareToken(payload: Record<string, unknown>) {
    return this.request<{ token: string }>('/projects/share', {
      method: 'POST',
      body: JSON.stringify(payload),
    });
  }

  async getCatalogBlocks() {
    return this.request<{ blocks: BlockDefinition[] }>('/catalog/blocks');
  }

  async createCatalogBlock(block: BlockDefinition) {
    return this.request<{ block: BlockDefinition }>('/catalog/blocks', {
      method: 'POST',
      body: JSON.stringify(block),
    });
  }
}

export const apiService = new ApiService();

