import { env } from '../config/env.config';

// ─── Endpoints ────────────────────────────────────────────────────────────────
export const BASE_URL = env.apiUrl;
export const API_BASE = `${BASE_URL}/api/secure-rQL`;

// Lambda endpoints
export const LAMBDA_ENDPOINT_NODE = `${API_BASE}/lambdas-json-run-node`;
export const LAMBDA_FORM_ENDPOINT = `${API_BASE}/lambdas-formData-run-node-v1`;
export const SECURITY_ENDPOINT = `${API_BASE}/lambdas-json-run-security`;
export const WS_URL = env.wsUrl;

// DB names
export const DB_LAMBDAS = env.dbLambdas;
export const DB_NAME = env.dbName;

// API key (X-Grql-Auth)
export const API_KEY: string = env.apiKey;

// ─── Lambda IDs ──────────────────────────────────────────────────────────────
export const LAMBDA_COMPOSE: string = env.lambdaCompose;

// ─── Misc ─────────────────────────────────────────────────────────────────────
export const DEFAULT_OWNER = env.defaultOwner;
export const GEMINI_API_KEY: string = env.geminiApiKey;

// ─── Common helpers ───────────────────────────────────────────────────────────
/**
 * Decode a lambda ID by name from LAMBDA_COMPOSE.
 * Equivalent to Lusiana's Common.lambdaDecode(str).
 */
export function lambdaDecode(name: string): string | null {
    try {
        const raw = (LAMBDA_COMPOSE || '').trim();
        const clean = raw.replace(/^["']|["']$/g, '').trim();
        if (!clean) return null;
        const decodedStr =
            typeof atob === 'function'
                ? atob(clean)
                : typeof (globalThis as any).Buffer !== 'undefined'
                  ? (globalThis as any).Buffer.from(clean, 'base64').toString('utf-8')
                  : clean;
        const decoded = JSON.parse(decodedStr) as Array<{ name: string; id: string }>;

        // 1. Coincidencia exacta
        const exact = decoded.find(l => l.name === name);
        if (exact) return exact.id;

        // 2. Mapeo para workflow de taller / garage (ej. workflow_taller_js <-> workflow_garage_node)
        if (name.includes('taller') || name.includes('garage')) {
            const match = decoded.find(l => l.name.includes('garage') || l.name.includes('taller'));
            if (match) return match.id;
        }

        // 3. Mapeo para workflow de seguridad
        if (name.includes('security')) {
            const match = decoded.find(l => l.name.includes('security'));
            if (match) return match.id;
        }

        return null;
    } catch (e) {
        console.warn('Error al decodificar LAMBDA_COMPOSE:', e);
        return null;
    }
}

/** Build the full lambda query string for a given lambda ID */
export function buildLambdaUrl(lambdaId: string, workspace = 'lambda'): string {
    return `${LAMBDA_ENDPOINT_NODE}?db=${DB_LAMBDAS}&table=${workspace}&id=${lambdaId}&format=json`;
}
