import React, { useState, useEffect } from "react";
import { createEntity, updateEntity } from "../../api/client";
import { useGrqlList } from "../../hooks/use-grql";

interface NotaEntregaModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => void;
  nota?: any;
}

export default function NotaEntregaModal({ isOpen, onClose, onSuccess, nota }: NotaEntregaModalProps) {
  const [formData, setFormData] = useState<any>({
    note_date: new Date().toISOString().split('T')[0],
    note_number: `ND-${Date.now().toString().slice(-4)}`,
    subtotal: 0,
    total: 0
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const { data: clientes } = useGrqlList<any[]>("GestionTallerProd_clients");
  const { data: vehiculos } = useGrqlList<any[]>("GestionTallerProd_vehicles");

  useEffect(() => {
    if (isOpen) {
      if (nota) {
        let clientId = nota.clients_fk_id;
        if (Array.isArray(clientId) && clientId.length > 0) {
          clientId = typeof clientId[0] === 'object' ? (clientId[0].id || clientId[0].client_id) : clientId[0];
        } else if (!clientId && Array.isArray(nota.clients) && nota.clients.length > 0) {
          clientId = nota.clients[0]?.id || nota.clients[0]?.client_id;
        }

        let vehicleId = nota.vehicles_fk_id;
        if (Array.isArray(vehicleId) && vehicleId.length > 0) {
          vehicleId = typeof vehicleId[0] === 'object' ? (vehicleId[0].id || vehicleId[0].vehicle_id) : vehicleId[0];
        } else if (!vehicleId && Array.isArray(nota.vehicles) && nota.vehicles.length > 0) {
          vehicleId = nota.vehicles[0]?.id || nota.vehicles[0]?.vehicle_id;
        }

        const rawDate = nota.note_date || nota.created_at || '';
        const noteDate = rawDate ? String(rawDate).replace(' ', 'T').split('T')[0] : new Date().toISOString().split('T')[0];

        setFormData({
          ...nota,
          clients_fk_id: clientId || '',
          vehicles_fk_id: vehicleId || '',
          note_date: noteDate,
          client_name: nota.client_name || nota.clients?.[0]?.client_name || '',
          license_plate: nota.license_plate || nota.vehicles?.[0]?.license_plate || '',
          brand: nota.brand || nota.vehicles?.[0]?.brand || '',
          model: nota.model || nota.vehicles?.[0]?.model || '',
          subtotal: Number(nota.subtotal || 0),
          total: Number(nota.total || 0)
        });
      } else {
        setFormData({
          note_date: new Date().toISOString().split('T')[0],
          note_number: `ND-${Date.now().toString().slice(-4)}`,
          subtotal: 0,
          total: 0
        });
      }
      setError(null);
    }
  }, [isOpen, nota]);

  if (!isOpen) return null;

  const handleFieldChange = (field: string, value: any) => {
    setFormData((prev: any) => ({ ...prev, [field]: value }));
  };

  const handleClientSelect = (clientId: string) => {
    const client = clientes?.find((c: any) => c.id === clientId || c.client_id === clientId);
    setFormData((prev: any) => ({
      ...prev,
      clients_fk_id: clientId,
      client_name: client?.client_name || prev.client_name || '',
      tax_id: client?.tax_id || prev.tax_id || '',
    }));
  };

  const handleVehicleSelect = (vehicleId: string) => {
    const vehicle = vehiculos?.find((v: any) => v.id === vehicleId || v.vehicle_id === vehicleId);
    setFormData((prev: any) => ({
      ...prev,
      vehicles_fk_id: vehicleId,
      license_plate: vehicle?.license_plate || prev.license_plate || '',
      brand: vehicle?.brand || prev.brand || '',
      model: vehicle?.model || prev.model || '',
      vehicle_type: vehicle?.vehicle_type || prev.vehicle_type || '',
    }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);
    try {
      const payload = {
        ...formData,
        subtotal: parseFloat(formData.subtotal || 0),
        total: parseFloat(formData.total || 0),
      };

      if (nota?.id) {
        await updateEntity("GestionTallerProd_delivery_notes", nota.id, payload);
      } else {
        await createEntity("GestionTallerProd_delivery_notes", payload);
      }
      onSuccess();
      onClose();
    } catch (err: any) {
      setError(err.message || "Error al guardar la nota de entrega");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div 
      className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center p-2 sm:p-4 overflow-y-auto"
      onClick={onClose}
    >
      <div className="bg-white rounded-3xl shadow-strong max-w-3xl w-full my-8 mx-auto animate-fadeIn" onClick={(e) => e.stopPropagation()}>
        <div className="p-6 border-b border-gray-100 flex items-center justify-between">
          <h3 className="text-xl font-bold text-secondary flex items-center gap-2">
            <i className="fas fa-receipt text-primary"></i>
            {nota ? "Editar Nota de Entrega" : "Nueva Nota de Entrega"}
          </h3>
          <button type="button" onClick={onClose} className="p-2 hover:bg-gray-100 rounded-xl transition">
            <i className="fas fa-times text-gray-500"></i>
          </button>
        </div>
        
        <form onSubmit={handleSubmit}>
          <div className="p-6 overflow-y-auto" style={{ maxHeight: '65vh' }}>
            {error && (
              <div className="bg-red-50 text-red-600 p-4 rounded-xl mb-6 flex items-center gap-2 text-sm font-semibold border border-red-200">
                <i className="fas fa-exclamation-circle"></i> {error}
              </div>
            )}
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-2"># Nota *</label>
                <input 
                  type="text" 
                  required
                  value={formData.note_number || ""} 
                  onChange={e => handleFieldChange("note_number", e.target.value)} 
                  placeholder="ND-001" 
                  className="w-full px-4 py-2.5 border-2 border-gray-200 rounded-xl focus:ring-2 focus:ring-primary/30 focus:border-primary/50 transition outline-none text-sm" 
                />
              </div>

              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-2">Fecha de Nota *</label>
                <input 
                  type="date" 
                  required
                  value={formData.note_date || ""} 
                  onChange={e => handleFieldChange("note_date", e.target.value)} 
                  className="w-full px-4 py-2.5 border-2 border-gray-200 rounded-xl focus:ring-2 focus:ring-primary/30 focus:border-primary/50 transition outline-none text-sm" 
                />
              </div>

              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-2">Cliente *</label>
                <select
                  value={formData.clients_fk_id || ""}
                  onChange={e => handleClientSelect(e.target.value)}
                  className="w-full px-4 py-2.5 border-2 border-gray-200 rounded-xl focus:ring-2 focus:ring-primary/30 focus:border-primary/50 transition outline-none text-sm"
                >
                  <option value="">Seleccionar Cliente...</option>
                  {clientes?.map((c: any) => (
                    <option key={c.id || c.client_id} value={c.id || c.client_id}>
                      {c.client_name} ({c.tax_id})
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-2">Vehículo *</label>
                <select
                  value={formData.vehicles_fk_id || ""}
                  onChange={e => handleVehicleSelect(e.target.value)}
                  className="w-full px-4 py-2.5 border-2 border-gray-200 rounded-xl focus:ring-2 focus:ring-primary/30 focus:border-primary/50 transition outline-none text-sm"
                >
                  <option value="">Seleccionar Vehículo...</option>
                  {vehiculos?.map((v: any) => (
                    <option key={v.id || v.vehicle_id} value={v.id || v.vehicle_id}>
                      {v.license_plate} - {v.brand} {v.model}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-2">Nombre del Cliente *</label>
                <input 
                  type="text" 
                  required
                  value={formData.client_name || ""} 
                  onChange={e => handleFieldChange("client_name", e.target.value)} 
                  placeholder="Nombre del cliente" 
                  className="w-full px-4 py-2.5 border-2 border-gray-200 rounded-xl focus:ring-2 focus:ring-primary/30 focus:border-primary/50 transition outline-none text-sm" 
                />
              </div>

              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-2">Placa</label>
                <input 
                  type="text" 
                  value={formData.license_plate || ""} 
                  onChange={e => handleFieldChange("license_plate", e.target.value.toUpperCase())} 
                  placeholder="MAP99W" 
                  className="w-full px-4 py-2.5 border-2 border-gray-200 rounded-xl focus:ring-2 focus:ring-primary/30 focus:border-primary/50 transition outline-none text-sm uppercase" 
                />
              </div>

              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-2">Subtotal ($)</label>
                <input 
                  type="number" 
                  step="0.01"
                  value={formData.subtotal ?? 0} 
                  onChange={e => handleFieldChange("subtotal", e.target.value)} 
                  className="w-full px-4 py-2.5 border-2 border-gray-200 rounded-xl focus:ring-2 focus:ring-primary/30 focus:border-primary/50 transition outline-none text-sm" 
                />
              </div>

              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-2">Total ($)</label>
                <input 
                  type="number" 
                  step="0.01"
                  value={formData.total ?? 0} 
                  onChange={e => handleFieldChange("total", e.target.value)} 
                  className="w-full px-4 py-2.5 border-2 border-primary/40 bg-primary/5 rounded-xl font-bold text-sm text-secondary" 
                />
              </div>
            </div>
          </div>
          
          <div className="p-6 border-t border-gray-100 flex items-center justify-end gap-3 bg-gray-50/50 rounded-b-3xl">
            <button 
              type="button" 
              onClick={onClose} 
              className="px-5 py-2.5 border-2 border-gray-200 text-gray-600 rounded-xl hover:bg-gray-100 transition font-semibold text-sm"
            >
              Cancelar
            </button>
            <button 
              type="submit" 
              disabled={loading} 
              className="px-6 py-2.5 bg-gradient-to-r from-primary to-blue-600 text-white rounded-xl hover:shadow-lg transform hover:-translate-y-0.5 transition-all shadow-soft font-bold text-sm flex items-center gap-2"
            >
              {loading && <i className="fas fa-spinner fa-spin"></i>}
              {nota ? "Guardar Cambios" : "Crear Nota de Entrega"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
