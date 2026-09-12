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
  _inverse_fk?: boolean;
  pagination?: {
    page: number;
    size: number;
  };
  filter?: Record<string, unknown>;
  arrayFilter?: Array<Record<string, unknown>>;
  extraFilter?: Record<string, unknown>;
  avanzedFilter?: Record<string, unknown>;
  order?: Record<string, unknown>;
  [key: string]: any;
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

  // 1. Arreglo directo en la raíz
  if (Array.isArray(response)) return response as T;

  // 2. Patrón raíz con data o result
  if (response.data !== undefined && response.data !== null) {
    if (Array.isArray(response.data)) return response.data as T;
    if (response.data?.content && Array.isArray(response.data.content)) return response.data.content as T;
    if (response.data?.data && Array.isArray(response.data.data)) return response.data.data as T;
    return response.data as T;
  }
  if (response.result !== undefined && response.result !== null) {
    if (Array.isArray(response.result)) return response.result as T;
    if (response.result?.data && Array.isArray(response.result.data)) return response.result.data as T;
    return response.result as T;
  }

  // 3. Patrón original Lusiana (gRQL standard request/flows)
  const actionResult = response?.request?.flows?.[0]?.steps?.[0]?.actions?.[0]?.result;
  if (actionResult !== undefined && actionResult !== null) {
    if (actionResult.data !== undefined) {
      const d = actionResult.data;
      if (Array.isArray(d)) return d as T;
      if (d?.content && Array.isArray(d.content)) return d.content as T;
      if (d?.data && Array.isArray(d.data)) return d.data as T;
      return d as T;
    }
    if (Array.isArray(actionResult)) return actionResult as T;
    if (actionResult.content && Array.isArray(actionResult.content)) return actionResult.content as T;
    return actionResult as T;
  }

  // 4. Patrón de respuesta directa de la Lambda por llave de entidad (ej: { "GestionTallerProd_clients": ... })
  const keys = Object.keys(response);
  for (const key of keys) {
    if (key !== 'request' && typeof response[key] === 'object' && response[key] !== null) {
      const tableData = response[key];
      
      // Si es una respuesta paginada con paginate
      if (tableData.paginate) {
        if (Array.isArray(tableData.paginate.content)) return tableData.paginate.content as T;
        if (Array.isArray(tableData.paginate.data)) return tableData.paginate.data as T;
        if (Array.isArray(tableData.paginate.rows)) return tableData.paginate.rows as T;
      }
      
      // Si tiene propiedad data directa
      if (tableData.data !== undefined && tableData.data !== null) {
        if (Array.isArray(tableData.data)) return tableData.data as T;
        if (tableData.data?.content && Array.isArray(tableData.data.content)) return tableData.data.content as T;
        return tableData.data as T;
      }

      // Si tiene propiedad content
      if (Array.isArray(tableData.content)) {
        return tableData.content as T;
      }

      // Si tiene propiedad rows
      if (Array.isArray(tableData.rows)) {
        return tableData.rows as T;
      }

      // Si el valor de la entidad es un arreglo directo
      if (Array.isArray(tableData)) {
        return tableData as T;
      }
      
      // Si es un objeto único válido (ej: respuesta de una mutación create/update con id o success)
      if (tableData.id || tableData.success || tableData.status === 'success') {
        return tableData as T;
      }
    }
  }

  // 5. Objeto directo de mutación
  if (response.id || response.success) {
    return response as T;
  }

  // Fallback
  return null;
}

/** Helper: extrae los metadatos de paginación del payload directo de la lambda */
export function extractPagination(response: any): any | null {
  if (!response) return null;

  if (response.meta) return response.meta;
  if (response.pagination) return response.pagination;

  const actionResult = response?.request?.flows?.[0]?.steps?.[0]?.actions?.[0]?.result;
  if (actionResult?.meta) return actionResult.meta;
  if (actionResult?.pagination) return actionResult.pagination;

  const keys = Object.keys(response);
  for (const key of keys) {
    if (key !== 'request' && typeof response[key] === 'object' && response[key] !== null) {
      const tableData = response[key];
      if (tableData.paginate) {
        const { content, data, rows, ...meta } = tableData.paginate;
        return meta;
      }
      if (tableData.meta) return tableData.meta;
      if (tableData.pagination) return tableData.pagination;
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
  const existingArrayFilter = query?.arrayFilter || [];
  const hasInverseFk = existingArrayFilter.some((f: any) => f?.field === '_inverse_fk');
  const arrayFilter = hasInverseFk
    ? existingArrayFilter
    : [{ field: '_inverse_fk', value: true }, ...existingArrayFilter];

  const mergedQuery: WorkflowQuery = {
    ...(query ?? {}),
    arrayFilter,
  };
  if ('_inverse_fk' in mergedQuery) {
    delete (mergedQuery as any)._inverse_fk;
  }

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
                  params: { query: mergedQuery },
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
