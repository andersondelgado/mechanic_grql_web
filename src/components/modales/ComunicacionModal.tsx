import React, { useState, useEffect } from "react";
import { createEntity, updateEntity } from "../../api/client";
import { useGrqlList } from "../../hooks/use-grql";

interface ComunicacionModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => void;
  comunicacion?: any;
}

export default function ComunicacionModal({ isOpen, onClose, onSuccess, comunicacion }: ComunicacionModalProps) {
  const [formData, setFormData] = useState<any>({
    communication_date: new Date().toISOString().split('T')[0],
    communication_type: 'MEMORANDUM',
    subject: '',
    content: ''
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const { data: empleados } = useGrqlList<any[]>("GestionTallerProd_employees");

  useEffect(() => {
    if (isOpen) {
      if (comunicacion) {
        setFormData(comunicacion);
      } else {
        setFormData({
          communication_date: new Date().toISOString().split('T')[0],
          communication_type: 'MEMORANDUM',
          subject: '',
          content: ''
        });
      }
      setError(null);
    }
  }, [isOpen, comunicacion]);

  if (!isOpen) return null;

  const handleFieldChange = (field: string, value: any) => {
    setFormData((prev: any) => ({ ...prev, [field]: value }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);
    try {
      if (comunicacion?.id) {
        await updateEntity("GestionTallerProd_communications", comunicacion.id, formData);
      } else {
        await createEntity("GestionTallerProd_communications", formData);
      }
      onSuccess();
      onClose();
    } catch (err: any) {
      setError(err.message || "Error al guardar la comunicación");
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
            <i className="fas fa-bullhorn text-primary"></i>
            {comunicacion ? "Editar Comunicación" : "Nueva Comunicación Interna"}
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
                <label className="block text-sm font-semibold text-gray-700 mb-2">Destinatario / Empleado</label>
                <select
                  value={formData.employees_fk_id || ""}
                  onChange={e => handleFieldChange("employees_fk_id", e.target.value)}
                  className="w-full px-4 py-2.5 border-2 border-gray-200 rounded-xl focus:ring-2 focus:ring-primary/30 focus:border-primary/50 transition outline-none text-sm"
                >
                  <option value="">Todos los Empleados (General)</option>
                  {empleados?.map((emp: any) => (
                    <option key={emp.id || emp.employee_id} value={emp.id || emp.employee_id}>
                      {emp.employee_name}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-2">Fecha *</label>
                <input 
                  type="date" 
                  required
                  value={formData.communication_date || ""} 
                  onChange={e => handleFieldChange("communication_date", e.target.value)} 
                  className="w-full px-4 py-2.5 border-2 border-gray-200 rounded-xl focus:ring-2 focus:ring-primary/30 focus:border-primary/50 transition outline-none text-sm" 
                />
              </div>

              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-2">Tipo de Comunicación</label>
                <select
                  value={formData.communication_type || "MEMORANDUM"}
                  onChange={e => handleFieldChange("communication_type", e.target.value)}
                  className="w-full px-4 py-2.5 border-2 border-gray-200 rounded-xl focus:ring-2 focus:ring-primary/30 focus:border-primary/50 transition outline-none text-sm"
                >
                  <option value="MEMORANDUM">MEMORANDUM</option>
                  <option value="CIRCULAR">CIRCULAR INFORMATIVA</option>
                  <option value="NOTIFICACION">NOTIFICACIÓN</option>
                  <option value="FELICITACION">FELICITACIÓN / RECONOCIMIENTO</option>
                  <option value="LLAMADO DE ATENCION">LLAMADO DE ATENCIÓN</option>
                </select>
              </div>

              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-2">Asunto *</label>
                <input 
                  type="text" 
                  required
                  value={formData.subject || ""} 
                  onChange={e => handleFieldChange("subject", e.target.value)} 
                  placeholder="HORARIO DE TRABAJO / MEDIDAS DE SEGURIDAD" 
                  className="w-full px-4 py-2.5 border-2 border-gray-200 rounded-xl focus:ring-2 focus:ring-primary/30 focus:border-primary/50 transition outline-none text-sm" 
                />
              </div>

              <div className="md:col-span-2">
                <label className="block text-sm font-semibold text-gray-700 mb-2">Contenido de la Comunicación</label>
                <textarea 
                  rows={4}
                  value={formData.content || ""} 
                  onChange={e => handleFieldChange("content", e.target.value)} 
                  placeholder="Redactar el contenido o indicaciones institucionales..." 
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
              {comunicacion ? "Guardar Cambios" : "Emitir Comunicación"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
