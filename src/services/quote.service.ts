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
import type { Quote, QuoteItem } from '../types/entities';

const TABLE_QUOTES = 'GestionTallerProd_quotes';
const TABLE_ITEMS = 'GestionTallerProd_quote_items';

export const QuoteService = {
  getAll: (query?: WorkflowQuery) => getEntity<Quote>(TABLE_QUOTES, query),
  getPaginated: (query?: WorkflowQuery) => getPaginatedEntity<Quote>(TABLE_QUOTES, query),
  getById: (id: string) => getEntityById<Quote>(TABLE_QUOTES, id),
  getByFilter: (arrayFilter: Array<Record<string, unknown>>) =>
    getEntitiesByFilter<Quote>(TABLE_QUOTES, arrayFilter),
  create: (data: Partial<Quote>) =>
    createEntity<Quote>(TABLE_QUOTES, data as Record<string, unknown>),
  update: (id: string, data: Partial<Quote>) =>
    updateEntity<Quote>(TABLE_QUOTES, id, data as Record<string, unknown>),
  remove: (id: string) => deleteEntity(TABLE_QUOTES, id),

  // Quote Items
  getItemsByQuoteId: (quoteId: string) =>
    getEntitiesByFilter<QuoteItem>(TABLE_ITEMS, [{ quotes_fk_id: quoteId }]),
  createItem: (data: Partial<QuoteItem>) =>
    createEntity<QuoteItem>(TABLE_ITEMS, data as Record<string, unknown>),
  updateItem: (id: string, data: Partial<QuoteItem>) =>
    updateEntity<QuoteItem>(TABLE_ITEMS, id, data as Record<string, unknown>),
  removeItem: (id: string) => deleteEntity(TABLE_ITEMS, id),
};
