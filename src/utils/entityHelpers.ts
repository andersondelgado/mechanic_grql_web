/**
 * entityHelpers.ts
 * Utilidades para resolver identificadores y asociaciones entre Clientes, Vehículos y Empleados
 * a través de distintas estructuras devueltas por gRQL / Lambdas.
 */

/**
 * Resuelve el identificador de un vehículo de forma robusta a partir de un registro (historial, cotización, etc.)
 * y opcionalmente de la lista de vehículos disponibles en memoria.
 */
export function resolveVehicleId(item: any, vehiculosList?: any[]): string {
  if (!item) return '';

  // 1. Extraer ID directo de vehicles_fk_id
  let vId = item.vehicles_fk_id;
  if (Array.isArray(vId) && vId.length > 0) {
    const first = vId[0];
    vId = typeof first === 'object' ? (first?.id || first?.vehicle_id || first?._id) : first;
  } else if (vId && typeof vId === 'object') {
    vId = vId.id || vId.vehicle_id || vId._id;
  }

  // 2. Extraer ID de la relación vehicles si vehicles_fk_id no estaba definido
  if (!vId && Array.isArray(item.vehicles) && item.vehicles.length > 0) {
    const first = item.vehicles[0];
    vId = typeof first === 'object' ? (first?.id || first?.vehicle_id || first?._id) : first;
  } else if (!vId && item.vehicle && typeof item.vehicle === 'object') {
    vId = item.vehicle.id || item.vehicle.vehicle_id || item.vehicle._id;
  }

  // 3. Si tenemos ID y la lista de vehículos, verificar coincidencia exacta por ID
  if (vId && vehiculosList && vehiculosList.length > 0) {
    const strId = String(vId);
    const foundById = vehiculosList.find((v: any) =>
      (v.id && String(v.id) === strId) ||
      (v.vehicle_id && String(v.vehicle_id) === strId) ||
      (v._id && String(v._id) === strId)
    );
    if (foundById) {
      return foundById.id || foundById.vehicle_id || foundById._id || strId;
    }
  }

  // 4. Búsqueda por placa (license_plate) como fallback en la lista de vehículos
  const targetPlate = item.license_plate || item.plate || item.vehicles?.[0]?.license_plate || item.vehicle?.license_plate;
  if (targetPlate && vehiculosList && vehiculosList.length > 0) {
    const cleanPlate = String(targetPlate).trim().toUpperCase();
    const foundByPlate = vehiculosList.find((v: any) =>
      v.license_plate && String(v.license_plate).trim().toUpperCase() === cleanPlate
    );
    if (foundByPlate) {
      return foundByPlate.id || foundByPlate.vehicle_id || foundByPlate._id || '';
    }
  }

  return typeof vId === 'string' ? vId : (vId ? String(vId) : '');
}

/**
 * Resuelve el identificador de un cliente de forma robusta a partir de un registro y la lista de clientes.
 */
export function resolveClientId(item: any, clientesList?: any[]): string {
  if (!item) return '';

  let cId = item.clients_fk_id;
  if (Array.isArray(cId) && cId.length > 0) {
    const first = cId[0];
    cId = typeof first === 'object' ? (first?.id || first?.client_id || first?._id) : first;
  } else if (cId && typeof cId === 'object') {
    cId = cId.id || cId.client_id || cId._id;
  }

  if (!cId && Array.isArray(item.clients) && item.clients.length > 0) {
    const first = item.clients[0];
    cId = typeof first === 'object' ? (first?.id || first?.client_id || first?._id) : first;
  } else if (!cId && item.client && typeof item.client === 'object') {
    cId = item.client.id || item.client.client_id || item.client._id;
  }

  if (cId && clientesList && clientesList.length > 0) {
    const strId = String(cId);
    const found = clientesList.find((c: any) =>
      (c.id && String(c.id) === strId) ||
      (c.client_id && String(c.client_id) === strId) ||
      (c._id && String(c._id) === strId)
    );
    if (found) {
      return found.id || found.client_id || found._id || strId;
    }
  }

  // Fallback por tax_id / cédula / RIF
  const targetTaxId = item.tax_id || item.owner_tax_id || item.clients?.[0]?.tax_id;
  if (targetTaxId && clientesList && clientesList.length > 0) {
    const cleanTax = String(targetTaxId).trim().toUpperCase();
    const found = clientesList.find((c: any) =>
      c.tax_id && String(c.tax_id).trim().toUpperCase() === cleanTax
    );
    if (found) {
      return found.id || found.client_id || found._id || '';
    }
  }

  // Fallback por nombre de cliente
  const targetName = item.client_name || item.owner_name || item.clients?.[0]?.client_name;
  if (targetName && clientesList && clientesList.length > 0) {
    const cleanName = String(targetName).trim().toLowerCase();
    const found = clientesList.find((c: any) =>
      c.client_name && String(c.client_name).trim().toLowerCase() === cleanName
    );
    if (found) {
      return found.id || found.client_id || found._id || '';
    }
  }

  return typeof cId === 'string' ? cId : (cId ? String(cId) : '');
}

