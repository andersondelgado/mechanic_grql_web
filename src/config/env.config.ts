/**
 * Centralized, type-safe configuration module for Vite frontend application.
 * Reads variables injected via import.meta.env (prefixed with VITE_).
 */

interface EnvConfiguration {
  apiUrl: string;
  wsUrl: string;
  lambdaEndpoint: string;
  dbName: string;
  dbLambdas: string;
  defaultOwner: string;
  apiKey: string;
  lambdaCompose: string;
  geminiApiKey: string;
  isProduction: boolean;
  isDevelopment: boolean;
}

const metaEnv = (import.meta as any).env || {};

export const env: EnvConfiguration = {
  apiUrl: metaEnv.VITE_API_URL || metaEnv.VITE_BASE_URL || 'https://db-grql.com',
  wsUrl: metaEnv.VITE_WS_URL || 'wss://db-grql.com',
  lambdaEndpoint: metaEnv.VITE_LAMBDA_ENDPOINT || '',
  dbName: metaEnv.VITE_DB_NAME || 'GestionTallerProd',
  dbLambdas: metaEnv.VITE_DB_LAMBDAS || 'codeLambdas',
  defaultOwner: metaEnv.VITE_DEFAULT_OWNER || '50735380-0_urbaezmotors',
  apiKey: metaEnv.VITE_GRQL_API_KEY || '',
  lambdaCompose: metaEnv.VITE_LAMBDA_COMPOSE || '',
  geminiApiKey: metaEnv.VITE_GEMINI_API_KEY || '',
  isProduction: metaEnv.PROD ?? false,
  isDevelopment: metaEnv.DEV ?? true,
};

// Validate critical variables in runtime
if (!env.apiKey && !env.isProduction) {
  console.warn(
    '⚠️ [Config] VITE_GRQL_API_KEY no está definida en las variables de entorno. Las peticiones a la base de datos gRQL podrían fallar.'
  );
}

export default env;
