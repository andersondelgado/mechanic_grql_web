import { getEntity, getEntityById, createEntity, updateEntity, deleteEntity, uploadVideo as uploadVideoApi, analyzeVideo as analyzeVideoApi } from '../api/client';
import type { WorkflowQuery } from '../api/workflow.types';
import type { InspectionCard, InspectionVideo, InspectionAnalysis } from '../types/entities';

const TABLE_CARDS    = 'GestionTallerProd_inspection_cards';
const TABLE_VIDEOS   = 'GestionTallerProd_inspection_video';
const TABLE_ANALYSIS = 'GestionTallerProd_inspection_analysis';

export const InspectionService = {
  // ── Inspection Cards ──────────────────────────────────────────────────────
  getAll: (query?: WorkflowQuery) => getEntity<InspectionCard>(TABLE_CARDS, query),
  getById: (id: string) => getEntityById<InspectionCard>(TABLE_CARDS, id),
  create: (data: Partial<InspectionCard>) =>
    createEntity<InspectionCard>(TABLE_CARDS, data as Record<string, unknown>),
  update: (id: string, data: Partial<InspectionCard>) =>
    updateEntity<InspectionCard>(TABLE_CARDS, id, data as Record<string, unknown>),
  remove: (id: string) => deleteEntity(TABLE_CARDS, id),

  // ── Videos ───────────────────────────────────────────────────────────────
  getVideos: (query?: WorkflowQuery) => getEntity<InspectionVideo>(TABLE_VIDEOS, query),
  uploadVideo: (base64: string, inspectionCardId: string) =>
    uploadVideoApi(base64, inspectionCardId),

  // ── Analysis (IA) ─────────────────────────────────────────────────────────
  getAnalyses: (query?: WorkflowQuery) => getEntity<InspectionAnalysis>(TABLE_ANALYSIS, query),
  analyzeVideo: (inspectionCardId: string, videoUrl: string) =>
    analyzeVideoApi(inspectionCardId, videoUrl),
};
