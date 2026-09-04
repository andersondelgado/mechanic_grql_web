import React, { useState, useEffect } from "react";
import { createEntity, updateEntity } from "../../api/client";
import { useGrqlList } from "../../hooks/use-grql";

interface VehiculoModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => void;
  vehiculo?: any; // If provided, we are editing
}

export default function VehiculoModal({ isOpen, onClose, onSuccess, vehiculo }: VehiculoModalProps) {
  const [formData, setFormData] = useState<any>({});
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Fetch clients to populate the select dropdown
  const { data: clientes, loading: loadingClientes } = useGrqlList<any[]>("GestionTallerProd_clients");

  useEffect(() => {
    if (isOpen) {
      if (vehiculo) {
        setFormData(vehiculo);
      } else {
        setFormData({});
      }
      setError(null);
    }
  }, [isOpen, vehiculo]);

  if (!isOpen) return null;

  const handleFieldChange = (field: string, value: string | number) => {
    setFormData((prev: any) => ({ ...prev, [field]: value }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);
    try {
      if (vehiculo?.id) {
        await updateEntity("GestionTallerProd_vehicles", vehiculo.id, formData);
      } else {
        await createEntity("GestionTallerProd_vehicles", formData);
      }
      onSuccess();
      onClose();
    } catch (err: any) {
      setError(err.message || "Error al guardar el vehículo");
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
      className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center p-2 sm:p-4 overflow-y-auto"
      onClick={handleBackdropClick}
    >
      <div className="bg-white rounded-3xl shadow-strong max-w-4xl w-full my-8 mx-2 sm:mx-0 animate-fadeIn" onClick={(e) => e.stopPropagation()}>
        <div className="p-6 border-b border-gray-100 flex items-center justify-between">
          <h3 className="text-xl font-bold text-secondary flex items-center gap-2">
            <i className="fas fa-car text-primary"></i>
            {vehiculo ? "Editar Vehículo" : "Nuevo Vehículo"}
          </h3>
          <button type="button" onClick={onClose} className="p-2 hover:bg-gray-100 rounded-xl transition">
            <i className="fas fa-times text-gray-500"></i>
          </button>
        </div>
        
        <form onSubmit={handleSubmit}>
          <div className="p-6 overflow-y-auto" style={{ maxHeight: '60vh' }}>
            {error && (
              <div className="bg-red-50 text-red-600 p-4 rounded-xl mb-6 flex items-center gap-2 text-sm font-semibold border border-red-200">
                <i className="fas fa-exclamation-circle"></i> {error}
              </div>
            )}
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-2">Placa *</label>
                <input 
                  type="text" 
                  required
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
                  onChange={e => handleFieldChange("brand", e.target.value.toUpperCase())} 
                  placeholder="TOYOTA" 
                  className="w-full px-4 py-2.5 border-2 border-gray-200 rounded-xl focus:ring-2 focus:ring-primary/30 focus:border-primary/50 transition outline-none text-sm uppercase" 
                />
              </div>
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-2">Modelo *</label>
                <input 
                  type="text" 
                  required
                  value={formData.model || ""} 
                  onChange={e => handleFieldChange("model", e.target.value.toUpperCase())} 
                  placeholder="CAMRY" 
                  className="w-full px-4 py-2.5 border-2 border-gray-200 rounded-xl focus:ring-2 focus:ring-primary/30 focus:border-primary/50 transition outline-none text-sm uppercase" 
                />
              </div>
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-2">Año *</label>
                <input 
                  type="number" 
                  required
                  value={formData.year || ""} 
                  onChange={e => handleFieldChange("year", parseInt(e.target.value, 10))} 
                  placeholder="1998" 
                  className="w-full px-4 py-2.5 border-2 border-gray-200 rounded-xl focus:ring-2 focus:ring-primary/30 focus:border-primary/50 transition outline-none text-sm" 
                />
              </div>
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-2">Color</label>
                <input 
                  type="text" 
                  value={formData.color || ""} 
                  onChange={e => handleFieldChange("color", e.target.value)} 
                  placeholder="Blanco" 
                  className="w-full px-4 py-2.5 border-2 border-gray-200 rounded-xl focus:ring-2 focus:ring-primary/30 focus:border-primary/50 transition outline-none text-sm" 
                />
              </div>
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-2">Cliente *</label>
                <select 
                  required
                  value={formData.clients_fk_id || ""} 
                  onChange={e => handleFieldChange("clients_fk_id", e.target.value)}
                  className="w-full px-4 py-2.5 border-2 border-gray-200 rounded-xl focus:ring-2 focus:ring-primary/30 focus:border-primary/50 transition outline-none text-sm bg-white"
                >
                  <option value="">Seleccionar cliente...</option>
                  {loadingClientes ? (
                    <option disabled>Cargando clientes...</option>
                  ) : (
                    clientes?.map((c: any) => (
                      <option key={c.id} value={c.id}>
                        {c.client_name} - {c.tax_id}
                      </option>
                    ))
                  )}
                </select>
              </div>
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-2">Kilometraje</label>
                <input 
                  type="text" 
                  value={formData.mileage || ""} 
                  onChange={e => handleFieldChange("mileage", e.target.value)} 
                  placeholder="150000 km" 
                  className="w-full px-4 py-2.5 border-2 border-gray-200 rounded-xl focus:ring-2 focus:ring-primary/30 focus:border-primary/50 transition outline-none text-sm" 
                />
              </div>
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-2">Tipo / Categoría</label>
                <input 
                  type="text" 
                  value={formData.type || ""} 
                  onChange={e => handleFieldChange("type", e.target.value)} 
                  placeholder="Sedán, SUV, Camioneta..." 
                  className="w-full px-4 py-2.5 border-2 border-gray-200 rounded-xl focus:ring-2 focus:ring-primary/30 focus:border-primary/50 transition outline-none text-sm" 
                />
              </div>
              <div className="md:col-span-2">
                <label className="block text-sm font-semibold text-gray-700 mb-2">Observaciones</label>
                <textarea 
                  value={formData.observations || ""} 
                  onChange={e => handleFieldChange("observations", e.target.value)} 
                  placeholder="Observaciones adicionales del vehículo" 
                  rows={2} 
                  className="w-full px-4 py-2.5 border-2 border-gray-200 rounded-xl focus:ring-2 focus:ring-primary/30 focus:border-primary/50 transition outline-none text-sm"
                ></textarea>
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
                  <i className="fas fa-save"></i> Guardar Cambios
                </>
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
