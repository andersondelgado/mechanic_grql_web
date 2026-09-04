// ─── Endpoints ────────────────────────────────────────────────────────────────
export const BASE_URL = 'https://db-grql.com';
export const API_BASE = `${BASE_URL}/api/secure-rQL`;

// Lambda endpoints
export const LAMBDA_ENDPOINT_NODE = `${API_BASE}/lambdas-json-run-node`;
export const LAMBDA_FORM_ENDPOINT = `${API_BASE}/lambdas-formData-run-node-v1`;
export const SECURITY_ENDPOINT = `${API_BASE}/lambdas-json-run-security`;
export const WS_URL = 'wss://db-grql.com';

// DB names
export const DB_LAMBDAS = 'codeLambdas';
export const DB_NAME = 'GestionTallerProd';

// API key (X-Grql-Auth) — cargada desde .env si existe
export const API_KEY: string =
    (import.meta as any).env?.VITE_GRQL_API_KEY ?? 'TW5kemFreFRiM0JVYWtRMlYxRkZlblJVV1VsYVowTkdiM1U0ZDNCTVNtNGlmQ0phUjFZeVdWaENkMHh0VW14aVIyUkJXakl4YUdGWGQzVlpNamwwWmtjeGFGa3lhSEJpYlZaSVdWaEthRm95VlQwPSItIk1uZHpha3hUYjNCVWFrUTJWMUZGZW5SVVdVbGFaME5HYjNVNGQzQk1TbTQ9Ii4iWVc1a00zSnpNRzR1WkdWMk0yeHZjRzB6Ym5RPQ==';

// ─── Lambda IDs ──────────────────────────────────────────────────────────────
// Codificados en base64 igual que Lusiana (environment.lambdaCompose).
// Decode: atob(LAMBDA_COMPOSE) → JSON array [{ name, id }]
// Para decodificar: Common.lambdaDecode("workflow_taller_js")
export const LAMBDA_COMPOSE: string =
    (import.meta as any).env?.VITE_LAMBDA_COMPOSE ??
    // Fallback: base64 de [{"name":"workflow_taller_js","id":"6d033980-4806-4e69-a3e8-a5f8f86d4cec"}]
    'W3sibmFtZSI6IndvcmtmbG93X3RhbGxlcl9qcyIsImlkIjoiOThkODM3NmEtZDg4Mi00MDQ4LWIxYjctMGNkZmFkYjNlYzQyIn0seyJuYW1lIjoid29ya2Zsb3dfc2VjdXJpdHlfanMiLCJpZCI6ImFlNjRlNzc4LTg5NTItNGI4Yi05ZWI2LTBjODFmNzFjN2FhMiJ9XQ==';

// ─── Misc ─────────────────────────────────────────────────────────────────────
export const DEFAULT_OWNER = '50735380-0_urbaezmotors';
export const GEMINI_API_KEY: string = (import.meta as any).env?.VITE_GEMINI_API_KEY ?? '';

// ─── Common helpers ───────────────────────────────────────────────────────────
/**
 * Decode a lambda ID by name from LAMBDA_COMPOSE.
 * Equivalent to Lusiana's Common.lambdaDecode(str).
 */
export function lambdaDecode(name: string): string | null {
    try {
        const decoded = JSON.parse(atob(LAMBDA_COMPOSE)) as Array<{ name: string; id: string }>;
        return decoded.find(l => l.name === name)?.id ?? null;
    } catch {
        return null;
    }
}

/** Build the full lambda query string for a given lambda ID */
export function buildLambdaUrl(lambdaId: string, workspace = 'lambda'): string {
    return `${LAMBDA_ENDPOINT_NODE}?db=${DB_LAMBDAS}&table=${workspace}&id=${lambdaId}&format=json`;
}
