import { useGrqlList, useGrqlItem } from "./use-grql";
import { PartCatalog, BodyShopMaterial, AccountsReceivable, FinancialTransaction, PendingPurchase, WorkContract } from "../types/entities";

export const useRepuestos = () => useGrqlList<PartCatalog[]>("GestionTallerProd_parts_catalog");
export const useRepuesto = (id: string) => useGrqlItem<PartCatalog>("GestionTallerProd_parts_catalog", id);

export const useMateriales = () => useGrqlList<BodyShopMaterial[]>("GestionTallerProd_body_shop_materials");
export const useMaterial = (id: string) => useGrqlItem<BodyShopMaterial>("GestionTallerProd_body_shop_materials", id);

export const useFacturas = () => useGrqlList<AccountsReceivable[]>("GestionTallerProd_accounts_receivable");
export const useFactura = (id: string) => useGrqlItem<AccountsReceivable>("GestionTallerProd_accounts_receivable", id);

export const usePagos = () => useGrqlList<FinancialTransaction[]>("GestionTallerProd_financial_transactions");
export const usePago = (id: string) => useGrqlItem<FinancialTransaction>("GestionTallerProd_financial_transactions", id);

export const useInventario = () => useGrqlList<PendingPurchase[]>("GestionTallerProd_pending_purchases");
export const useInventarioItem = (id: string) => useGrqlItem<PendingPurchase>("GestionTallerProd_pending_purchases", id);

export const useManoObra = () => useGrqlList<WorkContract[]>("GestionTallerProd_work_contracts");
export const usoManoObra = (id: string) => useGrqlItem<WorkContract>("GestionTallerProd_work_contracts", id);
