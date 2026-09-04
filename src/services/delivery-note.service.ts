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
import type { DeliveryNote, DeliveryNoteItem } from '../types/entities';

const TABLE_NOTES = 'GestionTallerProd_delivery_notes';
const TABLE_ITEMS = 'GestionTallerProd_delivery_note_items';

export const DeliveryNoteService = {
  getAll: (query?: WorkflowQuery) => getEntity<DeliveryNote>(TABLE_NOTES, query),
  getPaginated: (query?: WorkflowQuery) => getPaginatedEntity<DeliveryNote>(TABLE_NOTES, query),
  getById: (id: string) => getEntityById<DeliveryNote>(TABLE_NOTES, id),
  getByFilter: (arrayFilter: Array<Record<string, unknown>>) =>
    getEntitiesByFilter<DeliveryNote>(TABLE_NOTES, arrayFilter),
  create: (data: Partial<DeliveryNote>) =>
    createEntity<DeliveryNote>(TABLE_NOTES, data as Record<string, unknown>),
  update: (id: string, data: Partial<DeliveryNote>) =>
    updateEntity<DeliveryNote>(TABLE_NOTES, id, data as Record<string, unknown>),
  remove: (id: string) => deleteEntity(TABLE_NOTES, id),

  // Items
  getItemsByNoteId: (noteId: string) =>
    getEntitiesByFilter<DeliveryNoteItem>(TABLE_ITEMS, [{ delivery_notes_fk_id: noteId }]),
  createItem: (data: Partial<DeliveryNoteItem>) =>
    createEntity<DeliveryNoteItem>(TABLE_ITEMS, data as Record<string, unknown>),
  updateItem: (id: string, data: Partial<DeliveryNoteItem>) =>
    updateEntity<DeliveryNoteItem>(TABLE_ITEMS, id, data as Record<string, unknown>),
  removeItem: (id: string) => deleteEntity(TABLE_ITEMS, id),
};
