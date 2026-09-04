import React, { useState, useEffect } from "react";
import { createEntity, updateEntity, getEntity } from "../../api/client";
import Autocomplete from "../ui/Autocomplete";

interface RecepcionModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => void;
  recepcion?: any;
}

export default function RecepcionModal({ isOpen, onClose, onSuccess, recepcion }: RecepcionModalProps) {
  const [formData, setFormData] = useState<any>({ status: 'proceso' });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (isOpen) {
      if (recepcion) {
        setFormData(recepcion);
      } else {
        setFormData({ status: 'proceso' });
      }
      setError(null);
    }
  }, [isOpen, recepcion]);

  if (!isOpen) return null;

  const handleFieldChange = (field: string, value: string) => {
    setFormData((prev: any) => ({ ...prev, [field]: value }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);
    try {
      if (recepcion?.id) {
        await updateEntity("GestionTallerProd_vehicle_receipts", recepcion.id, formData);
      } else {
        await createEntity("GestionTallerProd_vehicle_receipts", formData);
      }
      onSuccess();
      onClose();
    } catch (err: any) {
      setError(err.message || "Error al guardar la ficha de recepción");
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
            <i className="fas fa-warehouse text-primary"></i>
            {recepcion ? "Editar Recepción" : "Nueva Ficha de Recepción"}
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
                <Autocomplete
                  label="Vehículo *"
                  placeholder="Buscar por placa o marca..."
                  value={formData.vehicles_fk_id || ""}
                  onChange={(val) => handleFieldChange("vehicles_fk_id", val)}
                  fetchData={() => getEntity("GestionTallerProd_vehicles")}
                  displayField={(item) => `${item.license_plate} - ${item.brand} ${item.model || ''}`}
                  searchFields={['license_plate', 'brand', 'model', 'id']}
                />
              </div>

              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-2">Fecha de Entrada *</label>
                <input 
                  type="date" 
                  required
                  value={formData.entry_date ? String(formData.entry_date).split('T')[0] : ""} 
                  onChange={e => handleFieldChange("entry_date", e.target.value)} 
                  className="w-full px-4 py-2.5 border-2 border-gray-200 rounded-xl focus:ring-2 focus:ring-primary/30 focus:border-primary/50 transition outline-none text-sm" 
                />
              </div>

              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-2">Propietario / Cliente</label>
                <input 
                  type="text" 
                  value={formData.owner_name || ""} 
                  onChange={e => handleFieldChange("owner_name", e.target.value)} 
                  placeholder="Nombre de quien entrega" 
                  className="w-full px-4 py-2.5 border-2 border-gray-200 rounded-xl focus:ring-2 focus:ring-primary/30 focus:border-primary/50 transition outline-none text-sm" 
                />
              </div>
              
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-2">Teléfono</label>
                <input 
                  type="tel" 
                  value={formData.owner_phone || ""} 
                  onChange={e => handleFieldChange("owner_phone", e.target.value)} 
                  placeholder="0414-XXXXXXX" 
                  className="w-full px-4 py-2.5 border-2 border-gray-200 rounded-xl focus:ring-2 focus:ring-primary/30 focus:border-primary/50 transition outline-none text-sm" 
                />
              </div>

              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-2">Nivel de Combustible</label>
                <select
                  value={formData.fuel_level || ""} 
                  onChange={e => handleFieldChange("fuel_level", e.target.value)} 
                  className="w-full px-4 py-2.5 border-2 border-gray-200 rounded-xl focus:ring-2 focus:ring-primary/30 focus:border-primary/50 transition outline-none text-sm bg-white"
                >
                  <option value="">Seleccione...</option>
                  <option value="Reserva">Reserva</option>
                  <option value="1/4">1/4 Tanque</option>
                  <option value="1/2">1/2 Tanque</option>
                  <option value="3/4">3/4 Tanque</option>
                  <option value="Lleno">Lleno</option>
                </select>
              </div>

              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-2">Estado</label>
                <select
                  value={formData.status || "proceso"} 
                  onChange={e => handleFieldChange("status", e.target.value)} 
                  className="w-full px-4 py-2.5 border-2 border-gray-200 rounded-xl focus:ring-2 focus:ring-primary/30 focus:border-primary/50 transition outline-none text-sm bg-white font-semibold"
                >
                  <option value="proceso">En Proceso (Taller)</option>
                  <option value="entregado">Entregado al Cliente</option>
                </select>
              </div>

              <div className="md:col-span-2">
                <label className="block text-sm font-semibold text-gray-700 mb-2">Observaciones</label>
                <textarea 
                  value={formData.observations || ""} 
                  onChange={e => handleFieldChange("observations", e.target.value)} 
                  placeholder="Rayones, estado general al recibir, objetos personales..." 
                  rows={3}
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
                  <i className="fas fa-save"></i> Guardar Ficha
                </>
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
