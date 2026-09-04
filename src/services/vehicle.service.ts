import { getEntity, getEntityById, getEntitiesByFilter, createEntity, updateEntity, deleteEntity } from '../api/client';
import type { WorkflowQuery } from '../api/workflow.types';
import type { Vehicle } from '../types/entities';

const TABLE = 'GestionTallerProd_vehicles';

export const VehicleService = {
  getAll: (query?: WorkflowQuery) => getEntity<Vehicle>(TABLE, query),
  getById: (id: string) => getEntityById<Vehicle>(TABLE, id),
  getByFilter: (arrayFilter: Array<Record<string, unknown>>) => getEntitiesByFilter<Vehicle>(TABLE, arrayFilter),
  create: (data: Partial<Vehicle>) => createEntity<Vehicle>(TABLE, data as Record<string, unknown>),
  update: (id: string, data: Partial<Vehicle>) => updateEntity<Vehicle>(TABLE, id, data as Record<string, unknown>),
  remove: (id: string) => deleteEntity(TABLE, id),
};
