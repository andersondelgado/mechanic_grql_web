import React, { useState, useEffect } from "react";
import { createEntity, updateEntity } from "../../api/client";
import { useGrqlList } from "../../hooks/use-grql";

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

  const { data: clientes } = useGrqlList<any[]>("GestionTallerProd_clients");
  const { data: vehiculos } = useGrqlList<any[]>("GestionTallerProd_vehicles");

  useEffect(() => {
    if (isOpen) {
      if (orden) {
        let clientId = orden.clients_fk_id;
        if (Array.isArray(clientId) && clientId.length > 0) {
          clientId = typeof clientId[0] === 'object' ? (clientId[0].id || clientId[0].client_id) : clientId[0];
        } else if (!clientId && Array.isArray(orden.clients) && orden.clients.length > 0) {
          clientId = orden.clients[0]?.id || orden.clients[0]?.client_id;
        }

        let vehicleId = orden.vehicles_fk_id;
        if (Array.isArray(vehicleId) && vehicleId.length > 0) {
          vehicleId = typeof vehicleId[0] === 'object' ? (vehicleId[0].id || vehicleId[0].vehicle_id) : vehicleId[0];
        } else if (!vehicleId && Array.isArray(orden.vehicles) && orden.vehicles.length > 0) {
          vehicleId = orden.vehicles[0]?.id || orden.vehicles[0]?.vehicle_id;
        }

        const rawDate = orden.entry_date || orden.order_date || orden.created_at || '';
        const entryDate = rawDate ? String(rawDate).replace(' ', 'T').split('T')[0] : new Date().toISOString().split('T')[0];

        const totalCost = orden.total_cost ?? orden.estimated_cost ?? orden.cost ?? 0;
        const description = orden.description || orden.repair_details || orden.notes || '';

        setFormData({
          ...orden,
          clients_fk_id: clientId || '',
          vehicles_fk_id: vehicleId || '',
          entry_date: entryDate,
          status: orden.status || 'pendiente',
          total_cost: totalCost,
          description: description
        });
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
  }, [isOpen, orden]);

  if (!isOpen) return null;

  const handleFieldChange = (field: string, value: any) => {
    setFormData((prev: any) => ({ ...prev, [field]: value }));
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
                  onChange={e => handleFieldChange("clients_fk_id", e.target.value)}
                  className="w-full px-4 py-2.5 border-2 border-gray-200 rounded-xl focus:ring-2 focus:ring-primary/30 focus:border-primary/50 transition outline-none text-sm bg-white font-medium"
                >
                  <option value="">Seleccionar cliente...</option>
                  {clientes?.map((c: any) => (
                    <option key={c.id || c.client_id} value={c.id || c.client_id}>
                      {c.client_name} {c.tax_id ? `(${c.tax_id})` : ''}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-2">Vehículo *</label>
                <select
                  required
                  value={formData.vehicles_fk_id || ""}
                  onChange={e => handleFieldChange("vehicles_fk_id", e.target.value)}
                  className="w-full px-4 py-2.5 border-2 border-gray-200 rounded-xl focus:ring-2 focus:ring-primary/30 focus:border-primary/50 transition outline-none text-sm bg-white font-medium"
                >
                  <option value="">Seleccionar vehículo...</option>
                  {vehiculos?.map((v: any) => {
                    const plate = v.license_plate || v.plate;
                    const desc = `${v.brand || ''} ${v.model || ''}`.trim();
                    return (
                      <option key={v.id || v.vehicle_id} value={v.id || v.vehicle_id}>
                        {plate ? `[${plate}]` : ''} {desc || v.id}
                      </option>
                    );
                  })}
                </select>
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
