/**
 * Capa HTTP para comunicarse con las lambdas gRQL.
 * Patrón adoptado de Lusiana:
 *  - Doble token: JWT (Authorization) + Lambda token (X-Grql-Lambda) + API Key (X-Grql-Auth)
 *  - Caché inteligente: memory + sessionStorage, fallback ante errores de red
 *  - Payload tipado con WorkflowRequest
 */
import axios, { AxiosInstance } from 'axios';
import {
  WorkflowRequest,
  WorkflowResponse,
  WorkflowQuery,
  buildQueryRequest,
  buildMutationRequest,
  extractData,
  extractPagination,
} from './workflow.types';
import { BASE_URL, DB_LAMBDAS, API_KEY, lambdaDecode } from './config';

// ─── Memory cache (sobrevive el límite de sessionStorage) ─────────────────────
const memoryCache = new Map<string, any>();

function readCache(key: string): any | null {
  if (memoryCache.has(key)) return memoryCache.get(key);
  try {
    const raw = sessionStorage.getItem(key);
    if (raw) {
      const parsed = JSON.parse(raw);
      memoryCache.set(key, parsed);
      return parsed;
    }
  } catch { /* sessionStorage no disponible */ }
  return null;
}

function writeCache(key: string, value: any): void {
  memoryCache.set(key, value);
  try {
    sessionStorage.setItem(key, JSON.stringify(value));
  } catch { /* Cuota excedida — memory cache sigue válido */ }
}

function hasCacheableData(res: any): boolean {
  return !!res && typeof res === 'object' && Object.keys(res).length > 0;
}

// ─── Axios instance base ──────────────────────────────────────────────────────
const http: AxiosInstance = axios.create({
  baseURL: BASE_URL,
  timeout: 30_000,
  headers: { 'Content-Type': 'application/json' },
});

// Interceptor: X-Grql-Auth (siempre) + Authorization JWT (si existe)
http.interceptors.request.use((config) => {
  if (API_KEY) config.headers['x-grql-auth'] = API_KEY;

  const token = localStorage.getItem('token');
  if (token) config.headers['Authorization'] = `Bearer ${token}`;

  // Lambda token (X-Grql-Lambda) — equivalente al lambdaToken de Lusiana
  const lambdaToken = localStorage.getItem('lambdaToken');
  if (lambdaToken) config.headers['X-Grql-Lambda'] = lambdaToken;

  return config;
});

// Interceptor de errores global
http.interceptors.response.use(
  (res) => res,
  (err) => {
    if (err.response?.status === 401) {
      localStorage.removeItem('token');
      localStorage.removeItem('lambdaToken');
      window.location.hash = '/login';
    }
    return Promise.reject(err);
  }
);

// ─── Core: workflowJson ───────────────────────────────────────────────────────
/**
 * Envía un WorkflowRequest a la lambda indicada.
 * Implementa caché automático para acciones de tipo "query" (igual que Lusiana GlobalService).
 */
export async function workflowJson<T = any>(
  request: WorkflowRequest,
  lambdaName: string = 'workflow_taller_js',
  workspace: string = 'lambda'
): Promise<T> {
  const lambdaId = lambdaDecode(lambdaName);
  if (!lambdaId) throw new Error(`Lambda no encontrada: ${lambdaName}`);

  const url = `/api/secure-rQL/lambdas-json-run-node?db=${DB_LAMBDAS}&table=${workspace}&id=${lambdaId}&format=json`;
  const isQuery = request?.request?.flows?.[0]?.steps?.[0]?.actions?.[0]?.action === 'query';

  if (isQuery) {
    const cacheKey = `cache_${url}_${JSON.stringify(request)}`;
    try {
      const res = await http.post<T>(url, request);
      const data = res.data;
      if (hasCacheableData(data)) writeCache(cacheKey, data);
      return data;
    } catch (err: any) {
      const cached = readCache(cacheKey);
      if (hasCacheableData(cached)) {
        console.warn('Request failed, usando caché:', err?.message);
        return cached as T;
      }
      // Retry en background ante errores de servidor
      const status = err?.response?.status;
      if ([500, 502, 503, 504].includes(status)) {
        http.post<T>(url, request).then((bgRes) => {
          if (hasCacheableData(bgRes.data)) writeCache(cacheKey, bgRes.data);
        }).catch(() => {});
      }
      throw err;
    }
  }

  const res = await http.post<T>(url, request);
  return res.data;
}

