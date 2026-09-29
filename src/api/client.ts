/**
 * Capa HTTP nativa para comunicarse con las lambdas gRQL usando fetch().
 *  - Cero dependencias externas (cliente HTTP nativo).
 *  - Pipeline de interceptores de Request y Response tipados.
 *  - Soporte de timeout mediante AbortController.
 *  - Manejo global de errores HTTP (validando response.ok y capturando 4xx/5xx).
 *  - Sesión expirada: redirección automática a /login ante respuestas 401.
 *  - Autenticación: Lambda token (X-Grql-Lambda) + API Key (x-grql-auth). No usa Authorization: Bearer.
 *  - Flag 'skipAuth' para evitar sobreescritura de permisos en endpoints maestros/estadísticas.
 */
import {
  WorkflowRequest,
  WorkflowResponse,
  WorkflowQuery,
  buildQueryRequest,
  buildMutationRequest,
  extractData,
  extractPagination,
} from './workflow.types';
import { BASE_URL, DB_LAMBDAS, DB_NAME, API_KEY, LAMBDA_FORM_ENDPOINT, lambdaDecode } from './config';

// ─── Interfaces y Tipos del Cliente HTTP ─────────────────────────────────────
export interface RequestOptions extends Omit<RequestInit, 'body'> {
  timeout?: number;
  skipAuth?: boolean;
  body?: any;
}

export interface ApiResponse<T = any> {
  data: T;
  status: number;
  ok: boolean;
  statusText: string;
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

// ─── Helpers de Expiración de Sesión y JWT ──────────────────────────────────
export function isJwtExpired(data: any, status?: number): boolean {
  if (status === 401) return true;
  if (!data) return false;

  if (typeof data === 'string') {
    const lower = data.toLowerCase();
    return lower.includes('jwt expired') || lower.includes('token expired');
  }

  if (typeof data === 'object') {
    if (data.error) {
      if (typeof data.error === 'string' && (data.error.toLowerCase().includes('jwt expired') || data.error.toLowerCase().includes('token expired'))) {
        return true;
      }
      if (typeof data.error?.message === 'string' && (data.error.message.toLowerCase().includes('jwt expired') || data.error.message.toLowerCase().includes('token expired'))) {
        return true;
      }
    }
    if (typeof data.message === 'string' && (data.message.toLowerCase().includes('jwt expired') || data.message.toLowerCase().includes('token expired'))) {
      return true;
    }
    if (Array.isArray(data.errors)) {
      for (const err of data.errors) {
        const msg = typeof err === 'string' ? err : err?.message;
        if (typeof msg === 'string' && (msg.toLowerCase().includes('jwt expired') || msg.toLowerCase().includes('token expired'))) {
          return true;
        }
      }
    }
    const flowError = data?.request?.flows?.[0]?.steps?.[0]?.actions?.[0]?.result?.error;
    if (flowError) {
      const msg = typeof flowError === 'string' ? flowError : flowError.message;
      if (typeof msg === 'string' && (msg.toLowerCase().includes('jwt expired') || msg.toLowerCase().includes('token expired'))) {
        return true;
      }
    }
  }

  return false;
}

export function handleSessionExpired(): void {
  if (typeof window !== 'undefined') {
    localStorage.removeItem('token');
    localStorage.removeItem('lambdaToken');
    localStorage.removeItem('user');
    localStorage.removeItem('owner');
    sessionStorage.removeItem('token');
    sessionStorage.removeItem('lambdaToken');
    sessionStorage.removeItem('user');

    window.dispatchEvent(new CustomEvent('auth:expired'));

    if (window.location.hash !== '#/login') {
      window.location.hash = '#/login';
    }
  }
}

// ─── Cliente HTTP Nativo (Fetch Wrapper con Interceptores) ───────────────────
export class HttpClient {
  private baseURL: string;

  constructor(baseURL: string = '') {
    this.baseURL = baseURL;
  }

