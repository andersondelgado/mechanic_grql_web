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
}

export interface VehicleReceipt extends BaseEntity {
  receipt_id?: string;
  vehicles_fk_id?: string;
  employees_fk_id?: string;
  entry_date: string;
  owner_name?: string;
  owner_tax_id?: string;
  phone?: string;
  brand: string;
  model: string;
  license_plate: string;
  color?: string;
  mileage?: string;
  exit_date?: string;
  receiving_technician?: string;
  reception_service?: string;
  address?: string;
  received_by?: string;
  delivered_by?: string;
  delivery_address?: string;
  assigned_technician?: string;
  time_in_shop?: string;
  reason_for_entry?: string;
  work_performed?: string;
  must_return?: boolean;
  pending_issues?: string;
  delivery_date?: string;
  expected_return_date?: string;
  status?: string;
}

export interface ClientHistory extends BaseEntity {
  history_id?: string;
  vehicles_fk_id: string;
  employees_fk_id?: string;
  service_date: string;
  work_performed?: string;
  assigned_mechanic?: string;
  time_in_shop?: string;
  observations?: string;
  total_cost?: number;
}

export interface Quote extends BaseEntity {
  quote_id?: string;
  vehicles_fk_id?: string;
  clients_fk_id?: string;
  quote_number?: string;
  quote_date: string;
  client_name: string;
  tax_id?: string;
  vehicle_type?: string;
  brand: string;
  model: string;
  address?: string;
  license_plate?: string;
  year?: number;
  subtotal?: number;
  total?: number;
  status?: string;
}

export interface QuoteItem extends BaseEntity {
  quote_item_id?: string;
  quotes_fk_id: string;
  item_number?: number;
  description: string;
  quantity?: number;
  unit_price?: number;
  total_price?: number;
  supplier_store?: string;
  product_name?: string;
  product_brand?: string;
  product_price?: number;
}

export interface AccountsReceivable extends BaseEntity {
  ar_id?: string;
  clients_fk_id?: string;
  transaction_date: string;
  payment_date?: string;
  description: string;
  debit?: number;
  credit?: number;
  balance?: number;
}

export interface AccountsPayable extends BaseEntity {
  ap_id?: string;
  suppliers_fk_id?: string;
  transaction_date: string;
  payment_date?: string;
  description: string;
  debit?: number;
  credit?: number;
  balance?: number;
}

export interface FinancialTransaction extends BaseEntity {
  transaction_id?: string;
  month?: string;
  transaction_date: string;
  description: string;
  minor_rep_income?: number;
  major_rep_income?: number;
  other_income?: number;
  salary_expense?: number;
  rent_expense?: number;
  supplies_expense?: number;
  tools_equipment_expense?: number;
  other_expenses?: number;
  total_expenses?: number;
  total_amount?: number;
  exchange_rate?: number;
}

export interface PartCatalog extends BaseEntity {
  part_id?: string;
  part_code: string;
  description: string;
  brand?: string;
  price_without_tax?: number;
  stock_main?: number;
  stock_caracas?: number;
  discount_1?: number;
  discounted_price_1?: number;
  discount_2?: number;
  final_discounted_price?: number;
  final_discount?: number;
  price_by_rubro?: number;
  bs_to_uro?: number;
  category?: string;
}

export interface PendingPurchase extends BaseEntity {
  pending_purchase_id?: string;
  suppliers_fk_id?: string;
  info_date: string;
  purchase_date?: string;
  product_name: string;
  supplier_name?: string;
  purchased?: boolean;
  quantity?: number;
  unit_price?: number;
  notes?: string;
}

export interface Employee extends BaseEntity {
  employee_id?: string;
  employee_name: string;
  tax_id: string;
  phone?: string;
  address?: string;
  hire_date?: string;
  employee_type?: string;
  salary?: number;
  email?: string;
  contract_type?: string;
  position?: string;
  is_mechanic?: boolean;
}

