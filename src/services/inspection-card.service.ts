import {
  getEntity,
  getEntityById,
  getEntitiesByFilter,
  createEntity,
  updateEntity,
  deleteEntity,
  getPaginatedEntity
} from '../api/client';
import type { WorkflowQuery } from '../api/workflow.types';
import type { InspectionCard } from '../types/entities';

const TABLE = 'GestionTallerProd_inspection_cards';

export const InspectionCardService = {
  getAll: (query?: WorkflowQuery) => getEntity<InspectionCard>(TABLE, query),
  getPaginated: (query?: WorkflowQuery) => getPaginatedEntity<InspectionCard>(TABLE, query),
  getById: (id: string) => getEntityById<InspectionCard>(TABLE, id),
  getByFilter: (arrayFilter: Array<Record<string, unknown>>) =>
    getEntitiesByFilter<InspectionCard>(TABLE, arrayFilter),
  create: (data: Partial<InspectionCard>) =>
    createEntity<InspectionCard>(TABLE, data as Record<string, unknown>),
  update: (id: string, data: Partial<InspectionCard>) =>
    updateEntity<InspectionCard>(TABLE, id, data as Record<string, unknown>),
  remove: (id: string) => deleteEntity(TABLE, id),
};
