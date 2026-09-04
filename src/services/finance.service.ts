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
import type { FinancialTransaction, AccountsReceivable, AccountsPayable, MonthlyControl } from '../types/entities';

const TABLE_TRANSACTIONS = 'GestionTallerProd_financial_transactions';
const TABLE_AR = 'GestionTallerProd_accounts_receivable';
const TABLE_AP = 'GestionTallerProd_accounts_payable';
const TABLE_MONTHLY = 'GestionTallerProd_monthly_control';

export const FinanceService = {
  // Financial Transactions
  getTransactions: (query?: WorkflowQuery) => getEntity<FinancialTransaction>(TABLE_TRANSACTIONS, query),
  getTransactionsPaginated: (query?: WorkflowQuery) => getPaginatedEntity<FinancialTransaction>(TABLE_TRANSACTIONS, query),
  createTransaction: (data: Partial<FinancialTransaction>) =>
    createEntity<FinancialTransaction>(TABLE_TRANSACTIONS, data as Record<string, unknown>),
  updateTransaction: (id: string, data: Partial<FinancialTransaction>) =>
    updateEntity<FinancialTransaction>(TABLE_TRANSACTIONS, id, data as Record<string, unknown>),
  removeTransaction: (id: string) => deleteEntity(TABLE_TRANSACTIONS, id),

  // Accounts Receivable (AR)
  getAR: (query?: WorkflowQuery) => getEntity<AccountsReceivable>(TABLE_AR, query),
  getARPaginated: (query?: WorkflowQuery) => getPaginatedEntity<AccountsReceivable>(TABLE_AR, query),
  createAR: (data: Partial<AccountsReceivable>) =>
    createEntity<AccountsReceivable>(TABLE_AR, data as Record<string, unknown>),
  updateAR: (id: string, data: Partial<AccountsReceivable>) =>
    updateEntity<AccountsReceivable>(TABLE_AR, id, data as Record<string, unknown>),
  removeAR: (id: string) => deleteEntity(TABLE_AR, id),

  // Accounts Payable (AP)
  getAP: (query?: WorkflowQuery) => getEntity<AccountsPayable>(TABLE_AP, query),
  getAPPaginated: (query?: WorkflowQuery) => getPaginatedEntity<AccountsPayable>(TABLE_AP, query),
  createAP: (data: Partial<AccountsPayable>) =>
    createEntity<AccountsPayable>(TABLE_AP, data as Record<string, unknown>),
  updateAP: (id: string, data: Partial<AccountsPayable>) =>
    updateEntity<AccountsPayable>(TABLE_AP, id, data as Record<string, unknown>),
  removeAP: (id: string) => deleteEntity(TABLE_AP, id),

  // Monthly Control
  getMonthlyControl: (query?: WorkflowQuery) => getEntity<MonthlyControl>(TABLE_MONTHLY, query),
  createMonthlyControl: (data: Partial<MonthlyControl>) =>
    createEntity<MonthlyControl>(TABLE_MONTHLY, data as Record<string, unknown>),
};
