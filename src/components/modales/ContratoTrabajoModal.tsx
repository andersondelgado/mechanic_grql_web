import React, { useState, useEffect } from "react";
import { createEntity, updateEntity } from "../../api/client";
import { useGrqlList } from "../../hooks/use-grql";

interface ContratoTrabajoModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => void;
  contrato?: any;
}

export default function ContratoTrabajoModal({ isOpen, onClose, onSuccess, contrato }: ContratoTrabajoModalProps) {
  const [formData, setFormData] = useState<any>({
    issue_date: new Date().toISOString().split('T')[0],
    reason: 'CONTRATO LABORAL',
    destination: 'SEDE PRINCIPAL',
    notes: ''
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const { data: empleados } = useGrqlList<any[]>("GestionTallerProd_employees");

  useEffect(() => {
    if (isOpen) {
      if (contrato) {
        setFormData(contrato);
      } else {
        setFormData({
          issue_date: new Date().toISOString().split('T')[0],
          reason: 'CONTRATO LABORAL',
          destination: 'SEDE PRINCIPAL',
          notes: ''
        });
      }
      setError(null);
    }
  }, [isOpen, contrato]);

  if (!isOpen) return null;

  const handleFieldChange = (field: string, value: any) => {
    setFormData((prev: any) => ({ ...prev, [field]: value }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);
    try {
      if (contrato?.id) {
        await updateEntity("GestionTallerProd_work_contracts", contrato.id, formData);
      } else {
        await createEntity("GestionTallerProd_work_contracts", formData);
      }
      onSuccess();
      onClose();
    } catch (err: any) {
      setError(err.message || "Error al guardar el contrato de trabajo");
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
            <i className="fas fa-file-contract text-primary"></i>
            {contrato ? "Editar Contrato de Trabajo" : "Nuevo Contrato de Trabajo"}
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
                <label className="block text-sm font-semibold text-gray-700 mb-2">Empleado / Personal *</label>
                <select
                  required
                  value={formData.employees_fk_id || ""}
                  onChange={e => handleFieldChange("employees_fk_id", e.target.value)}
                  className="w-full px-4 py-2.5 border-2 border-gray-200 rounded-xl focus:ring-2 focus:ring-primary/30 focus:border-primary/50 transition outline-none text-sm"
                >
                  <option value="">Seleccionar Empleado...</option>
                  {empleados?.map((emp: any) => (
                    <option key={emp.id || emp.employee_id} value={emp.id || emp.employee_id}>
                      {emp.employee_name} ({emp.tax_id})
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-2">Fecha de Emisión *</label>
                <input 
                  type="date" 
                  required
                  value={formData.issue_date || ""} 
                  onChange={e => handleFieldChange("issue_date", e.target.value)} 
                  className="w-full px-4 py-2.5 border-2 border-gray-200 rounded-xl focus:ring-2 focus:ring-primary/30 focus:border-primary/50 transition outline-none text-sm" 
                />
              </div>

              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-2">Motivo / Tipo de Contrato</label>
                <input 
                  type="text" 
                  value={formData.reason || ""} 
                  onChange={e => handleFieldChange("reason", e.target.value)} 
                  placeholder="CONTRATO LABORAL / COMISIÓN / PROYECTO" 
                  className="w-full px-4 py-2.5 border-2 border-gray-200 rounded-xl focus:ring-2 focus:ring-primary/30 focus:border-primary/50 transition outline-none text-sm" 
                />
              </div>

              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-2">Destino / Ubicación</label>
                <input 
                  type="text" 
                  value={formData.destination || ""} 
                  onChange={e => handleFieldChange("destination", e.target.value)} 
                  placeholder="SEDE PRINCIPAL / TALLER 1" 
                  className="w-full px-4 py-2.5 border-2 border-gray-200 rounded-xl focus:ring-2 focus:ring-primary/30 focus:border-primary/50 transition outline-none text-sm" 
                />
              </div>

              <div className="md:col-span-2">
                <label className="block text-sm font-semibold text-gray-700 mb-2">Notas / Cláusulas Especiales</label>
                <textarea 
                  rows={3}
                  value={formData.notes || ""} 
                  onChange={e => handleFieldChange("notes", e.target.value)} 
                  placeholder="Condiciones específicas, remuneración o términos pactados..." 
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
              {contrato ? "Guardar Cambios" : "Emitir Contrato"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