  /**
   * Interceptor de petición: Inyección de headers, API Keys, Lambda token y timeout.
   */
  private async applyRequestInterceptors(
    url: string,
    options: RequestOptions
  ): Promise<{ fullUrl: string; finalOptions: RequestInit; timeoutId: any }> {
    const fullUrl = url.startsWith('http') ? url : `${this.baseURL}${url}`;

    // Configuración de Timeout con AbortController nativo
    const controller = new AbortController();
    const timeout = options.timeout ?? 30_000;
    const timeoutId = setTimeout(() => controller.abort(), timeout);

    if (options.signal) {
      options.signal.addEventListener('abort', () => controller.abort());
    }

    const headers = new Headers(options.headers || {});

    // Header Content-Type por defecto
    if (!headers.has('Content-Type') && !(options.body instanceof FormData)) {
      headers.set('Content-Type', 'application/json');
    }

    // Inyección obligatoria de cabeceras gRQL
    // 1. Master API Key (x-grql-auth)
    if (API_KEY && !headers.has('x-grql-auth')) {
      headers.set('x-grql-auth', API_KEY);
    }

    // 2. Lambda Token (X-Grql-Lambda)
    const lambdaToken = localStorage.getItem('lambdaToken') || localStorage.getItem('token');
    if (lambdaToken && !headers.has('X-Grql-Lambda')) {
      headers.set('X-Grql-Lambda', lambdaToken);
    }

    // Serialización del body si no es ya string ni FormData
    let serializedBody: BodyInit | null | undefined = undefined;
    if (options.body !== undefined && options.body !== null) {
      if (typeof options.body === 'string' || options.body instanceof FormData || options.body instanceof Blob) {
        serializedBody = options.body;
      } else {
        serializedBody = JSON.stringify(options.body);
      }
    }

    const finalOptions: RequestInit = {
      ...options,
      headers,
      body: serializedBody,
      signal: controller.signal,
    };

    return { fullUrl, finalOptions, timeoutId };
  }

  /**
   * Interceptor de respuesta: Deserialización de JSON, manejo global de 401, jwt expired y errores HTTP.
   */
  private async applyResponseInterceptors<T>(response: Response): Promise<ApiResponse<T>> {
    // Deserialización del cuerpo
    let data: any = null;
    const contentType = response.headers.get('content-type') || '';
    if (contentType.includes('application/json')) {
      try {
        data = await response.json();
      } catch {
        data = null;
      }
    } else {
      try {
        data = await response.text();
      } catch {
        data = null;
      }
    }

    // Intercepción de autenticación: Si el servidor retorna 401 o la respuesta contiene jwt expired
    if (response.status === 401 || isJwtExpired(data, response.status)) {
      handleSessionExpired();
      throw new HttpError(401, 'Unauthorized - JWT Expired', data);
    }

    // Validación de status code (2xx)
    if (!response.ok) {
      throw new HttpError(response.status, response.statusText, data);
    }

    return {
      data: data as T,
      status: response.status,
      ok: response.ok,
      statusText: response.statusText,
      headers: response.headers,
    };
  }

  /**
   * Ejecuta una petición HTTP genérica a través del pipeline.
   */
  public async request<T = any>(url: string, options: RequestOptions = {}): Promise<ApiResponse<T>> {
    const { fullUrl, finalOptions, timeoutId } = await this.applyRequestInterceptors(url, options);

    try {
      const response = await fetch(fullUrl, finalOptions);
      return await this.applyResponseInterceptors<T>(response);
    } catch (error: any) {
      if (error.name === 'AbortError') {
        throw new Error(`Timeout de red superado (${options.timeout ?? 30000}ms) en ${url}`);
      }
      throw error;
    } finally {
      clearTimeout(timeoutId);
    }
  }

  public get<T = any>(url: string, options?: RequestOptions): Promise<ApiResponse<T>> {
    return this.request<T>(url, { ...options, method: 'GET' });
  }

  public post<T = any>(url: string, body?: any, options?: RequestOptions): Promise<ApiResponse<T>> {
    return this.request<T>(url, { ...options, method: 'POST', body });
  }

  public put<T = any>(url: string, body?: any, options?: RequestOptions): Promise<ApiResponse<T>> {
    return this.request<T>(url, { ...options, method: 'PUT', body });
  }

