/**
 * ClientService — Patrón Lusiana adaptado para MECHANIC.
 * Encapsula el CRUD de GestionTallerProd_clients con payloads tipados.
 */
import {
  workflowJson,
  getEntity,
  getEntityById,
  getEntitiesByFilter,
  createEntity,
  updateEntity,
  deleteEntity,
} from '../api/client';
import type { WorkflowQuery } from '../api/workflow.types';
import type { Client } from '../types/entities';

const TABLE = 'GestionTallerProd_clients';

export const ClientService = {
  getAll: (query?: WorkflowQuery) => getEntity<Client>(TABLE, query),
  getById: (id: string) => getEntityById<Client>(TABLE, id),
  getByFilter: (arrayFilter: Array<Record<string, unknown>>) =>
    getEntitiesByFilter<Client>(TABLE, arrayFilter),
  create: (data: Partial<Client>) =>
    createEntity<Client>(TABLE, data as Record<string, unknown>),
  update: (id: string, data: Partial<Client>) =>
    updateEntity<Client>(TABLE, id, data as Record<string, unknown>),
  remove: (id: string) => deleteEntity(TABLE, id),
};
