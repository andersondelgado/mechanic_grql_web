import React, { useState, useEffect } from "react";
import { createEntity, updateEntity } from "../../api/client";
import { useGrqlList } from "../../hooks/use-grql";
import {
  resolveVehicleId,
  resolveClientId,
  findVehicleForClient,
  getVehiclesForClient,
  findClientForVehicle
} from "../../utils/entityHelpers";

interface OrdenModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => void;
  orden?: any;
}

export default function OrdenModal({ isOpen, onClose, onSuccess, orden }: OrdenModalProps) {
  const [formData, setFormData] = useState<any>({
    status: 'pendiente',
    entry_date: new Date().toISOString().split('T')[0]
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const { data: clientes } = useGrqlList<any[]>("GestionTallerProd_clients", {
    pagination: { page: 1, size: 500 }
  });
  const { data: vehiculos } = useGrqlList<any[]>("GestionTallerProd_vehicles", {
    pagination: { page: 1, size: 500 }
  });

  useEffect(() => {
    if (isOpen) {
      if (orden) {
        const clientId = resolveClientId(orden, clientes || undefined);
        const vehicleId = resolveVehicleId(orden, vehiculos || undefined);

        const rawDate = orden.entry_date || orden.order_date || orden.created_at || '';
        const entryDate = rawDate ? String(rawDate).replace(' ', 'T').split('T')[0] : new Date().toISOString().split('T')[0];

        const totalCost = orden.total_cost ?? orden.estimated_cost ?? orden.cost ?? 0;
        const description = orden.description || orden.repair_details || orden.notes || '';

        setFormData((prev: any) => ({
          ...orden,
          clients_fk_id: clientId || prev.clients_fk_id || '',
          vehicles_fk_id: vehicleId || prev.vehicles_fk_id || '',
          entry_date: entryDate,
          status: orden.status || 'pendiente',
          total_cost: totalCost,
          description: description
        }));
      } else {
        setFormData({
          status: 'pendiente',
          entry_date: new Date().toISOString().split('T')[0],
          total_cost: 0,
          description: ''
        });
      }
      setError(null);
    }
  }, [isOpen, orden, clientes, vehiculos]);

  if (!isOpen) return null;

  const handleFieldChange = (field: string, value: any) => {
    setFormData((prev: any) => ({ ...prev, [field]: value }));
  };

  const handleClientSelect = (clientId: string) => {
    const client = clientes?.find((c: any) => (c.id || c.client_id || c._id) === clientId);
    const clientVehiclesList = getVehiclesForClient(client, vehiculos || undefined);

    setFormData((prev: any) => {
      const updated = { ...prev, clients_fk_id: clientId };
      const currentIsOfClient = clientVehiclesList.some(
        (v: any) => (v.id || v.vehicle_id || v._id) === prev.vehicles_fk_id
      );

      const targetVehicle = currentIsOfClient
        ? clientVehiclesList.find((v: any) => (v.id || v.vehicle_id || v._id) === prev.vehicles_fk_id)
        : (clientVehiclesList.length > 0 ? clientVehiclesList[0] : null);

      if (targetVehicle) {
        const vId = targetVehicle.id || targetVehicle.vehicle_id || targetVehicle._id;
        updated.vehicles_fk_id = vId;
      } else {
        updated.vehicles_fk_id = '';
      }
      return updated;
    });
  };

  const handleVehicleSelect = (vehicleId: string) => {
    const vehicle = vehiculos?.find((v: any) => (v.id || v.vehicle_id || v._id) === vehicleId);

    setFormData((prev: any) => {
      const updated = { ...prev, vehicles_fk_id: vehicleId };
      if (vehicle) {
        const associatedClient = findClientForVehicle(vehicle, clientes || undefined);
        if (associatedClient) {
          const cId = associatedClient.id || associatedClient.client_id || associatedClient._id;
          if (!updated.clients_fk_id || updated.clients_fk_id !== cId) {
            updated.clients_fk_id = cId;
          }
        }
      }
      return updated;
    });
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);
    try {
      if (orden?.id) {
        await updateEntity("GestionTallerProd_body_shop_orders", orden.id, formData);
      } else {
        await createEntity("GestionTallerProd_body_shop_orders", formData);
      }
      onSuccess();
      onClose();
    } catch (err: any) {
      setError(err.message || "Error al guardar la orden de trabajo");
    } finally {
      setLoading(false);
    }
  };

  const handleBackdropClick = (e: React.MouseEvent) => {
    if (e.target === e.currentTarget) {
      onClose();
    }
  };

  const selectedClient = clientes?.find((c: any) => (c.id || c.client_id || c._id) === formData.clients_fk_id);
  const clientVehicles = selectedClient ? getVehiclesForClient(selectedClient, vehiculos || undefined) : [];
  const otherVehicles = clientVehicles.length > 0
    ? (vehiculos || []).filter((v: any) => {
        const vId = v.id || v.vehicle_id || v._id;
        return !clientVehicles.some((cv: any) => (cv.id || cv.vehicle_id || cv._id) === vId);
      })
    : (vehiculos || []);

  return (
    <div 
      className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center p-4 overflow-y-auto"
      onClick={handleBackdropClick}
    >
      <div className="bg-white rounded-3xl shadow-strong max-w-2xl w-full my-8 mx-auto animate-fadeIn" onClick={(e) => e.stopPropagation()}>
        <div className="p-6 border-b border-gray-100 flex items-center justify-between">
          <h3 className="text-xl font-bold text-secondary flex items-center gap-2">
            <i className="fas fa-clipboard-list text-primary"></i>
            {orden ? "Editar Orden de Trabajo" : "Nueva Orden de Trabajo"}
          </h3>
          <button type="button" onClick={onClose} className="p-2 hover:bg-gray-100 rounded-xl transition">
            <i className="fas fa-times text-gray-500"></i>
          </button>
        </div>
        
        <form onSubmit={handleSubmit}>
          <div className="p-6">
            {error && (
              <div className="bg-red-50 text-red-600 p-4 rounded-xl mb-6 flex items-center gap-2 text-sm font-semibold border border-red-200">
                <i className="fas fa-exclamation-circle"></i> {error}
              </div>
            )}
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-2">Cliente *</label>
                <select
                  required
                  value={formData.clients_fk_id || ""}
                  onChange={e => handleClientSelect(e.target.value)}
                  className="w-full px-4 py-2.5 border-2 border-gray-200 rounded-xl focus:ring-2 focus:ring-primary/30 focus:border-primary/50 transition outline-none text-sm bg-white font-medium"
                >
                  <option value="">Seleccionar cliente...</option>
                  {formData.clients_fk_id && !clientes?.some((c: any) => (c.id || c.client_id || c._id) === formData.clients_fk_id) && (
                    <option value={formData.clients_fk_id}>
                      {orden?.client_name || 'Cliente actual'} {orden?.tax_id ? `(${orden?.tax_id})` : ''}
                    </option>
                  )}
                  {clientes?.map((c: any) => {
                    const cId = c.id || c.client_id || c._id;
                    return (
                      <option key={cId} value={cId}>
                        {c.client_name} {c.tax_id ? `(${c.tax_id})` : ''}
                      </option>
                    );
                  })}
                </select>
              </div>

              <div>
                <div className="flex items-center justify-between mb-2">
                  <label className="block text-sm font-semibold text-gray-700">Vehículo *</label>
                  {clientVehicles.length > 1 && (
                    <span className="text-xs bg-blue-100 text-primary font-bold px-2 py-0.5 rounded-full flex items-center gap-1">
                      <i className="fas fa-layer-group text-[10px]"></i>
                      {clientVehicles.length} vehículos del cliente
                    </span>
                  )}
                </div>
                <select
                  required
                  value={formData.vehicles_fk_id || ""}
                  onChange={e => handleVehicleSelect(e.target.value)}
                  className="w-full px-4 py-2.5 border-2 border-gray-200 rounded-xl focus:ring-2 focus:ring-primary/30 focus:border-primary/50 transition outline-none text-sm bg-white font-medium"
                >
                  <option value="">
                    {clientVehicles.length > 1
                      ? `Seleccionar vehículo (${clientVehicles.length} disponibles)...`
                      : "Seleccionar vehículo..."}
                  </option>
                  {formData.vehicles_fk_id && !vehiculos?.some((v: any) => (v.id || v.vehicle_id || v._id) === formData.vehicles_fk_id) && (
                    <option value={formData.vehicles_fk_id}>
                      {orden?.license_plate || orden?.vehicles?.[0]?.license_plate || 'Vehículo actual'} - {orden?.brand || ''} {orden?.model || ''}
                    </option>
                  )}
                  {clientVehicles.length > 0 && (
                    <optgroup label={`Vehículos de ${selectedClient?.client_name || 'este cliente'} (${clientVehicles.length})`}>
                      {clientVehicles.map((v: any) => {
                        const vId = v.id || v.vehicle_id || v._id;
                        const plate = v.license_plate || v.plate;
                        const desc = `${v.brand || ''} ${v.model || ''}`.trim();
                        return (
                          <option key={`client-veh-${vId}`} value={vId}>
                            {plate ? `[${plate}]` : ''} {desc || vId}
                          </option>
                        );
                      })}
                    </optgroup>
                  )}
                  <optgroup label={clientVehicles.length > 0 ? "Otros Vehículos" : "Todos los Vehículos"}>
                    {otherVehicles.map((v: any) => {
                      const vId = v.id || v.vehicle_id || v._id;
                      const plate = v.license_plate || v.plate;
                      const desc = `${v.brand || ''} ${v.model || ''}`.trim();
                      return (
                        <option key={vId} value={vId}>
                          {plate ? `[${plate}]` : ''} {desc || vId}
                        </option>
                      );
                    })}
                  </optgroup>
                </select>

                {/* Acceso rápido si el cliente tiene más de un vehículo */}
                {clientVehicles.length > 1 && (
                  <div className="mt-2.5 p-2.5 bg-blue-50/70 rounded-xl border border-blue-200/70">
                    <p className="text-xs font-semibold text-gray-700 mb-1.5 flex items-center gap-1.5">
                      <i className="fas fa-car-side text-primary"></i>
                      Vehículos registrados ({clientVehicles.length}) - Haz clic para cambiar:
                    </p>
                    <div className="flex flex-wrap gap-1.5">
                      {clientVehicles.map((v: any) => {
                        const vId = v.id || v.vehicle_id || v._id;
                        const isSelected = formData.vehicles_fk_id === vId;
                        const plate = v.license_plate || v.plate;
                        const desc = `${v.brand || ''} ${v.model || ''}`.trim();
                        return (
                          <button
                            key={`quick-veh-${vId}`}
                            type="button"
                            onClick={() => handleVehicleSelect(vId)}
                            className={`px-2.5 py-1 text-xs rounded-lg font-bold border transition-all flex items-center gap-1.5 ${
                              isSelected
                                ? "bg-primary text-white border-primary shadow-sm"
                                : "bg-white text-gray-700 border-gray-200 hover:border-primary hover:text-primary"
                            }`}
                          >
                            {isSelected && <i className="fas fa-check-circle text-[10px]"></i>}
                            <span className="font-mono">{plate}</span>
                            <span className="font-normal opacity-85">({desc})</span>
                          </button>
                        );
                      })}
                    </div>
                  </div>
                )}
              </div>

              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-2">Fecha de Entrada *</label>
                <input 
                  type="date" 
                  required
                  value={formData.entry_date || ""} 
                  onChange={e => handleFieldChange("entry_date", e.target.value)} 
                  className="w-full px-4 py-2.5 border-2 border-gray-200 rounded-xl focus:ring-2 focus:ring-primary/30 focus:border-primary/50 transition outline-none text-sm" 
                />
              </div>

              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-2">Estado</label>
                <select
                  value={formData.status || "pendiente"} 
                  onChange={e => handleFieldChange("status", e.target.value)} 
                  className="w-full px-4 py-2.5 border-2 border-gray-200 rounded-xl focus:ring-2 focus:ring-primary/30 focus:border-primary/50 transition outline-none text-sm bg-white font-semibold"
                >
                  <option value="pendiente">Pendiente</option>
                  <option value="proceso">En Proceso</option>
                  <option value="completado">Completado</option>
                </select>
              </div>

              <div className="md:col-span-2">
                <label className="block text-sm font-semibold text-gray-700 mb-2">Costo Estimado / Total ($)</label>
                <input 
                  type="number"
                  step="0.01" 
                  value={formData.total_cost || ""} 
                  onChange={e => handleFieldChange("total_cost", parseFloat(e.target.value))} 
                  placeholder="0.00" 
                  className="w-full px-4 py-2.5 border-2 border-gray-200 rounded-xl focus:ring-2 focus:ring-primary/30 focus:border-primary/50 transition outline-none text-sm font-semibold" 
                />
              </div>

              <div className="md:col-span-2">
                <label className="block text-sm font-semibold text-gray-700 mb-2">Descripción de la Orden</label>
                <textarea 
                  value={formData.description || ""} 
                  onChange={e => handleFieldChange("description", e.target.value)} 
                  placeholder="Detalles de la reparación a realizar..." 
                  rows={4}
                  className="w-full px-4 py-2.5 border-2 border-gray-200 rounded-xl focus:ring-2 focus:ring-primary/30 focus:border-primary/50 transition outline-none text-sm resize-none" 
                />
              </div>
            </div>
          </div>
          <div className="p-6 border-t border-gray-100 flex justify-end gap-3 bg-gray-50 rounded-b-3xl">
            <button type="button" onClick={onClose} disabled={loading} className="px-5 py-2.5 border-2 border-gray-200 text-gray-700 rounded-xl hover:bg-gray-100 transition font-bold text-sm bg-white">
              Cancelar
            </button>
            <button type="submit" disabled={loading} className="px-5 py-2.5 bg-gradient-to-r from-primary to-blue-600 text-white rounded-xl hover:shadow-lg transform hover:-translate-y-0.5 transition-all flex items-center gap-2 shadow-soft font-bold text-sm">
              {loading ? (
                <>
                  <i className="fas fa-spinner fa-spin"></i> Guardando...
                </>
              ) : (
                <>
                  <i className="fas fa-save"></i> Guardar Orden
                </>
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
