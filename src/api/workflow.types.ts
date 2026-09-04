/**
 * Interfaces tipadas para la arquitectura de workflows gRQL.
 * Patrón adoptado del proyecto Lusiana (ingeniería reversa).
 */

/** Representa una acción individual dentro de un paso del workflow. */
export interface WorkflowAction {
  name: string;
  type: 'api';
  action: 'query' | 'mutation';
  params: {
    body?: Record<string, unknown>;
    query?: WorkflowQuery;
    path?: { id?: string } & Record<string, unknown>;
  };
}

/** Parámetros de consulta para acciones de tipo query */
export interface WorkflowQuery {
  pagination?: {
    page: number;
    size: number;
  };
  filter?: Record<string, unknown>;
  arrayFilter?: Array<Record<string, unknown>>;
  extraFilter?: Record<string, unknown>;
  avanzedFilter?: Record<string, unknown>;
  order?: Record<string, unknown>;
}

/** Paso dentro de un workflow */
export interface WorkflowStep {
  name: string;
  type: 'function';
  functionName: string;
  actions: WorkflowAction[];
}

/** Workflow completo */
export interface Workflow {
  name: string;
  description: string;
  steps: WorkflowStep[];
}

/** Estructura raíz de toda petición a la lambda gRQL */
export interface WorkflowRequest {
  request: {
    flows: Workflow[];
  };
}

/** Respuesta estandarizada de la lambda */
export interface WorkflowResponse<T = any> {
  request?: {
    flows?: Array<{
      steps?: Array<{
        actions?: Array<{
          result?: {
            data?: T;
            [key: string]: any;
          };
        }>;
      }>;
    }>;
  };
  [key: string]: any;
}

/** Helper: extrae el data del primer action result, o del payload directo de la lambda */
export function extractData<T = any>(response: any): T | null {
  if (!response) return null;

  // 1. Patrón original Lusiana (gRQL standard request/flows)
  const standardData = response?.request?.flows?.[0]?.steps?.[0]?.actions?.[0]?.result?.data;
  if (standardData !== undefined) return standardData as T;

  // 2. Patrón de respuesta directa de la Lambda (ej: { "GestionTallerProd_clients": { paginate: { content: [...] } } })
  const keys = Object.keys(response);
  for (const key of keys) {
    if (key !== 'request' && typeof response[key] === 'object' && response[key] !== null) {
      const tableData = response[key];
      
      // Si es una respuesta paginada
      if (tableData.paginate && Array.isArray(tableData.paginate.content)) {
        return tableData.paginate.content as T;
      }
      
      // Si es una respuesta de lista directa
      if (Array.isArray(tableData.content)) {
        return tableData.content as T;
      }
      
      // Si es un objeto único (ej: respuesta de una mutación create/update)
      return tableData as T;
    }
  }

  // Fallback
  return null;
}

/** Helper: extrae los metadatos de paginación del payload directo de la lambda */
export function extractPagination(response: any): any | null {
  if (!response) return null;
  const keys = Object.keys(response);
  for (const key of keys) {
    if (key !== 'request' && typeof response[key] === 'object' && response[key] !== null) {
      const tableData = response[key];
      if (tableData.paginate) {
        const { content, ...meta } = tableData.paginate;
        return meta;
      }
    }
  }
  return null;
}

/** Helper: construye un WorkflowRequest simple de query */
export function buildQueryRequest(
  workflowName: string,
  stepName: string,
  actionName: string,
  query?: WorkflowQuery
): WorkflowRequest {
  return {
    request: {
      flows: [
        {
          name: workflowName,
          description: workflowName,
          steps: [
            {
              name: stepName,
              type: 'function',
              functionName: stepName,
              actions: [
                {
                  name: actionName,
                  type: 'api',
                  action: 'query',
                  params: { query: query ?? {} },
                },
              ],
            },
          ],
        },
      ],
    },
  };
}

/** Helper: construye un WorkflowRequest simple de mutation */
export function buildMutationRequest(
  workflowName: string,
  stepName: string,
  actionName: string,
  params: { body?: Record<string, unknown>; path?: Record<string, unknown> }
): WorkflowRequest {
  return {
    request: {
      flows: [
        {
          name: workflowName,
          description: workflowName,
          steps: [
            {
              name: stepName,
              type: 'function',
              functionName: stepName,
              actions: [
                {
                  name: actionName,
                  type: 'api',
                  action: 'mutation',
                  params,
                },
              ],
            },
          ],
        },
      ],
    },
  };
}
