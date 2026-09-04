import React, { useState, useEffect } from "react";
import { createEntity, updateEntity } from "../../api/client";
import { useGrqlList } from "../../hooks/use-grql";

interface CotizacionModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => void;
  cotizacion?: any;
}

export default function CotizacionModal({ isOpen, onClose, onSuccess, cotizacion }: CotizacionModalProps) {
  const [formData, setFormData] = useState<any>({
    status: 'Pendiente',
    quote_date: new Date().toISOString().split('T')[0],
    subtotal: 0,
    total: 0,
    year: new Date().getFullYear()
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const { data: clientes } = useGrqlList<any[]>("GestionTallerProd_clients");
  const { data: vehiculos } = useGrqlList<any[]>("GestionTallerProd_vehicles");

  useEffect(() => {
    if (isOpen) {
      if (cotizacion) {
        let clientId = cotizacion.clients_fk_id;
        if (Array.isArray(clientId) && clientId.length > 0) clientId = typeof clientId[0] === 'object' ? (clientId[0].id || clientId[0].client_id) : clientId[0];
        else if (Array.isArray(cotizacion.clients) && cotizacion.clients.length > 0) clientId = cotizacion.clients[0]?.id || cotizacion.clients[0]?.client_id;

        let vehicleId = cotizacion.vehicles_fk_id;
        if (Array.isArray(vehicleId) && vehicleId.length > 0) vehicleId = typeof vehicleId[0] === 'object' ? (vehicleId[0].id || vehicleId[0].vehicle_id) : vehicleId[0];
        else if (Array.isArray(cotizacion.vehicles) && cotizacion.vehicles.length > 0) vehicleId = cotizacion.vehicles[0]?.id || cotizacion.vehicles[0]?.vehicle_id;

        setFormData({
          ...cotizacion,
          clients_fk_id: clientId || '',
          vehicles_fk_id: vehicleId || '',
          quote_date: cotizacion.quote_date ? cotizacion.quote_date.split('T')[0] : new Date().toISOString().split('T')[0],
          subtotal: Number(cotizacion.subtotal || 0),
          total: Number(cotizacion.total || 0)
        });
      } else {
        setFormData({
          status: 'Pendiente',
          quote_date: new Date().toISOString().split('T')[0],
          quote_number: `COT-${Date.now().toString().slice(-4)}`,
          subtotal: 0,
          total: 0,
          year: new Date().getFullYear()
        });
      }
      setError(null);
    }
  }, [isOpen, cotizacion]);

  if (!isOpen) return null;

  const handleFieldChange = (field: string, value: any) => {
    setFormData((prev: any) => {
      const updated = { ...prev, [field]: value };
      if (field === 'subtotal') {
        const sub = parseFloat(value) || 0;
        updated.total = parseFloat((sub * 1.16).toFixed(2));
      }
      return updated;
    });
  };

  const handleClientSelect = (clientId: string) => {
    const client = clientes?.find((c: any) => (c.id || c.client_id || c._id) === clientId);
    setFormData((prev: any) => ({
      ...prev,
      clients_fk_id: clientId,
      client_name: client?.client_name || prev.client_name || '',
      tax_id: client?.tax_id || prev.tax_id || '',
      address: client?.address || prev.address || '',
    }));
  };

  const handleVehicleSelect = (vehicleId: string) => {
    const vehicle = vehiculos?.find((v: any) => (v.id || v.vehicle_id || v._id) === vehicleId);
    setFormData((prev: any) => ({
      ...prev,
      vehicles_fk_id: vehicleId,
      license_plate: vehicle?.license_plate || prev.license_plate || '',
      brand: vehicle?.brand || prev.brand || '',
      model: vehicle?.model || prev.model || '',
      year: vehicle?.year || prev.year || new Date().getFullYear(),
      vehicle_type: vehicle?.vehicle_type || prev.vehicle_type || 'Sedan',
    }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);
    try {
      const payload = {
        ...formData,
        year: Number(formData.year || 0),
        subtotal: Number(formData.subtotal || 0),
        total: Number(formData.total || 0),
      };

      if (cotizacion?.id) {
        await updateEntity("GestionTallerProd_quotes", cotizacion.id, payload);
      } else {
        await createEntity("GestionTallerProd_quotes", payload);
      }
      onSuccess();
      onClose();
    } catch (err: any) {
      setError(err.message || "Error al guardar el presupuesto");
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
            <i className="fas fa-file-invoice-dollar text-primary"></i>
            {cotizacion ? "Editar Presupuesto" : "Nuevo Presupuesto"}
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
                <label className="block text-sm font-semibold text-gray-700 mb-2"># Cotización</label>
                <input 
                  type="text" 
                  value={formData.quote_number || ""} 
                  onChange={e => handleFieldChange("quote_number", e.target.value)} 
                  placeholder="COT-001" 
                  className="w-full px-4 py-2.5 border-2 border-gray-200 rounded-xl focus:ring-2 focus:ring-primary/30 focus:border-primary/50 transition outline-none text-sm" 
                />
              </div>

              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-2">Fecha *</label>
                <input 
                  type="date" 
                  required
                  value={formData.quote_date || ""} 
                  onChange={e => handleFieldChange("quote_date", e.target.value)} 
                  className="w-full px-4 py-2.5 border-2 border-gray-200 rounded-xl focus:ring-2 focus:ring-primary/30 focus:border-primary/50 transition outline-none text-sm" 
                />
              </div>

              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-2">Cliente *</label>
                <select
                  value={formData.clients_fk_id || ""}
                  onChange={e => handleClientSelect(e.target.value)}
                  className="w-full px-4 py-2.5 border-2 border-gray-200 rounded-xl focus:ring-2 focus:ring-primary/30 focus:border-primary/50 transition outline-none text-sm bg-white"
                >
                  <option value="">Seleccionar Cliente...</option>
                  {clientes?.map((c: any) => {
                    const cId = c.id || c.client_id || c._id;
                    return (
                      <option key={cId} value={cId}>
                        {c.client_name} ({c.tax_id})
                      </option>
                    );
                  })}
                </select>
              </div>

              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-2">Vehículo *</label>
                <select
                  value={formData.vehicles_fk_id || ""}
                  onChange={e => handleVehicleSelect(e.target.value)}
                  className="w-full px-4 py-2.5 border-2 border-gray-200 rounded-xl focus:ring-2 focus:ring-primary/30 focus:border-primary/50 transition outline-none text-sm bg-white"
                >
                  <option value="">Seleccionar Vehículo...</option>
                  {vehiculos?.map((v: any) => {
                    const vId = v.id || v.vehicle_id || v._id;
                    return (
                      <option key={vId} value={vId}>
                        {v.license_plate} - {v.brand} {v.model}
                      </option>
                    );
                  })}
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
                <label className="block text-sm font-semibold text-gray-700 mb-2">Marca *</label>
                <input 
                  type="text" 
                  required
                  value={formData.brand || ""} 
                  onChange={e => handleFieldChange("brand", e.target.value)} 
                  placeholder="TOYOTA" 
                  className="w-full px-4 py-2.5 border-2 border-gray-200 rounded-xl focus:ring-2 focus:ring-primary/30 focus:border-primary/50 transition outline-none text-sm" 
                />
              </div>

              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-2">Modelo *</label>
                <input 
                  type="text" 
                  required
                  value={formData.model || ""} 
                  onChange={e => handleFieldChange("model", e.target.value)} 
                  placeholder="CAMRY" 
                  className="w-full px-4 py-2.5 border-2 border-gray-200 rounded-xl focus:ring-2 focus:ring-primary/30 focus:border-primary/50 transition outline-none text-sm" 
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
                <label className="block text-sm font-semibold text-gray-700 mb-2">Total con IVA ($)</label>
                <input 
                  type="number" 
                  step="0.01"
                  value={formData.total ?? 0} 
                  onChange={e => handleFieldChange("total", e.target.value)} 
                  className="w-full px-4 py-2.5 border-2 border-primary/40 bg-primary/5 rounded-xl font-bold text-sm text-secondary" 
                />
              </div>

              <div className="md:col-span-2">
                <label className="block text-sm font-semibold text-gray-700 mb-2">Estado</label>
                <select
                  value={formData.status || "Pendiente"}
                  onChange={e => handleFieldChange("status", e.target.value)}
                  className="w-full px-4 py-2.5 border-2 border-gray-200 rounded-xl focus:ring-2 focus:ring-primary/30 focus:border-primary/50 transition outline-none text-sm"
                >
                  <option value="Pendiente">Pendiente</option>
                  <option value="Aprobado">Aprobado</option>
                  <option value="Rechazado">Rechazado</option>
                  <option value="Facturado">Facturado</option>
                </select>
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
              {cotizacion ? "Guardar Cambios" : "Crear Presupuesto"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
