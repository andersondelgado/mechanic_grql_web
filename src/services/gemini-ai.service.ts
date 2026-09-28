/**
 * Servicio de IA Generativa (Gemini) — espejo de ELYTRABIT `core/services/gemini-ai.service.ts`.
 *
 * Flujo:
 *  1. Construye un WorkflowRequest con un único step `gemini_copilot`
 *     (acción `customFunction` / `mutation`, con `params.action` + `params.body`).
 *  2. Lo envía a la lambda del taller vía `workflowJson()`.
 *  3. Desanida la respuesta ` { gemini_copilot: { customFunction: <payload> } } `.
 *  4. Ante cualquier fallo de red/lambda devuelve un mock local para no romper la UI.
 */
import { workflowJson } from '../api/client';
import type { WorkflowRequest } from '../api/workflow.types';

const WORKFLOW_NAME = 'workflow_taller';
const STEP_NAME = 'gemini_copilot';
const AI_TIMEOUT_MS = 120_000;

export interface DraftQuotePayload {
  audio_base64?: string;
  mime_type?: string;
  text_notes?: string;
  vehicle_info?: Record<string, unknown>;
}

export interface QuoteDraftResult {
  client_name?: string;
  tax_id?: string;
  vehicle_type?: string;
  brand?: string;
  model?: string;
  year?: string;
  license_plate?: string;
  address?: string;
  quote_date?: string;
  status?: string;
  diagnostic?: string[];
  recommended_actions?: string[];
  items?: Array<{
    item_number?: number;
    description?: string;
    quantity?: number;
    unit_price?: number;
    total_price?: number;
    product_name?: string;
    product_brand?: string;
    supplier_store?: string;
  }>;
  subtotal?: number;
  total?: number;
  warning?: string;
  mock_generated?: boolean;
  [key: string]: any;
}

export interface DocumentAnalysisResult {
  document_type?: string;
  provider?: string;
  folio?: string;
  issue_date?: string;
  items?: Array<{ description?: string; quantity?: number; unit_price?: number; total?: number }>;
  subtotal?: number;
  taxes?: number;
  total?: number;
  findings?: string[];
  [key: string]: any;
}

export interface SuggestedPart {
  code?: string;
  description?: string;
  quantity?: number;
  estimated_price?: number;
  supplier?: string;
  urgency?: string;
}

export interface PeritajeMediaPayload {
  /** Archivo convertido a base64 (sin prefijo data:) — imagen, video o audio */
  file_base64?: string;
  mime_type?: string;
  /** Alternativa: video ya subido a la nube (cuando el base64 no cabe inline) */
  video_url?: string;
  inspection_cards_fk_id?: string;
  prompt_context?: string;
  vehicle_context?: string | Record<string, unknown>;
  observations?: string;
  /** false = no persistir en inspection_analysis (solo devolver el dictamen) */
  persist?: boolean;
}

export interface PeritajeAnalysisResult {
  damage_type?: string;
  damage_severity?: string;
  affected_parts?: string[];
  repair_estimated_hours?: number;
  parts_needed?: string[];
  confidence_score?: number;
  observations?: string;
  recommended_actions?: string[];
  status?: string;
  /** Datos devueltos por la lambda */
  analysis_id?: string;
  source?: 'base64' | 'video_url';
  mock_generated?: boolean;
  warning?: string;
  [key: string]: any;
}

/**
 * Construye el WorkflowRequest con el step del copiloto Gemini.
 * Reproduce exactamente la estructura que ELYTRABIT envía a su lambda médica.
 */
function buildCopilotRequest(action: string, body: Record<string, unknown>): WorkflowRequest {
  const actionParams = { action, body: { ...body, action } };
  return {
    request: {
      flows: [
        {
          name: WORKFLOW_NAME,
          description: WORKFLOW_NAME,
          steps: [
            {
              name: STEP_NAME,
              type: 'function' as const,
              functionName: STEP_NAME,
              actions: [
                {
                  name: 'customFunction',
                  type: 'api' as const,
                  action: 'mutation' as const,
                  params: actionParams as any,
                },
              ],
            },
          ],
        },
      ],
    },
  };
}

/**
 * Desanida la respuesta de la lambda:
 *   { gemini_copilot: { customFunction: {...} } }  ->  {...}
 */
function unwrapCopilotResponse(response: any): any {
  const copilot = response?.[STEP_NAME] ?? response;
  if (copilot && typeof copilot === 'object' && copilot.customFunction !== undefined) {
    return copilot.customFunction;
  }
  return copilot;
}

async function invokeCopilot(action: string, body: Record<string, unknown>): Promise<any> {
  const request = buildCopilotRequest(action, body);
  const response = await workflowJson(request, 'workflow_taller_js', 'lambda', { timeout: AI_TIMEOUT_MS });

  // La lambda devuelve { error: { message } } cuando el flujo falla (IAM, timeout, etc.)
  const lambdaError = response?.error;
  if (lambdaError) {
    const message =
      typeof lambdaError === 'string' ? lambdaError : lambdaError.message || JSON.stringify(lambdaError);
    throw new Error(message);
  }

  return unwrapCopilotResponse(response);
}