  public delete<T = any>(url: string, options?: RequestOptions): Promise<ApiResponse<T>> {
    return this.request<T>(url, { ...options, method: 'DELETE' });
  }
}

// Instancia singleton por defecto
export const apiClient = new HttpClient(BASE_URL);

// ─── Core: workflowJson ───────────────────────────────────────────────────────
/**
 * Envía un WorkflowRequest a la lambda indicada.
 * Retorna directamente el payload deserializado.
 */
export async function workflowJson<T = any>(
  request: WorkflowRequest | Record<string, any>,
  lambdaName: string = 'workflow_taller_js',
  workspace: string = 'lambda',
  options?: RequestOptions
): Promise<T> {
  const lambdaId = lambdaDecode(lambdaName);
  if (!lambdaId) throw new Error(`Lambda no encontrada: ${lambdaName}`);

  const url = `/api/secure-rQL/lambdas-json-run-node?db=${DB_LAMBDAS}&table=${workspace}&id=${lambdaId}&format=json`;
  const res = await apiClient.post<T>(url, request, options);
  return res.data;
}

// ─── Core: workflowFormData (subida binaria + workflow) ──────────────────────
/**
 * Bucket request para que el servidor suba el archivo binario al bucket
 * antes de ejecutar la lambda (espejo de Lusiana `environment.bucketRequest`).
 */
export function buildBucketRequest(): Record<string, unknown> {
  return {
    db: DB_NAME,
    storage: 'bucket',
    name: 'bucket',
    headerKey: 'X-Grql-Auth',
    headerValue: API_KEY,
    urlBucket: `${BASE_URL}/api/secure-rQL/put-to-bucket`,
  };
}

export interface FormDataWorkflowOptions {
  lambdaName?: string;
  workspace?: string;
  /** Agrega `&async=true` (la lambda responde en background). */
  async?: boolean;
  /** Nombre del archivo en el form-data (por defecto el del File). */
  fileName?: string;
  timeout?: number;
  skipAuth?: boolean;
  signal?: AbortSignal;
}

/**
 * Envía un workflow junto con un archivo binario (multipart/form-data).
 *
 * El servidor sube el archivo al bucket y entrega `fileMeta` / `fileMetas` a la
 * lambda (`injectFileMeta` inyecta `attachment_file`, `attachmentId` y
 * `fileMetas` en el body de cada step), evitando el envío de base64 en el JSON.
 */
export async function workflowFormData<T = any>(
  request: WorkflowRequest | Record<string, any>,
  file: Blob,
  options: FormDataWorkflowOptions = {}
): Promise<T> {
  const lambdaName = options.lambdaName || 'workflow_taller_js';
  const workspace = options.workspace || 'lambda';
  const lambdaId = lambdaDecode(lambdaName);
  if (!lambdaId) throw new Error(`Lambda no encontrada: ${lambdaName}`);

  // El form field `request` lleva el objeto `{ flows: [...] }` (sin el wrapper `request`)
  const payload = (request as any)?.request ?? request;

  const formData = new FormData();
  formData.append('bucket_request', JSON.stringify(buildBucketRequest()));
  formData.append('files', file, options.fileName || (file instanceof File ? file.name : 'archivo.bin'));
  formData.append('request', JSON.stringify(payload));

  let query = `db=${DB_LAMBDAS}&table=${workspace}&id=${lambdaId}&format=json`;
  if (options.async) query += '&async=true';

  const res = await apiClient.post<T>(`${LAMBDA_FORM_ENDPOINT}?${query}`, formData, {
    timeout: options.timeout,
    skipAuth: options.skipAuth,
    signal: options.signal,
  });
  return res.data;
}

// ─── Helpers CRUD de alto nivel ───────────────────────────────────────────────
const WORKFLOW_NAME = 'workflow_taller';

export async function getEntity<T = any>(
  table: string,
  query?: WorkflowQuery,
  options?: RequestOptions
): Promise<T[]> {
  const request = buildQueryRequest(WORKFLOW_NAME, table, 'get', {
    pagination: { page: 1, size: 100 },
    ...query,
  });
  const response = await workflowJson<WorkflowResponse<T[]>>(request, 'workflow_taller_js', 'lambda', options);
  const data = extractData<T[]>(response);
  return Array.isArray(data) ? data : [];
}

export async function getPaginatedEntity<T = any>(
  table: string,
  query?: WorkflowQuery,
  options?: RequestOptions
): Promise<{ data: T[]; meta: any }> {
  const request = buildQueryRequest(WORKFLOW_NAME, table, 'get', {
    pagination: { page: 1, size: 10 },
    ...query,
  });
  const response = await workflowJson<WorkflowResponse<T[]>>(request, 'workflow_taller_js', 'lambda', options);
  const data = extractData<T[]>(response);
  return { data: Array.isArray(data) ? data : [], meta: extractPagination(response) };
}

export async function getEntityById<T = any>(
  table: string,
  id: string,
  options?: RequestOptions
): Promise<T | null> {
  const request = buildQueryRequest(WORKFLOW_NAME, table, 'get', {
    filter: { id },
  });
  const response = await workflowJson<WorkflowResponse<T[]>>(request, 'workflow_taller_js', 'lambda', options);
  const data = extractData<T[]>(response);
  return data?.[0] ?? null;
}

export async function getEntitiesByFilter<T = any>(
  table: string,
  arrayFilter: Array<Record<string, unknown>>,
  options?: RequestOptions
): Promise<T[]> {
  const request = buildQueryRequest(WORKFLOW_NAME, table, 'dataFilter', {
    arrayFilter,
  });
  const response = await workflowJson<WorkflowResponse<T[]>>(request, 'workflow_taller_js', 'lambda', options);
  return extractData<T[]>(response) ?? [];
}

export async function createEntity<T = any>(
  table: string,
  data: Record<string, unknown>,
  options?: RequestOptions
): Promise<T | null> {
  const request = buildMutationRequest(WORKFLOW_NAME, table, 'create', { body: data });
  const response = await workflowJson<WorkflowResponse<T>>(request, 'workflow_taller_js', 'lambda', options);
  return extractData<T>(response);
}

export async function updateEntity<T = any>(
  table: string,
  id: string,
  data: Record<string, unknown>,
  options?: RequestOptions
): Promise<T | null> {
  const request = buildMutationRequest(WORKFLOW_NAME, table, 'putById', {
    body: { ...data, id },
    path: { id },
  });
  const response = await workflowJson<WorkflowResponse<T>>(request, 'workflow_taller_js', 'lambda', options);
  return extractData<T>(response);
}

export async function deleteEntity(
  table: string,
  id: string,
  options?: RequestOptions
): Promise<void> {
  const request = buildMutationRequest(WORKFLOW_NAME, table, 'deleteById', {
    path: { id },
  });
  await workflowJson(request, 'workflow_taller_js', 'lambda', options);
}

// ─── Funciones especiales (video + IA) ───────────────────────────────────────
export async function callLambda<T = any>(
  payload: Record<string, unknown>,
  options?: RequestOptions
): Promise<T> {
  const lambdaId = lambdaDecode('workflow_taller_js');
  if (!lambdaId) throw new Error('Lambda principal no encontrada');
  const url = `/api/secure-rQL/lambdas-json-run-node?db=${DB_LAMBDAS}&table=lambda&id=${lambdaId}&format=json`;
  const res = await apiClient.post<T>(url, payload, options);
  return res.data;
}

export async function uploadVideo(
  video: string,
  inspectionCardId: string
): Promise<{ video_url: string; filename: string }> {
  return callLambda({
    table: 'GestionTallerProd_inspection_video',
    method: 'UPLOAD',
    data: { video, inspection_cards_fk_id: inspectionCardId },
  });
}

export async function analyzeVideo(
  inspectionCardId: string,
  videoUrl: string
): Promise<any> {
  const owner = (() => {
    try {
      return JSON.parse(localStorage.getItem('owner') ?? '""');
    } catch {
      return 'default';
    }
  })();
  return callLambda({
    table: 'GestionTallerProd_inspection_analysis',
    method: 'ANALYZE',
    data: { inspection_cards_fk_id: inspectionCardId, video_url: videoUrl, owner },
  });
}
