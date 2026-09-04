export interface BaseEntity {
  id?: string;
  created_at?: string;
  updated_at?: string;
  owner?: string;
}

export interface Client extends BaseEntity {
  client_id?: string;
  client_name: string;
  tax_id: string;
  cell_phone: string;
  home_phone?: string;
  email?: string;
  address?: string;
  registration_date?: string;
}

export interface Supplier extends BaseEntity {
  supplier_id?: string;
  supplier_name: string;
  contact_person?: string;
  address?: string;
  cell_phone?: string;
  office_phone?: string;
  email?: string;
  distributes_parts?: string;
  transport?: string;
}

export interface Vehicle extends BaseEntity {
  vehicle_id?: string;
  clients_fk_id: string;
  license_plate: string;
  brand: string;
  model: string;
  year: number;
  color?: string;
  mileage?: string;
  vehicle_type?: string;
  observations?: string;
}

export interface Employee extends BaseEntity {
  employee_id?: string;
  employee_name: string;
  tax_id: string;
  phone: string;
  email?: string;
  address?: string;
  hire_date?: string;
  contract_type?: string;
  position?: string;
  salary?: number;
  is_mechanic?: boolean;
}

export interface BodyShopOrder extends BaseEntity {
  order_id?: string;
  clients_fk_id: string;
  vehicles_fk_id: string;
  entry_date: string;
  estimated_delivery_date?: string;
  status: string;
  total_cost?: number;
}

export interface Quote extends BaseEntity {
  quote_id?: string;
  clients_fk_id: string;
  vehicles_fk_id: string;
  quote_date: string;
  valid_until?: string;
  total_amount?: number;
  status: string;
}

export interface QuoteItem extends BaseEntity {
  item_id?: string;
  quotes_fk_id: string;
  parts_catalog_fk_id: string;
  quantity: number;
  unit_price: number;
  subtotal: number;
}

export interface PartCatalog extends BaseEntity {
  part_id?: string;
  part_number: string;
  description: string;
  brand?: string;
  category: string;
  cost_price?: number;
  sale_price?: number;
  stock_quantity: number;
  minimum_stock?: number;
}

export interface BodyShopMaterial extends BaseEntity {
  material_id?: string;
  material_name: string;
  description?: string;
  unit_of_measure: string;
  cost_price?: number;
  stock_quantity: number;
}

export interface AccountsReceivable extends BaseEntity {
  ar_id?: string;
  clients_fk_id: string;
  transaction_date: string;
  payment_date?: string;
  description: string;
  debit?: number;
  credit?: number;
  balance?: number;
}

export interface AccountsPayable extends BaseEntity {
  ap_id?: string;
  suppliers_fk_id: string;
  transaction_date: string;
  due_date?: string;
  description: string;
  debit?: number;
  credit?: number;
  balance?: number;
}

export interface DeliveryNote extends BaseEntity {
  note_id?: string;
  suppliers_fk_id: string;
  note_date: string;
  total_amount?: number;
  status: string;
}

export interface DeliveryNoteItem extends BaseEntity {
  item_id?: string;
  delivery_notes_fk_id: string;
  parts_catalog_fk_id?: string;
  body_shop_materials_fk_id?: string;
  quantity: number;
  unit_price: number;
  subtotal: number;
}

export interface PendingPurchase extends BaseEntity {
  purchase_id?: string;
  parts_catalog_fk_id: string;
  request_date: string;
  quantity_needed: number;
  status: string;
}

export interface VehicleReceipt extends BaseEntity {
  receipt_id?: string;
  vehicles_fk_id: string;
  employees_fk_id: string;
  entry_date: string;
  owner_name: string;
  owner_tax_id: string;
  owner_phone: string;
  fuel_level?: string;
  mileage: string;
  observations?: string;
  status: string;
}

export interface ClientHistory extends BaseEntity {
  history_id?: string;
  clients_fk_id: string;
  vehicles_fk_id: string;
  service_date: string;
  description: string;
  total_cost?: number;
}

export interface FinancialTransaction extends BaseEntity {
  transaction_id?: string;
  transaction_date: string;
  type: string;
  category: string;
  amount: number;
  description?: string;
}

export interface InspectionCard extends BaseEntity {
  inspection_id?: string;
  clients_fk_id: string;
  vehicles_fk_id: string;
  inspection_type: string;
  inspection_date: string;
  status: string;
  cost_estimate?: number;
  observations?: string;
}

export interface InspectionVideo extends BaseEntity {
  video_id?: string;
  inspection_cards_fk_id: string;
  video_url: string;
  filename: string;
  duration?: number;
}

export interface PartNeed {
  repuesto_id: string;
  quantity: number;
}

export interface InspectionAnalysis extends BaseEntity {
  analysis_id?: string;
  inspection_cards_fk_id: string;
  damage_type: string;
  damage_severity: string;
  affected_parts: string[];
  repair_estimated_hours: number;
  parts_needed: PartNeed[];
  confidence_score: number;
  observations: string;
  recommended_actions: string[];
  status: string;
}

export interface MonthlyControl extends BaseEntity {
  control_id?: string;
  month_year: string;
  total_income?: number;
  total_expenses?: number;
  net_profit?: number;
}

export interface WorkContract extends BaseEntity {
  contract_id?: string;
  employees_fk_id: string;
  start_date: string;
  end_date?: string;
  contract_type: string;
  salary: number;
}

export interface Communication extends BaseEntity {
  comm_id?: string;
  clients_fk_id: string;
  comm_date: string;
  type: string;
  message: string;
  status: string;
}

export interface AuthUser {
  id: string;
  email: string;
  nombre: string;
  rol: string;
  owner: string;
}
