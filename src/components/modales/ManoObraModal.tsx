import React, { useState, useEffect } from "react";
import { createEntity, updateEntity } from "../../api/client";
import { useGrqlList } from "../../hooks/use-grql";

interface ManoObraModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => void;
  manoObra?: any;
}

export default function ManoObraModal({ isOpen, onClose, onSuccess, manoObra }: ManoObraModalProps) {
  const [formData, setFormData] = useState<any>({
    contract_type: 'fijo',
    start_date: new Date().toISOString().split('T')[0],
    salary: 0
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const { data: empleados } = useGrqlList<any[]>("GestionTallerProd_employees");

  useEffect(() => {
    if (isOpen) {
      if (manoObra) {
        let employeeId = manoObra.employees_fk_id;
        if (Array.isArray(employeeId) && employeeId.length > 0) {
          employeeId = typeof employeeId[0] === 'object' ? (employeeId[0].id || employeeId[0].employee_id) : employeeId[0];
        } else if (!employeeId && Array.isArray(manoObra.employees) && manoObra.employees.length > 0) {
          employeeId = manoObra.employees[0]?.id || manoObra.employees[0]?.employee_id;
        }

        const rawDate = manoObra.start_date || manoObra.created_at || '';
        const startDate = rawDate ? String(rawDate).replace(' ', 'T').split('T')[0] : new Date().toISOString().split('T')[0];

        setFormData({
          ...manoObra,
          employees_fk_id: employeeId || '',
          start_date: startDate,
          contract_type: manoObra.contract_type || 'fijo',
          salary: Number(manoObra.salary || 0)
        });
      } else {
        setFormData({
          contract_type: 'fijo',
          start_date: new Date().toISOString().split('T')[0],
          salary: 0
        });
      }
      setError(null);
    }
  }, [isOpen, manoObra]);

  if (!isOpen) return null;

  const handleFieldChange = (field: string, value: any) => {
    setFormData((prev: any) => ({ ...prev, [field]: value }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);
    try {
      if (manoObra?.id) {
        await updateEntity("GestionTallerProd_work_contracts", manoObra.id, formData);
      } else {
        await createEntity("GestionTallerProd_work_contracts", formData);
      }
      onSuccess();
      onClose();
    } catch (err: any) {
      setError(err.message || "Error al guardar el registro de mano de obra");
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
      <div className="bg-white rounded-3xl shadow-strong max-w-lg w-full my-8 mx-auto animate-fadeIn" onClick={(e) => e.stopPropagation()}>
        <div className="p-6 border-b border-gray-100 flex items-center justify-between">
          <h3 className="text-xl font-bold text-secondary flex items-center gap-2">
            <i className="fas fa-hard-hat text-primary"></i>
            {manoObra ? "Editar Contrato" : "Nuevo Contrato / Mano de Obra"}
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
            
            <div className="grid grid-cols-1 gap-5">
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-2">Empleado *</label>
                <select
                  required
                  value={formData.employees_fk_id || ""} 
                  onChange={e => handleFieldChange("employees_fk_id", e.target.value)} 
                  className="w-full px-4 py-2.5 border-2 border-gray-200 rounded-xl focus:ring-2 focus:ring-primary/30 focus:border-primary/50 transition outline-none text-sm bg-white font-medium"
                >
                  <option value="">Seleccionar empleado...</option>
                  {empleados?.map((emp: any) => {
                    const fullName = `${emp.first_name || ''} ${emp.last_name || ''}`.trim() || emp.employee_name || emp.name;
                    return (
                      <option key={emp.id || emp.employee_id} value={emp.id || emp.employee_id}>
                        {fullName} {emp.id_card ? `(${emp.id_card})` : (emp.tax_id ? `(${emp.tax_id})` : '')}
                      </option>
                    );
                  })}
                </select>
              </div>

              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-2">Fecha de Inicio *</label>
                <input 
                  type="date" 
                  required
                  value={formData.start_date || ""} 
                  onChange={e => handleFieldChange("start_date", e.target.value)} 
                  className="w-full px-4 py-2.5 border-2 border-gray-200 rounded-xl focus:ring-2 focus:ring-primary/30 focus:border-primary/50 transition outline-none text-sm" 
                />
              </div>
              
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-2">Tipo de Contrato</label>
                <select
                  value={formData.contract_type || "fijo"} 
                  onChange={e => handleFieldChange("contract_type", e.target.value)} 
                  className="w-full px-4 py-2.5 border-2 border-gray-200 rounded-xl focus:ring-2 focus:ring-primary/30 focus:border-primary/50 transition outline-none text-sm bg-white font-medium"
                >
                  <option value="fijo">Fijo / Base</option>
                  <option value="temporal">Temporal / Por Obra</option>
                  <option value="destajo">A destajo (Por reparación)</option>
                </select>
              </div>

              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-2">Salario / Tarifa Base *</label>
                <input 
                  type="number"
                  step="0.01" 
                  required
                  value={formData.salary || ""} 
                  onChange={e => handleFieldChange("salary", parseFloat(e.target.value))} 
                  placeholder="0.00" 
                  className="w-full px-4 py-2.5 border-2 border-gray-200 rounded-xl focus:ring-2 focus:ring-primary/30 focus:border-primary/50 transition outline-none text-sm font-semibold" 
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
                  <i className="fas fa-save"></i> Guardar Registro
                </>
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
