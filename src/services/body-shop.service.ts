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
import type { BodyShopMaterial, BodyShopOrder } from '../types/entities';

const TABLE_MATERIALS = 'GestionTallerProd_body_shop_materials';
const TABLE_ORDERS = 'GestionTallerProd_body_shop_orders';

export const BodyShopService = {
  // Materials
  getMaterials: (query?: WorkflowQuery) => getEntity<BodyShopMaterial>(TABLE_MATERIALS, query),
  getMaterialsPaginated: (query?: WorkflowQuery) => getPaginatedEntity<BodyShopMaterial>(TABLE_MATERIALS, query),
  createMaterial: (data: Partial<BodyShopMaterial>) =>
    createEntity<BodyShopMaterial>(TABLE_MATERIALS, data as Record<string, unknown>),
  updateMaterial: (id: string, data: Partial<BodyShopMaterial>) =>
    updateEntity<BodyShopMaterial>(TABLE_MATERIALS, id, data as Record<string, unknown>),
  removeMaterial: (id: string) => deleteEntity(TABLE_MATERIALS, id),

  // Orders
  getOrders: (query?: WorkflowQuery) => getEntity<BodyShopOrder>(TABLE_ORDERS, query),
  getOrdersPaginated: (query?: WorkflowQuery) => getPaginatedEntity<BodyShopOrder>(TABLE_ORDERS, query),
  getOrderById: (id: string) => getEntityById<BodyShopOrder>(TABLE_ORDERS, id),
  createOrder: (data: Partial<BodyShopOrder>) =>
    createEntity<BodyShopOrder>(TABLE_ORDERS, data as Record<string, unknown>),
  updateOrder: (id: string, data: Partial<BodyShopOrder>) =>
    updateEntity<BodyShopOrder>(TABLE_ORDERS, id, data as Record<string, unknown>),
  removeOrder: (id: string) => deleteEntity(TABLE_ORDERS, id),
};
