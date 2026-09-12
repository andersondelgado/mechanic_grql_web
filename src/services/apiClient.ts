/**
 * Cliente HTTP Nativo Centralizado (Fetch API Wrapper)
 * Reemplazo directo y liviano de Axios con cero dependencias externas.
 * 
 * Características:
 *  - Soporte nativo de baseURL y timeouts con AbortController.
 *  - Interceptores para inyección de credenciales (x-grql-auth, Authorization Bearer, X-Grql-Lambda).
 *  - Validación automática de response.ok y extracción tipada de respuestas JSON.
 *  - Manejo global de expiración de sesión (código 401).
 */

import { BASE_URL, API_KEY } from '../api/config';
import type { WorkflowRequest } from '../api/workflow.types';

export interface RequestOptions extends RequestInit {
  timeout?: number;
  skipAuth?: boolean;
}

export interface ApiResponse<T = any> {
  data: T;
  status: number;
  statusText: string;
  ok: boolean;
  headers: Headers;
}

export class HttpError extends Error {
  constructor(
    public status: number,
    public statusText: string,
    public data: any
  ) {
    super(`HTTP ${status} ${statusText}`);
    this.name = 'HttpError';
  }
}

export class NativeHttpClient {
  private baseURL: string;
  private defaultTimeout: number;

  constructor(baseURL: string = BASE_URL, defaultTimeout: number = 30000) {
    this.baseURL = baseURL.replace(/\/$/, '');
    this.defaultTimeout = defaultTimeout;
  }

  /**
   * Interceptor de petición para headers y tokens dinámicos
   */
  private async prepareHeaders(options: RequestOptions = {}): Promise<Headers> {
    const headers = new Headers(options.headers || {});

    if (!headers.has('Content-Type') && !(options.body instanceof FormData)) {
      headers.set('Content-Type', 'application/json');
    }

    // Inyectar API Key maestra de gRQL
    if (API_KEY && !headers.has('x-grql-auth')) {
      headers.set('x-grql-auth', API_KEY);
    }

    // Inyectar tokens de sesión desde localStorage (si no se omite auth)
    if (!options.skipAuth && typeof window !== 'undefined') {
      const token = localStorage.getItem('token');
      if (token && !headers.has('Authorization')) {
        headers.set('Authorization', `Bearer ${token}`);
      }

      const lambdaToken = localStorage.getItem('lambdaToken');
      if (lambdaToken && !headers.has('X-Grql-Lambda')) {
        headers.set('X-Grql-Lambda', lambdaToken);
      }
    }

    return headers;
  }

  /**
   * Ejecuta petición fetch con control de timeout por AbortController
   */
  async request<T = any>(url: string, options: RequestOptions = {}): Promise<ApiResponse<T>> {
    const fullUrl = url.startsWith('http://') || url.startsWith('https://')
      ? url
      : `${this.baseURL}${url.startsWith('/') ? url : `/${url}`}`;

    const headers = await this.prepareHeaders(options);
    const timeout = options.timeout ?? this.defaultTimeout;

    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), timeout);

    try {
      const response = await fetch(fullUrl, {
        ...options,
        headers,
        signal: controller.signal,
      });

      clearTimeout(timeoutId);

      // Deserialización segura de JSON
      let data: any = null;
      const contentType = response.headers.get('content-type') || '';
      if (contentType.includes('application/json')) {
        try {
          data = await response.json();
        } catch {
          data = null;
        }
      } else {
        data = await response.text();
      }

      // Interceptor de error 401: Sesión expirada
      if (response.status === 401 && typeof window !== 'undefined') {
        localStorage.removeItem('token');
        localStorage.removeItem('lambdaToken');
        if (window.location.hash !== '#/login') {
          window.location.hash = '#/login';
        }
      }

      // Validación de response.ok
      if (!response.ok) {
        throw new HttpError(response.status, response.statusText, data);
      }

      return {
        data,
        status: response.status,
        statusText: response.statusText,
        ok: response.ok,
        headers: response.headers,
      };
    } catch (err: any) {
      clearTimeout(timeoutId);
      if (err.name === 'AbortError') {
        throw new HttpError(408, 'Request Timeout', { message: `Petición abortada por timeout (${timeout}ms)` });
      }
      throw err;
    }
  }

  async get<T = any>(url: string, options?: RequestOptions): Promise<ApiResponse<T>> {
    return this.request<T>(url, { ...options, method: 'GET' });
  }

  async post<T = any>(url: string, body?: any, options?: RequestOptions): Promise<ApiResponse<T>> {
    const payload = body instanceof FormData ? body : (body !== undefined ? JSON.stringify(body) : undefined);
    return this.request<T>(url, { ...options, method: 'POST', body: payload });
  }

  async put<T = any>(url: string, body?: any, options?: RequestOptions): Promise<ApiResponse<T>> {
    const payload = body instanceof FormData ? body : (body !== undefined ? JSON.stringify(body) : undefined);
    return this.request<T>(url, { ...options, method: 'PUT', body: payload });
  }

  async delete<T = any>(url: string, options?: RequestOptions): Promise<ApiResponse<T>> {
    return this.request<T>(url, { ...options, method: 'DELETE' });
  }

  async patch<T = any>(url: string, body?: any, options?: RequestOptions): Promise<ApiResponse<T>> {
    const payload = body instanceof FormData ? body : (body !== undefined ? JSON.stringify(body) : undefined);
    return this.request<T>(url, { ...options, method: 'PATCH', body: payload });
  }
}

export const apiClient = new NativeHttpClient(BASE_URL);
export default apiClient;
