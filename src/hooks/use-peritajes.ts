import { useGrqlList, useGrqlItem } from "./use-grql";
import { InspectionCard, InspectionVideo, InspectionAnalysis, DeliveryNoteItem, QuoteItem } from "../types/entities";

export const usePeritajes = () => useGrqlList<InspectionCard[]>("GestionTallerProd_inspection_cards");
export const usePeritaje = (id: string) => useGrqlItem<InspectionCard>("GestionTallerProd_inspection_cards", id);

export const usePeritajeVideos = () => useGrqlList<InspectionVideo[]>("GestionTallerProd_inspection_video");
export const usePeritajeAnalysis = () => useGrqlList<InspectionAnalysis[]>("GestionTallerProd_inspection_analysis");

export const useOrdenesRepuesto = () => useGrqlList<DeliveryNoteItem[]>("GestionTallerProd_delivery_note_items");
export const useOrdenRepuesto = (id: string) => useGrqlItem<DeliveryNoteItem>("GestionTallerProd_delivery_note_items", id);

export const useOrdenesMaterial = () => useGrqlList<QuoteItem[]>("GestionTallerProd_quote_items");
export const useOrdenMaterial = (id: string) => useGrqlItem<QuoteItem>("GestionTallerProd_quote_items", id);
