import { getEntity, getEntityById, createEntity, updateEntity, deleteEntity } from '../api/client';
import type { WorkflowQuery } from '../api/workflow.types';
import type { BodyShopOrder, Quote, QuoteItem, DeliveryNoteItem } from '../types/entities';

export const OrderService = {
  getOrders: (q?: WorkflowQuery) => getEntity<BodyShopOrder>('GestionTallerProd_body_shop_orders', q),
  getOrderById: (id: string) => getEntityById<BodyShopOrder>('GestionTallerProd_body_shop_orders', id),
  createOrder: (d: Partial<BodyShopOrder>) => createEntity<BodyShopOrder>('GestionTallerProd_body_shop_orders', d as Record<string, unknown>),
  updateOrder: (id: string, d: Partial<BodyShopOrder>) => updateEntity<BodyShopOrder>('GestionTallerProd_body_shop_orders', id, d as Record<string, unknown>),
  removeOrder: (id: string) => deleteEntity('GestionTallerProd_body_shop_orders', id),

  getQuotes: (q?: WorkflowQuery) => getEntity<Quote>('GestionTallerProd_quotes', q),
  getQuoteById: (id: string) => getEntityById<Quote>('GestionTallerProd_quotes', id),
  createQuote: (d: Partial<Quote>) => createEntity<Quote>('GestionTallerProd_quotes', d as Record<string, unknown>),
  updateQuote: (id: string, d: Partial<Quote>) => updateEntity<Quote>('GestionTallerProd_quotes', id, d as Record<string, unknown>),
  removeQuote: (id: string) => deleteEntity('GestionTallerProd_quotes', id),

  getQuoteItems: (q?: WorkflowQuery) => getEntity<QuoteItem>('GestionTallerProd_quote_items', q),
  getDeliveryNoteItems: (q?: WorkflowQuery) => getEntity<DeliveryNoteItem>('GestionTallerProd_delivery_note_items', q),
};
