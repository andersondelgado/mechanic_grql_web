import React, { useState, useEffect } from "react";
import { createEntity, updateEntity } from "../../api/client";
import { useGrqlList } from "../../hooks/use-grql";

interface HistorialModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => void;
  historial?: any;
}

export default function HistorialModal({ isOpen, onClose, onSuccess, historial }: HistorialModalProps) {
  const [formData, setFormData] = useState<any>({
    service_date: new Date().toISOString().split('T')[0],
    total_cost: 0,
    time_in_shop: '1 día'
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const { data: vehiculos } = useGrqlList<any[]>("GestionTallerProd_vehicles");
  const { data: empleados } = useGrqlList<any[]>("GestionTallerProd_employees");

  useEffect(() => {
    if (isOpen) {
      if (historial) {
        let vehicleId = historial.vehicles_fk_id;
        if (Array.isArray(vehicleId) && vehicleId.length > 0) {
          vehicleId = typeof vehicleId[0] === 'object' ? (vehicleId[0].id || vehicleId[0].vehicle_id) : vehicleId[0];
        } else if (!vehicleId && Array.isArray(historial.vehicles) && historial.vehicles.length > 0) {
          vehicleId = historial.vehicles[0]?.id || historial.vehicles[0]?.vehicle_id;
        }

        let employeeId = historial.employees_fk_id;
        if (Array.isArray(employeeId) && employeeId.length > 0) {
          employeeId = typeof employeeId[0] === 'object' ? (employeeId[0].id || employeeId[0].employee_id) : employeeId[0];
        } else if (!employeeId && Array.isArray(historial.employees) && historial.employees.length > 0) {
          employeeId = historial.employees[0]?.id || historial.employees[0]?.employee_id;
        }

        const rawDate = historial.service_date || historial.created_at || '';
        const serviceDate = rawDate ? String(rawDate).replace(' ', 'T').split('T')[0] : new Date().toISOString().split('T')[0];

        setFormData({
          ...historial,
          vehicles_fk_id: vehicleId || '',
          employees_fk_id: employeeId || '',
          service_date: serviceDate,
          total_cost: Number(historial.total_cost || 0),
          time_in_shop: historial.time_in_shop || '1 día'
        });
      } else {
        setFormData({
          service_date: new Date().toISOString().split('T')[0],
          total_cost: 0,
          time_in_shop: '1 día'
        });
      }
      setError(null);
    }
  }, [isOpen, historial]);

  if (!isOpen) return null;

  const handleFieldChange = (field: string, value: any) => {
    setFormData((prev: any) => ({ ...prev, [field]: value }));
  };

  const handleMechanicSelect = (employeeId: string) => {
    const emp = empleados?.find((e: any) => e.id === employeeId || e.employee_id === employeeId);
    setFormData((prev: any) => ({
      ...prev,
      employees_fk_id: employeeId,
      assigned_mechanic: emp?.employee_name || prev.assigned_mechanic || ''
    }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);
    try {
      const payload = {
        ...formData,
        total_cost: parseFloat(formData.total_cost || 0),
      };

      if (historial?.id) {
        await updateEntity("GestionTallerProd_client_history", historial.id, payload);
      } else {
        await createEntity("GestionTallerProd_client_history", payload);
      }
      onSuccess();
      onClose();
    } catch (err: any) {
      setError(err.message || "Error al guardar el historial de servicio");
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
            <i className="fas fa-history text-primary"></i>
            {historial ? "Editar Registro Histórico" : "Nuevo Registro Histórico de Cliente"}
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
                <label className="block text-sm font-semibold text-gray-700 mb-2">Fecha del Servicio *</label>
                <input 
                  type="date" 
                  required
                  value={formData.service_date || ""} 
                  onChange={e => handleFieldChange("service_date", e.target.value)} 
                  className="w-full px-4 py-2.5 border-2 border-gray-200 rounded-xl focus:ring-2 focus:ring-primary/30 focus:border-primary/50 transition outline-none text-sm" 
                />
              </div>

              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-2">Mecánico Asignado</label>
                <select
                  value={formData.employees_fk_id || ""}
                  onChange={e => handleMechanicSelect(e.target.value)}
                  className="w-full px-4 py-2.5 border-2 border-gray-200 rounded-xl focus:ring-2 focus:ring-primary/30 focus:border-primary/50 transition outline-none text-sm"
                >
                  <option value="">Seleccionar Mecánico...</option>
                  {empleados?.map((emp: any) => (
                    <option key={emp.id || emp.employee_id} value={emp.id || emp.employee_id}>
                      {emp.employee_name} ({emp.position || 'Mecánico'})
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-2">Tiempo en Taller</label>
                <input 
                  type="text" 
                  value={formData.time_in_shop || ""} 
                  onChange={e => handleFieldChange("time_in_shop", e.target.value)} 
                  placeholder="Ej: 3 días / 6 horas" 
                  className="w-full px-4 py-2.5 border-2 border-gray-200 rounded-xl focus:ring-2 focus:ring-primary/30 focus:border-primary/50 transition outline-none text-sm" 
                />
              </div>

              <div className="md:col-span-2">
                <label className="block text-sm font-semibold text-gray-700 mb-2">Trabajos Realizados *</label>
                <textarea 
                  rows={2}
                  required
                  value={formData.work_performed || ""} 
                  onChange={e => handleFieldChange("work_performed", e.target.value)} 
                  placeholder="Detalle completo de mantenimiento o reparaciones efectuadas..." 
                  className="w-full px-4 py-2.5 border-2 border-gray-200 rounded-xl focus:ring-2 focus:ring-primary/30 focus:border-primary/50 transition outline-none text-sm" 
                />
              </div>

              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-2">Costo Total ($)</label>
                <input 
                  type="number" 
                  step="0.01"
                  value={formData.total_cost ?? 0} 
                  onChange={e => handleFieldChange("total_cost", e.target.value)} 
                  className="w-full px-4 py-2.5 border-2 border-gray-200 rounded-xl focus:ring-2 focus:ring-primary/30 focus:border-primary/50 transition outline-none text-sm" 
                />
              </div>

              <div className="md:col-span-2">
                <label className="block text-sm font-semibold text-gray-700 mb-2">Observaciones</label>
                <textarea 
                  rows={2}
                  value={formData.observations || ""} 
                  onChange={e => handleFieldChange("observations", e.target.value)} 
                  placeholder="Recomendaciones futuras o notas técnicas..." 
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
              {historial ? "Guardar Cambios" : "Registrar Historial"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
