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
import type { Supplier } from '../types/entities';

const TABLE = 'GestionTallerProd_suppliers';

export const SupplierService = {
  getAll: (query?: WorkflowQuery) => getEntity<Supplier>(TABLE, query),
  getPaginated: (query?: WorkflowQuery) => getPaginatedEntity<Supplier>(TABLE, query),
  getById: (id: string) => getEntityById<Supplier>(TABLE, id),
  getByFilter: (arrayFilter: Array<Record<string, unknown>>) =>
    getEntitiesByFilter<Supplier>(TABLE, arrayFilter),
  create: (data: Partial<Supplier>) =>
    createEntity<Supplier>(TABLE, data as Record<string, unknown>),
  update: (id: string, data: Partial<Supplier>) =>
    updateEntity<Supplier>(TABLE, id, data as Record<string, unknown>),
  remove: (id: string) => deleteEntity(TABLE, id),
};
