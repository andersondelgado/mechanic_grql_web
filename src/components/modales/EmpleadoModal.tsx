import React, { useState, useEffect } from "react";
import { createEntity, updateEntity } from "../../api/client";

interface EmpleadoModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => void;
  empleado?: any;
}

export default function EmpleadoModal({ isOpen, onClose, onSuccess, empleado }: EmpleadoModalProps) {
  const [formData, setFormData] = useState<any>({ is_mechanic: false });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (isOpen) {
      if (empleado) {
        setFormData({
          ...empleado,
          is_mechanic: !!empleado.is_mechanic
        });
      } else {
        setFormData({ is_mechanic: false });
      }
      setError(null);
    }
  }, [isOpen, empleado]);

  if (!isOpen) return null;

  const handleFieldChange = (field: string, value: any) => {
    setFormData((prev: any) => ({ ...prev, [field]: value }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);
    try {
      if (empleado?.id) {
        await updateEntity("GestionTallerProd_employees", empleado.id, formData);
      } else {
        await createEntity("GestionTallerProd_employees", formData);
      }
      onSuccess();
      onClose();
    } catch (err: any) {
      setError(err.message || "Error al guardar el empleado");
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
            <i className="fas fa-user-tie text-primary"></i>
            {empleado ? "Editar Empleado" : "Nuevo Empleado"}
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
              <div className="md:col-span-2">
                <label className="block text-sm font-semibold text-gray-700 mb-2">Nombre Completo *</label>
                <input 
                  type="text" 
                  required
                  value={formData.employee_name || ""} 
                  onChange={e => handleFieldChange("employee_name", e.target.value)} 
                  placeholder="Ej: Carlos Méndez" 
                  className="w-full px-4 py-2.5 border-2 border-gray-200 rounded-xl focus:ring-2 focus:ring-primary/30 focus:border-primary/50 transition outline-none text-sm" 
                />
              </div>

              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-2">Cédula / Documento *</label>
                <input 
                  type="text" 
                  required
                  value={formData.tax_id || ""} 
                  onChange={e => handleFieldChange("tax_id", e.target.value)} 
                  placeholder="V-12345678" 
                  className="w-full px-4 py-2.5 border-2 border-gray-200 rounded-xl focus:ring-2 focus:ring-primary/30 focus:border-primary/50 transition outline-none text-sm uppercase" 
                />
              </div>
              
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-2">Teléfono</label>
                <input 
                  type="tel" 
                  value={formData.phone || ""} 
                  onChange={e => handleFieldChange("phone", e.target.value)} 
                  placeholder="0414-XXXXXXX" 
                  className="w-full px-4 py-2.5 border-2 border-gray-200 rounded-xl focus:ring-2 focus:ring-primary/30 focus:border-primary/50 transition outline-none text-sm" 
                />
              </div>

              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-2">Cargo / Posición</label>
                <input 
                  type="text" 
                  value={formData.position || ""} 
                  onChange={e => handleFieldChange("position", e.target.value)} 
                  placeholder="Ej: Jefe de Taller, Pintor, Ayudante..." 
                  className="w-full px-4 py-2.5 border-2 border-gray-200 rounded-xl focus:ring-2 focus:ring-primary/30 focus:border-primary/50 transition outline-none text-sm" 
                />
              </div>

              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-2">Salario Base</label>
                <input 
                  type="number"
                  step="0.01" 
                  value={formData.salary || ""} 
                  onChange={e => handleFieldChange("salary", parseFloat(e.target.value))} 
                  placeholder="0.00" 
                  className="w-full px-4 py-2.5 border-2 border-gray-200 rounded-xl focus:ring-2 focus:ring-primary/30 focus:border-primary/50 transition outline-none text-sm" 
                />
              </div>

              <div className="md:col-span-2 pt-2">
                <label className="flex items-center gap-3 cursor-pointer p-4 border-2 border-gray-100 rounded-xl hover:bg-gray-50 transition">
                  <div className="relative">
                    <input 
                      type="checkbox" 
                      className="sr-only" 
                      checked={formData.is_mechanic || false}
                      onChange={e => handleFieldChange("is_mechanic", e.target.checked)}
                    />
                    <div className={`block w-12 h-6 rounded-full transition-colors ${formData.is_mechanic ? 'bg-primary' : 'bg-gray-300'}`}></div>
                    <div className={`dot absolute left-1 top-1 bg-white w-4 h-4 rounded-full transition-transform ${formData.is_mechanic ? 'transform translate-x-6' : ''}`}></div>
                  </div>
                  <div>
                    <div className="font-semibold text-gray-800 text-sm">Este empleado ejerce labores de Mecánico</div>
                    <div className="text-xs text-gray-500">Marcar esta opción permite que el empleado sea asignado a reparaciones y órdenes de trabajo.</div>
                  </div>
                </label>
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
