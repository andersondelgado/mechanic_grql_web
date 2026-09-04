import { useGrqlList, useGrqlItem } from "./use-grql";
import { Client, Vehicle, Supplier, Employee, BodyShopOrder, Quote } from "../types/entities";

export const useClientes = () => useGrqlList<Client[]>("GestionTallerProd_clients");
export const useCliente = (id: string) => useGrqlItem<Client>("GestionTallerProd_clients", id);

export const useVehiculos = () => useGrqlList<Vehicle[]>("GestionTallerProd_vehicles");
export const useVehiculo = (id: string) => useGrqlItem<Vehicle>("GestionTallerProd_vehicles", id);

export const useProveedores = () => useGrqlList<Supplier[]>("GestionTallerProd_suppliers");
export const useProveedor = (id: string) => useGrqlItem<Supplier>("GestionTallerProd_suppliers", id);

export const useEmpleados = () => useGrqlList<Employee[]>("GestionTallerProd_employees");
export const useEmpleado = (id: string) => useGrqlItem<Employee>("GestionTallerProd_employees", id);

export const useOrdenes = () => useGrqlList<BodyShopOrder[]>("GestionTallerProd_body_shop_orders");
export const useOrden = (id: string) => useGrqlItem<BodyShopOrder>("GestionTallerProd_body_shop_orders", id);

export const useCotizaciones = () => useGrqlList<Quote[]>("GestionTallerProd_quotes");
export const useCotizacion = (id: string) => useGrqlItem<Quote>("GestionTallerProd_quotes", id);