/**
 * Resuelve el identificador de un empleado/mecánico a partir de un registro y la lista de empleados.
 */
export function resolveEmployeeId(item: any, empleadosList?: any[]): string {
  if (!item) return '';

  let eId = item.employees_fk_id;
  if (Array.isArray(eId) && eId.length > 0) {
    const first = eId[0];
    eId = typeof first === 'object' ? (first?.id || first?.employee_id || first?._id) : first;
  } else if (eId && typeof eId === 'object') {
    eId = eId.id || eId.employee_id || eId._id;
  }

  if (!eId && Array.isArray(item.employees) && item.employees.length > 0) {
    const first = item.employees[0];
    eId = typeof first === 'object' ? (first?.id || first?.employee_id || first?._id) : first;
  } else if (!eId && item.employee && typeof item.employee === 'object') {
    eId = item.employee.id || item.employee.employee_id || item.employee._id;
  }

  if (eId && empleadosList && empleadosList.length > 0) {
    const strId = String(eId);
    const found = empleadosList.find((e: any) =>
      (e.id && String(e.id) === strId) ||
      (e.employee_id && String(e.employee_id) === strId) ||
      (e._id && String(e._id) === strId)
    );
    if (found) {
      return found.id || found.employee_id || found._id || strId;
    }
  }

  // Fallback por nombre de mecánico
  const mechanicName = item.assigned_mechanic || item.mechanic_name || item.employees?.[0]?.employee_name;
  if (mechanicName && empleadosList && empleadosList.length > 0) {
    const cleanName = String(mechanicName).trim().toLowerCase();
    const found = empleadosList.find((e: any) =>
      (e.employee_name && String(e.employee_name).trim().toLowerCase() === cleanName) ||
      (`${e.first_name || ''} ${e.last_name || ''}`.trim().toLowerCase() === cleanName)
    );
    if (found) {
      return found.id || found.employee_id || found._id || '';
    }
  }

  return typeof eId === 'string' ? eId : (eId ? String(eId) : '');
}

/**
 * Resuelve el identificador de un proveedor a partir de un registro y la lista de proveedores.
 */
export function resolveSupplierId(item: any, proveedoresList?: any[]): string {
  if (!item) return '';

  let sId = item.suppliers_fk_id;
  if (Array.isArray(sId) && sId.length > 0) {
    const first = sId[0];
    sId = typeof first === 'object' ? (first?.id || first?.supplier_id || first?._id) : first;
  } else if (sId && typeof sId === 'object') {
    sId = sId.id || sId.supplier_id || sId._id;
  }

  if (!sId && Array.isArray(item.suppliers) && item.suppliers.length > 0) {
    const first = item.suppliers[0];
    sId = typeof first === 'object' ? (first?.id || first?.supplier_id || first?._id) : first;
  } else if (!sId && item.supplier && typeof item.supplier === 'object') {
    sId = item.supplier.id || item.supplier.supplier_id || item.supplier._id;
  }

  if (sId && proveedoresList && proveedoresList.length > 0) {
    const strId = String(sId);
    const found = proveedoresList.find((p: any) =>
      (p.id && String(p.id) === strId) ||
      (p.supplier_id && String(p.supplier_id) === strId) ||
      (p._id && String(p._id) === strId)
    );
    if (found) {
      return found.id || found.supplier_id || found._id || strId;
    }
  }

  // Fallback por nombre de proveedor
  const supName = item.supplier_name || item.suppliers?.[0]?.supplier_name;
  if (supName && proveedoresList && proveedoresList.length > 0) {
    const cleanName = String(supName).trim().toLowerCase();
    const found = proveedoresList.find((p: any) =>
      p.supplier_name && String(p.supplier_name).trim().toLowerCase() === cleanName
    );
    if (found) {
      return found.id || found.supplier_id || found._id || '';
    }
  }

  return typeof sId === 'string' ? sId : (sId ? String(sId) : '');
}

