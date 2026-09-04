import React, { useState, useEffect } from "react";
import { createEntity, updateEntity } from "../../api/client";
import { useGrqlList } from "../../hooks/use-grql";

interface TarjetaRevisionModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => void;
  tarjeta?: any;
}

export default function TarjetaRevisionModal({ isOpen, onClose, onSuccess, tarjeta }: TarjetaRevisionModalProps) {
  const [formData, setFormData] = useState<any>({
    inspection_type: 'REVISION EXTERNA',
    inspection_date: new Date().toISOString().split('T')[0],
    check_yes: true,
    check_no: false,
    item_name: '',
    observations: ''
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const { data: vehiculos } = useGrqlList<any[]>("GestionTallerProd_vehicles");

  useEffect(() => {
    if (isOpen) {
      if (tarjeta) {
        let vehicleId = tarjeta.vehicles_fk_id;
        if (Array.isArray(vehicleId) && vehicleId.length > 0) {
          vehicleId = typeof vehicleId[0] === 'object' ? (vehicleId[0].id || vehicleId[0].vehicle_id) : vehicleId[0];
        } else if (!vehicleId && Array.isArray(tarjeta.vehicles) && tarjeta.vehicles.length > 0) {
          vehicleId = tarjeta.vehicles[0]?.id || tarjeta.vehicles[0]?.vehicle_id;
        }

        const rawDate = tarjeta.inspection_date || tarjeta.created_at || '';
        const inspectionDate = rawDate ? String(rawDate).replace(' ', 'T').split('T')[0] : new Date().toISOString().split('T')[0];

        setFormData({
          ...tarjeta,
          vehicles_fk_id: vehicleId || '',
          inspection_date: inspectionDate,
          check_yes: Boolean(tarjeta.check_yes),
          check_no: Boolean(tarjeta.check_no),
          item_name: tarjeta.item_name || '',
          observations: tarjeta.observations || ''
        });
      } else {
        setFormData({
          inspection_type: 'REVISION EXTERNA',
          inspection_date: new Date().toISOString().split('T')[0],
          check_yes: true,
          check_no: false,
          item_name: '',
          observations: ''
        });
      }
      setError(null);
    }
  }, [isOpen, tarjeta]);

  if (!isOpen) return null;

  const handleFieldChange = (field: string, value: any) => {
    setFormData((prev: any) => ({ ...prev, [field]: value }));
  };

  const handleCheckChange = (type: 'yes' | 'no') => {
    if (type === 'yes') {
      setFormData((prev: any) => ({ ...prev, check_yes: true, check_no: false }));
    } else {
      setFormData((prev: any) => ({ ...prev, check_yes: false, check_no: true }));
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);
    try {
      const payload = {
        ...formData,
        check_yes: Boolean(formData.check_yes),
        check_no: Boolean(formData.check_no),
      };

      if (tarjeta?.id) {
        await updateEntity("GestionTallerProd_inspection_cards", tarjeta.id, payload);
      } else {
        await createEntity("GestionTallerProd_inspection_cards", payload);
      }
      onSuccess();
      onClose();
    } catch (err: any) {
      setError(err.message || "Error al guardar la tarjeta de revisión");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div 
      className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center p-2 sm:p-4 overflow-y-auto"
      onClick={onClose}
    >
      <div className="bg-white rounded-3xl shadow-strong max-w-2xl w-full my-8 mx-auto animate-fadeIn" onClick={(e) => e.stopPropagation()}>
        <div className="p-6 border-b border-gray-100 flex items-center justify-between">
          <h3 className="text-xl font-bold text-secondary flex items-center gap-2">
            <i className="fas fa-clipboard-check text-primary"></i>
            {tarjeta ? "Editar Tarjeta de Revisión" : "Nueva Tarjeta de Revisión"}
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
                <label className="block text-sm font-semibold text-gray-700 mb-2">Vehículo *</label>
                <select
                  required
                  value={formData.vehicles_fk_id || ""}
                  onChange={e => handleFieldChange("vehicles_fk_id", e.target.value)}
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
                <label className="block text-sm font-semibold text-gray-700 mb-2">Fecha de Revisión *</label>
                <input 
                  type="date" 
                  required
                  value={formData.inspection_date || ""} 
                  onChange={e => handleFieldChange("inspection_date", e.target.value)} 
                  className="w-full px-4 py-2.5 border-2 border-gray-200 rounded-xl focus:ring-2 focus:ring-primary/30 focus:border-primary/50 transition outline-none text-sm" 
                />
              </div>

              <div className="md:col-span-2">
                <label className="block text-sm font-semibold text-gray-700 mb-2">Tipo de Revisión *</label>
                <select
                  value={formData.inspection_type || "REVISION EXTERNA"}
                  onChange={e => handleFieldChange("inspection_type", e.target.value)}
                  className="w-full px-4 py-2.5 border-2 border-gray-200 rounded-xl focus:ring-2 focus:ring-primary/30 focus:border-primary/50 transition outline-none text-sm"
                >
                  <option value="REVISION EXTERNA">REVISION EXTERNA</option>
                  <option value="REVISION INTERNA">REVISION INTERNA</option>
                  <option value="REVISION MECANICA">REVISION MECANICA</option>
                  <option value="REVISION ELECTRICA">REVISION ELECTRICA</option>
                </select>
              </div>

              <div className="md:col-span-2">
                <label className="block text-sm font-semibold text-gray-700 mb-2">Elemento a Revisar *</label>
                <input 
                  type="text" 
                  required
                  value={formData.item_name || ""} 
                  onChange={e => handleFieldChange("item_name", e.target.value)} 
                  placeholder="Ej: PARA CHOQUE DELANTERO / FRONTAL / LUCES" 
                  className="w-full px-4 py-2.5 border-2 border-gray-200 rounded-xl focus:ring-2 focus:ring-primary/30 focus:border-primary/50 transition outline-none text-sm" 
                />
              </div>

              <div className="flex items-center gap-6 p-4 bg-gray-50 rounded-2xl md:col-span-2">
                <span className="text-sm font-semibold text-gray-700">Estado de Conformidad:</span>
                <label className="flex items-center gap-2 cursor-pointer text-sm font-medium text-green-700">
                  <input 
                    type="radio" 
                    name="compliance" 
                    checked={formData.check_yes === true}
                    onChange={() => handleCheckChange('yes')}
                    className="text-green-600 focus:ring-green-500 w-4 h-4"
                  />
                  <span>Conforme (Sí)</span>
                </label>
                <label className="flex items-center gap-2 cursor-pointer text-sm font-medium text-red-700">
                  <input 
                    type="radio" 
                    name="compliance" 
                    checked={formData.check_no === true}
                    onChange={() => handleCheckChange('no')}
                    className="text-red-600 focus:ring-red-500 w-4 h-4"
                  />
                  <span>Requiere Atención (No)</span>
                </label>
              </div>

              <div className="md:col-span-2">
                <label className="block text-sm font-semibold text-gray-700 mb-2">Observaciones del Elemento</label>
                <textarea 
                  rows={3}
                  value={formData.observations || ""} 
                  onChange={e => handleFieldChange("observations", e.target.value)} 
                  placeholder="Detalles sobre el estado del elemento o fallas detectadas..." 
                  className="w-full px-4 py-2.5 border-2 border-gray-200 rounded-xl focus:ring-2 focus:ring-primary/30 focus:border-primary/50 transition outline-none text-sm" 
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
              {tarjeta ? "Guardar Cambios" : "Guardar Tarjeta"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