// ─── Helpers CRUD de alto nivel ───────────────────────────────────────────────
const WORKFLOW_NAME = 'workflow_taller';

export async function getEntity<T = any>(
  table: string,
  query?: WorkflowQuery
): Promise<T[]> {
  const request = buildQueryRequest(WORKFLOW_NAME, table, 'get', {
    pagination: { page: 1, size: 100 },
    ...query,
  });
  const response = await workflowJson<WorkflowResponse<T[]>>(request);
  return extractData<T[]>(response) ?? [];
}

export async function getPaginatedEntity<T = any>(
  table: string,
  query?: WorkflowQuery
): Promise<{ data: T[], meta: any }> {
  const request = buildQueryRequest(WORKFLOW_NAME, table, 'get', {
    pagination: { page: 1, size: 10 },
    ...query,
  });
  const response = await workflowJson<WorkflowResponse<T[]>>(request);
  return { data: extractData<T[]>(response) ?? [], meta: extractPagination(response) };
}

export async function getEntityById<T = any>(
  table: string,
  id: string
): Promise<T | null> {
  const request = buildQueryRequest(WORKFLOW_NAME, table, 'get', {
    filter: { id },
  });
  const response = await workflowJson<WorkflowResponse<T[]>>(request);
  const data = extractData<T[]>(response);
  return data?.[0] ?? null;
}

export async function getEntitiesByFilter<T = any>(
  table: string,
  arrayFilter: Array<Record<string, unknown>>
): Promise<T[]> {
  const request = buildQueryRequest(WORKFLOW_NAME, table, 'dataFilter', {
    arrayFilter,
  });
  const response = await workflowJson<WorkflowResponse<T[]>>(request);
  return extractData<T[]>(response) ?? [];
}

export async function createEntity<T = any>(
  table: string,
  data: Record<string, unknown>
): Promise<T | null> {
  const request = buildMutationRequest(WORKFLOW_NAME, table, 'create', { body: data });
  const response = await workflowJson<WorkflowResponse<T>>(request);
  return extractData<T>(response);
}

export async function updateEntity<T = any>(
  table: string,
  id: string,
  data: Record<string, unknown>
): Promise<T | null> {
  const request = buildMutationRequest(WORKFLOW_NAME, table, 'putById', {
    body: { ...data, id },
    path: { id },
  });
  const response = await workflowJson<WorkflowResponse<T>>(request);
  return extractData<T>(response);
}

export async function deleteEntity(table: string, id: string): Promise<void> {
  const request = buildMutationRequest(WORKFLOW_NAME, table, 'deleteById', {
    path: { id },
  });
  await workflowJson(request);
}

// ─── Funciones especiales (video + IA) ───────────────────────────────────────
export async function callLambda<T = any>(
  payload: Record<string, unknown>
): Promise<T> {
  const lambdaId = lambdaDecode('workflow_taller_js');
  if (!lambdaId) throw new Error('Lambda principal no encontrada');
  const url = `/api/secure-rQL/lambdas-json-run-node?db=${DB_LAMBDAS}&table=lambda&id=${lambdaId}&format=json`;
  const res = await http.post<T>(url, payload);
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
    try { return JSON.parse(localStorage.getItem('owner') ?? '""'); }
    catch { return 'default'; }
  })();
  return callLambda({
    table: 'GestionTallerProd_inspection_analysis',
    method: 'ANALYZE',
    data: { inspection_cards_fk_id: inspectionCardId, video_url: videoUrl, owner },
  });
}

export { http as apiClient };
