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
import type { PendingPurchase } from '../types/entities';

const TABLE = 'GestionTallerProd_pending_purchases';

export const PurchaseService = {
  getAll: (query?: WorkflowQuery) => getEntity<PendingPurchase>(TABLE, query),
  getPaginated: (query?: WorkflowQuery) => getPaginatedEntity<PendingPurchase>(TABLE, query),
  getById: (id: string) => getEntityById<PendingPurchase>(TABLE, id),
  getByFilter: (arrayFilter: Array<Record<string, unknown>>) =>
    getEntitiesByFilter<PendingPurchase>(TABLE, arrayFilter),
  create: (data: Partial<PendingPurchase>) =>
    createEntity<PendingPurchase>(TABLE, data as Record<string, unknown>),
  update: (id: string, data: Partial<PendingPurchase>) =>
    updateEntity<PendingPurchase>(TABLE, id, data as Record<string, unknown>),
  remove: (id: string) => deleteEntity(TABLE, id),
};