export interface DeliveryNote extends BaseEntity {
  delivery_note_id?: string;
  vehicles_fk_id?: string;
  clients_fk_id?: string;
  note_number?: string;
  note_date: string;
  client_name: string;
  tax_id?: string;
  vehicle_type?: string;
  brand?: string;
  model?: string;
  license_plate?: string;
  subtotal?: number;
  total?: number;
}

export interface DeliveryNoteItem extends BaseEntity {
  note_item_id?: string;
  delivery_notes_fk_id: string;
  item_number?: number;
  description: string;
  quantity?: number;
  unit_price?: number;
  labor_cost?: number;
  total_price?: number;
}

export interface InspectionCard extends BaseEntity {
  card_id?: string;
  vehicles_fk_id?: string;
  inspection_type: string;
  inspection_date: string;
  item_name?: string;
  check_yes?: boolean;
  check_no?: boolean;
  observations?: string;
}

export interface BodyShopMaterial extends BaseEntity {
  material_id?: string;
  piece_name: string;
  material_usage_qty?: number;
  labor_cost?: number;
  paint_amount?: number;
  hardener?: string;
  filler?: string;
  reducer?: string;
  sandpaper?: number;
  protective_paper?: number;
  wire?: number;
  bodywork?: string;
  material_cost?: number;
  paint_price?: number;
  hardener_price?: number;
  filler_price?: number;
  reducer_price?: number;
  sandpaper_price?: number;
  paper_price?: number;
  wire_price?: number;
  bodywork_price?: number;
  total_cost_per_piece?: number;
  labor_and_cost_profit?: number;
}

export interface BodyShopOrder extends BaseEntity {
  order_id?: string;
  vehicles_fk_id?: string;
  order_number: string;
  order_date: string;
  brand?: string;
  model?: string;
  license_plate?: string;
  color?: string;
  mileage?: string;
  assigned_mechanic?: string;
  work_performed?: string;
  total_cost?: number;
  profit?: number;
}

export interface MonthlyControl extends BaseEntity {
  control_id?: string;
  month: string;
  transaction_date: string;
  description: string;
  minor_rep_income?: number;
  major_rep_income?: number;
  other_income?: number;
  salary_expense?: number;
  rent_expense?: number;
  supplies_expense?: number;
  tools_equipment_expense?: number;
  other_expenses?: number;
  total_expenses?: number;
  total_amount?: number;
  exchange_rate?: number;
}

export interface WorkContract extends BaseEntity {
  contract_id?: string;
  employees_fk_id: string;
  issue_date: string;
  reason?: string;
  destination?: string;
  notes?: string;
}

export interface Communication extends BaseEntity {
  communication_id?: string;
  employees_fk_id?: string;
  communication_date: string;
  subject: string;
  communication_type?: string;
  content?: string;
}

export interface InspectionVideo extends BaseEntity {
  video_id?: string;
  inspection_cards_fk_id?: string;
  video_url: string;
  file_name?: string;
  file_size?: number;
  duration_seconds?: number;
  uploaded_at?: string;
}

export interface InspectionAnalysis extends BaseEntity {
  analysis_id?: string;
  inspection_cards_fk_id?: string;
  inspection_video_fk_id?: string;
  damage_type?: string;
  damage_severity?: 'leve' | 'moderado' | 'severo';
  affected_parts?: string[];
  repair_estimated_hours?: number;
  parts_needed?: string[];
  confidence_score?: number;
  observations?: string;
  recommended_actions?: string[];
  status?: string;
}

export interface MonthlyBreakdown {
  month: string;
  income: number;
  expenses: number;
  balance: number;
}

export interface DashboardStats {
  total_clients: number;
  total_vehicles: number;
  vehicles_in_shop: number;
  completed_repairs: number;
  total_income_month: number;
  total_expenses_month: number;
  balance_month: number;
  total_income_all: number;
  total_expenses_all: number;
  total_balance_all: number;
  accounts_receivable_total: number;
  accounts_payable_total: number;
  monthly_breakdown: MonthlyBreakdown[];
}
