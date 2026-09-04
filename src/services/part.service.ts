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
import type { PartCatalog } from '../types/entities';

const TABLE = 'GestionTallerProd_parts_catalog';

export const PartService = {
  getAll: (query?: WorkflowQuery) => getEntity<PartCatalog>(TABLE, query),
  getPaginated: (query?: WorkflowQuery) => getPaginatedEntity<PartCatalog>(TABLE, query),
  getById: (id: string) => getEntityById<PartCatalog>(TABLE, id),
  getByFilter: (arrayFilter: Array<Record<string, unknown>>) =>
    getEntitiesByFilter<PartCatalog>(TABLE, arrayFilter),
  create: (data: Partial<PartCatalog>) =>
    createEntity<PartCatalog>(TABLE, data as Record<string, unknown>),
  update: (id: string, data: Partial<PartCatalog>) =>
    updateEntity<PartCatalog>(TABLE, id, data as Record<string, unknown>),
  remove: (id: string) => deleteEntity(TABLE, id),
};
