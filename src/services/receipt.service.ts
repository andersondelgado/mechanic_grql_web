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
import type { VehicleReceipt } from '../types/entities';

const TABLE = 'GestionTallerProd_vehicle_receipts';

export const ReceiptService = {
  getAll: (query?: WorkflowQuery) => getEntity<VehicleReceipt>(TABLE, query),
  getPaginated: (query?: WorkflowQuery) => getPaginatedEntity<VehicleReceipt>(TABLE, query),
  getById: (id: string) => getEntityById<VehicleReceipt>(TABLE, id),
  getByFilter: (arrayFilter: Array<Record<string, unknown>>) =>
    getEntitiesByFilter<VehicleReceipt>(TABLE, arrayFilter),
  create: (data: Partial<VehicleReceipt>) =>
    createEntity<VehicleReceipt>(TABLE, data as Record<string, unknown>),
  update: (id: string, data: Partial<VehicleReceipt>) =>
    updateEntity<VehicleReceipt>(TABLE, id, data as Record<string, unknown>),
  remove: (id: string) => deleteEntity(TABLE, id),
};