/**
 * Determina si un vehículo pertenece a un cliente específico.
 */
export function isVehicleOfClient(vehicle: any, client: any): boolean {
  if (!vehicle || !client) return false;

  const clientId = client.id || client.client_id || client._id;
  const clientTaxId = client.tax_id ? String(client.tax_id).trim().toUpperCase() : '';
  const clientName = client.client_name ? String(client.client_name).trim().toLowerCase() : '';

  // 1. Por clave foránea clients_fk_id
  if (clientId) {
    const strClientId = String(clientId);
    const vClientFk = vehicle.clients_fk_id;
    if (vClientFk) {
      if (typeof vClientFk === 'string' && String(vClientFk) === strClientId) return true;
      if (Array.isArray(vClientFk)) {
        if (vClientFk.some((item: any) => {
          const id = typeof item === 'object' ? (item.id || item.client_id || item._id) : item;
          return id && String(id) === strClientId;
        })) return true;
      }
      if (typeof vClientFk === 'object') {
        const id = vClientFk.id || vClientFk.client_id || vClientFk._id;
        if (id && String(id) === strClientId) return true;
      }
    }

    if (Array.isArray(vehicle.clients)) {
      if (vehicle.clients.some((c: any) => {
        const id = c.id || c.client_id || c._id;
        return id && String(id) === strClientId;
      })) return true;
    }

    if (vehicle.client && typeof vehicle.client === 'object') {
      const id = vehicle.client.id || vehicle.client.client_id || vehicle.client._id;
      if (id && String(id) === strClientId) return true;
    }
  }

  // 2. Por relación inversa en client.vehicles
  if (Array.isArray(client.vehicles) && client.vehicles.length > 0) {
    const vId = vehicle.id || vehicle.vehicle_id || vehicle._id;
    const vPlate = vehicle.license_plate ? String(vehicle.license_plate).trim().toUpperCase() : '';
    const match = client.vehicles.some((cv: any) => {
      const cvId = typeof cv === 'object' ? (cv.id || cv.vehicle_id || cv._id) : cv;
      const cvPlate = typeof cv === 'object' && cv.license_plate ? String(cv.license_plate).trim().toUpperCase() : '';
      return (vId && cvId && String(vId) === String(cvId)) || (vPlate && cvPlate && vPlate === cvPlate);
    });
    if (match) return true;
  }

  // 3. Por tax_id / owner_tax_id
  if (clientTaxId) {
    const vTax = vehicle.owner_tax_id || vehicle.tax_id || vehicle.client_tax_id;
    if (vTax && String(vTax).trim().toUpperCase() === clientTaxId) return true;
  }

  // 4. Por owner_name / client_name
  if (clientName) {
    const vName = vehicle.owner_name || vehicle.client_name;
    if (vName && String(vName).trim().toLowerCase() === clientName) return true;
  }

  return false;
}

/**
 * Obtiene todos los vehículos asociados a un cliente (acepta objeto cliente o clientId).
 */
export function getVehiclesForClient(clientOrId: any, vehiculosList?: any[], clientesList?: any[]): any[] {
  if (!clientOrId || !vehiculosList || vehiculosList.length === 0) return [];
  let clientObj = clientOrId;
  if (typeof clientOrId === 'string') {
    const strId = clientOrId.trim();
    if (clientesList && clientesList.length > 0) {
      const found = clientesList.find((c: any) =>
        (c.id && String(c.id) === strId) ||
        (c.client_id && String(c.client_id) === strId) ||
        (c._id && String(c._id) === strId)
      );
      clientObj = found || { id: clientOrId };
    } else {
      clientObj = { id: clientOrId };
    }
  }
  return vehiculosList.filter((v: any) => isVehicleOfClient(v, clientObj));
}

/**
 * Encuentra el primer vehículo asociado a un cliente.
 */
export function findVehicleForClient(clientOrId: any, vehiculosList?: any[], clientesList?: any[]): any | null {
  const matches = getVehiclesForClient(clientOrId, vehiculosList, clientesList);
  return matches.length > 0 ? matches[0] : null;
}

/**
 * Encuentra el cliente asociado a un vehículo específico.
 */
export function findClientForVehicle(vehicle: any, clientesList?: any[]): any | null {
  if (!vehicle || !clientesList || clientesList.length === 0) return null;
  return clientesList.find((c: any) => isVehicleOfClient(vehicle, c)) || null;
}
