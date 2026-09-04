import { getEntity, getEntityById, createEntity, updateEntity, deleteEntity } from '../api/client';
import type { WorkflowQuery } from '../api/workflow.types';
import type { PartCatalog, BodyShopMaterial, PendingPurchase, AccountsReceivable, FinancialTransaction, WorkContract } from '../types/entities';

export const InventoryService = {
  getParts: (q?: WorkflowQuery) => getEntity<PartCatalog>('GestionTallerProd_parts_catalog', q),
  getPartById: (id: string) => getEntityById<PartCatalog>('GestionTallerProd_parts_catalog', id),
  createPart: (d: Partial<PartCatalog>) => createEntity<PartCatalog>('GestionTallerProd_parts_catalog', d as Record<string, unknown>),
  updatePart: (id: string, d: Partial<PartCatalog>) => updateEntity<PartCatalog>('GestionTallerProd_parts_catalog', id, d as Record<string, unknown>),
  removePart: (id: string) => deleteEntity('GestionTallerProd_parts_catalog', id),

  getMaterials: (q?: WorkflowQuery) => getEntity<BodyShopMaterial>('GestionTallerProd_body_shop_materials', q),
  getPendingPurchases: (q?: WorkflowQuery) => getEntity<PendingPurchase>('GestionTallerProd_pending_purchases', q),

  getReceivables: (q?: WorkflowQuery) => getEntity<AccountsReceivable>('GestionTallerProd_accounts_receivable', q),
  getTransactions: (q?: WorkflowQuery) => getEntity<FinancialTransaction>('GestionTallerProd_financial_transactions', q),

  getWorkContracts: (q?: WorkflowQuery) => getEntity<WorkContract>('GestionTallerProd_work_contracts', q),
};