function getLocalMockDraft(): QuoteDraftResult {
  return {
    client_name: 'Cliente Demo',
    tax_id: 'J-00000000-0',
    vehicle_type: 'Camioneta',
    brand: 'Toyota',
    model: 'Hilux',
    year: '2020',
    license_plate: 'ABC123',
    address: 'Urb. Industrial, Caracas',
    quote_date: new Date().toISOString().slice(0, 10),
    status: 'borrador',
    diagnostic: [
      'Desgaste avanzado de balatas delanteras',
      'Posible deformación de discos traseros',
      'Nivel de frenos por debajo del mínimo',
    ],
    recommended_actions: [
      'Reemplazar juego de balatas delanteras',
      'Rectificar discos traseros',
      'Purgar y rellenar líquido de frenos DOT4',
    ],
    items: [
      { item_number: 1, description: 'Balatas delanteras juego completo', quantity: 1, unit_price: 120, total_price: 120, product_name: 'Balatas', product_brand: 'Bosch', supplier_store: 'Repuestos Mecánica' },
      { item_number: 2, description: 'Rectificado de discos traseros (par)', quantity: 1, unit_price: 60, total_price: 60, product_name: 'Rectificado', product_brand: 'Servicio' },
      { item_number: 3, description: 'Mano de obra sistema de frenos', quantity: 2, unit_price: 35, total_price: 70 },
    ],
    subtotal: 250,
    total: 295,
    mock_generated: true,
    warning: 'Borrador simulado: GEMINI_API_KEY no disponible en este entorno.',
  };
}

const LOCAL_MOCK_DOCUMENT: DocumentAnalysisResult = {
  document_type: 'Factura de proveedor',
  provider: 'Distribuidora de Refacciones',
  folio: '000-000123',
  issue_date: new Date().toISOString().slice(0, 10),
  items: [
    { description: 'Aceite sintético 5W30 (galón)', quantity: 4, unit_price: 22, total: 88 },
    { description: 'Filtro de aceite', quantity: 4, unit_price: 8, total: 32 },
  ],
  subtotal: 120,
  taxes: 16,
  total: 136,
  findings: ['Documento leído en modo local (sin clave Gemini).'],
};

const LOCAL_MOCK_PARTS: SuggestedPart[] = [
  { code: 'BAL-DEL-001', description: 'Juego de balatas delanteras', quantity: 1, estimated_price: 120, supplier: 'Repuestos Mecánica', urgency: 'alta' },
  { code: 'DIS-TRA-002', description: 'Discos de freno traseros (par)', quantity: 1, estimated_price: 180, supplier: 'Autopartes 360', urgency: 'media' },
  { code: 'LIQ-DOT4', description: 'Líquido de frenos DOT4 (1L)', quantity: 1, estimated_price: 12, supplier: 'Repuestos Mecánica', urgency: 'media' },
  { code: 'SEN-ABS-003', description: 'Sensor de rueda ABS', quantity: 1, estimated_price: 45, supplier: 'Autopartes 360', urgency: 'baja' },
  { code: 'MBO-4H-004', description: 'Manguera hidráulica de dirección', quantity: 1, estimated_price: 95, supplier: 'Dirección Total', urgency: 'baja' },
];

export const GeminiAiService = {
  /**
   * Dictado / notas -> borrador de presupuesto (tabla quotes + quote_items).
   */
  async generateDraftQuote(payload: DraftQuotePayload): Promise<QuoteDraftResult> {
    try {
      return await invokeCopilot('generate_draft_quote', {
        ...payload,
        mime_type: payload.mime_type || (payload.audio_base64 ? 'audio/webm' : undefined),
      } as Record<string, unknown>);
    } catch (err) {
      console.warn('Fallback a simulación local de Gemini AI por entorno:', err);
      return getLocalMockDraft();
    }
  },

  /**
   * Imagen (factura / orden de compra / remito) -> datos estructurados.
   */
  async analyzeDocument(
    imageBase64: string,
    mimeType = 'image/jpeg',
    promptContext?: string
  ): Promise<DocumentAnalysisResult> {
    try {
      return await invokeCopilot('analyze_document', {
        image_base64: imageBase64,
        mime_type: mimeType,
        prompt_context: promptContext,
      });
    } catch (err) {
      console.warn('Fallback a simulación local de análisis documental:', err);
      return LOCAL_MOCK_DOCUMENT;
    }
  },

  /**
   * Síntomas del vehículo -> repuestos sugeridos.
   */
  async suggestParts(symptoms: string, technicalImpression?: string): Promise<SuggestedPart[]> {
    try {
      const data = await invokeCopilot('suggest_parts', {
        symptoms,
        technical_impression: technicalImpression,
      });
      return Array.isArray(data) ? data : [];
    } catch (err) {
      console.warn('Fallback a simulación local de repuestos sugeridos:', err);
      return LOCAL_MOCK_PARTS;
    }
  },

  /**
   * Peritaje: archivo (imagen/video/audio) ya convertido a base64 -> dictamen Gemini.
   * La lambda lo procesa multimodalmente y lo persiste en `inspection_analysis`.
   *
   * A diferencia de los demás métodos NO cae en un mock: un dictamen simulado
   * se guardaría como si fuera real. Los errores se propagan a la UI.
   */
  async analyzePeritajeMedia(payload: PeritajeMediaPayload): Promise<PeritajeAnalysisResult> {
    const data = await invokeCopilot('analyze_peritaje_media', { ...payload });
    if (data?.error) {
      const message =
        typeof data.error === 'string' ? data.error : data.error.message || JSON.stringify(data.error);
      throw new Error(message);
    }
    // La lambda responde { success, analysis, analysis_id, source }
    const analysis = data?.analysis ?? data;
    return {
      ...(analysis && typeof analysis === 'object' ? analysis : {}),
      analysis_id: data?.analysis_id,
      source: data?.source,
    };
  },
};

export default GeminiAiService;
