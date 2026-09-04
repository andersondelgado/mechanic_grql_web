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
import type { Employee, WorkContract, Communication } from '../types/entities';

const TABLE_EMPLOYEES = 'GestionTallerProd_employees';
const TABLE_CONTRACTS = 'GestionTallerProd_work_contracts';
const TABLE_COMMS = 'GestionTallerProd_communications';

export const EmployeeService = {
  // Employees
  getAll: (query?: WorkflowQuery) => getEntity<Employee>(TABLE_EMPLOYEES, query),
  getPaginated: (query?: WorkflowQuery) => getPaginatedEntity<Employee>(TABLE_EMPLOYEES, query),
  getById: (id: string) => getEntityById<Employee>(TABLE_EMPLOYEES, id),
  getByFilter: (arrayFilter: Array<Record<string, unknown>>) =>
    getEntitiesByFilter<Employee>(TABLE_EMPLOYEES, arrayFilter),
  create: (data: Partial<Employee>) =>
    createEntity<Employee>(TABLE_EMPLOYEES, data as Record<string, unknown>),
  update: (id: string, data: Partial<Employee>) =>
    updateEntity<Employee>(TABLE_EMPLOYEES, id, data as Record<string, unknown>),
  remove: (id: string) => deleteEntity(TABLE_EMPLOYEES, id),

  // Work Contracts
  getContracts: (query?: WorkflowQuery) => getEntity<WorkContract>(TABLE_CONTRACTS, query),
  getContractsPaginated: (query?: WorkflowQuery) => getPaginatedEntity<WorkContract>(TABLE_CONTRACTS, query),
  createContract: (data: Partial<WorkContract>) =>
    createEntity<WorkContract>(TABLE_CONTRACTS, data as Record<string, unknown>),
  updateContract: (id: string, data: Partial<WorkContract>) =>
    updateEntity<WorkContract>(TABLE_CONTRACTS, id, data as Record<string, unknown>),
  removeContract: (id: string) => deleteEntity(TABLE_CONTRACTS, id),

  // Communications
  getCommunications: (query?: WorkflowQuery) => getEntity<Communication>(TABLE_COMMS, query),
  getCommunicationsPaginated: (query?: WorkflowQuery) => getPaginatedEntity<Communication>(TABLE_COMMS, query),
  createCommunication: (data: Partial<Communication>) =>
    createEntity<Communication>(TABLE_COMMS, data as Record<string, unknown>),
  updateCommunication: (id: string, data: Partial<Communication>) =>
    updateEntity<Communication>(TABLE_COMMS, id, data as Record<string, unknown>),
  removeCommunication: (id: string) => deleteEntity(TABLE_COMMS, id),
};
