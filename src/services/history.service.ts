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
import type { ClientHistory } from '../types/entities';

const TABLE = 'GestionTallerProd_client_history';

export const HistoryService = {
  getAll: (query?: WorkflowQuery) => getEntity<ClientHistory>(TABLE, query),
  getPaginated: (query?: WorkflowQuery) => getPaginatedEntity<ClientHistory>(TABLE, query),
  getById: (id: string) => getEntityById<ClientHistory>(TABLE, id),
  getByFilter: (arrayFilter: Array<Record<string, unknown>>) =>
    getEntitiesByFilter<ClientHistory>(TABLE, arrayFilter),
  create: (data: Partial<ClientHistory>) =>
    createEntity<ClientHistory>(TABLE, data as Record<string, unknown>),
  update: (id: string, data: Partial<ClientHistory>) =>
    updateEntity<ClientHistory>(TABLE, id, data as Record<string, unknown>),
  remove: (id: string) => deleteEntity(TABLE, id),
};
