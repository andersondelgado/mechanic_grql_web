import React, { useState, useEffect } from "react";
import { createEntity, updateEntity } from "../../api/client";
import { useCurrency } from "../../context/CurrencyContext";

interface TransaccionModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => void;
  transaccion?: any;
}

function formatDateForInput(rawDate: any): string {
  if (!rawDate) return new Date().toISOString().split('T')[0];
  const str = String(rawDate).trim();
  const match = str.match(/^(\d{4}-\d{2}-\d{2})/);
  if (match) return match[1];
  const dmyMatch = str.match(/^(\d{1,2})[\/-](\d{1,2})[\/-](\d{4})/);
  if (dmyMatch) {
    const day = dmyMatch[1].padStart(2, '0');
    const month = dmyMatch[2].padStart(2, '0');
    const year = dmyMatch[3];
    return `${year}-${month}-${day}`;
  }
  const d = new Date(str);
  if (!isNaN(d.getTime())) {
    return d.toISOString().split('T')[0];
  }
  return '';
}

export default function TransaccionModal({ isOpen, onClose, onSuccess, transaccion }: TransaccionModalProps) {
  const { currencies, paymentMethods } = useCurrency();
  const vesCurrency = currencies.find(c => c.code === 'VES');
  const defaultRate = vesCurrency?.rate || 50;

  const [formData, setFormData] = useState<any>({
    transaction_date: new Date().toISOString().split('T')[0],
    month: new Date().toLocaleString('es-ES', { month: 'long' }),
    minor_rep_income: 0,
    major_rep_income: 0,
    other_income: 0,
    salary_expense: 0,
    rent_expense: 0,
    supplies_expense: 0,
    tools_equipment_expense: 0,
    other_expenses: 0,
    total_expenses: 0,
    total_amount: 0,
    exchange_rate: defaultRate,
    type: 'Ingreso',
    description: '',
    payment_method_id: ''
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (isOpen) {
      if (transaccion) {
        const totalExpenses = Number(transaccion.total_expenses || 0) || (
          Number(transaccion.salary_expense || 0) +
          Number(transaccion.rent_expense || 0) +
          Number(transaccion.supplies_expense || 0) +
          Number(transaccion.tools_equipment_expense || 0) +
          Number(transaccion.other_expenses || 0)
        );
        const totalIncome = Number(transaccion.total_amount || 0) || (
          Number(transaccion.minor_rep_income || 0) +
          Number(transaccion.major_rep_income || 0) +
          Number(transaccion.other_income || 0)
        );
        const isExp = (totalExpenses > 0) || transaccion.type === 'Gasto';
        const amount = isExp ? totalExpenses : (totalIncome || Number(transaccion.total_amount || 0));
        const cleanRate = (!transaccion.exchange_rate || Number(transaccion.exchange_rate) === 2026) ? 380 : Number(transaccion.exchange_rate);

        setFormData({
          ...transaccion,
          transaction_date: formatDateForInput(transaccion.transaction_date),
          type: isExp ? 'Gasto' : 'Ingreso',
          total_amount: amount,
          exchange_rate: cleanRate,
          description: transaccion.description || ''
        });
      } else {
        setFormData({
          transaction_date: new Date().toISOString().split('T')[0],
          month: new Date().toLocaleString('es-ES', { month: 'long' }),
          minor_rep_income: 0,
          major_rep_income: 0,
          other_income: 0,
          salary_expense: 0,
          rent_expense: 0,
          supplies_expense: 0,
          tools_equipment_expense: 0,
          other_expenses: 0,
          total_expenses: 0,
          total_amount: 0,
          exchange_rate: 380,
          type: 'Ingreso',
          description: ''
        });
      }
      setError(null);
    }
  }, [isOpen, transaccion]);

  if (!isOpen) return null;

  const handleFieldChange = (field: string, value: any) => {
    setFormData((prev: any) => ({ ...prev, [field]: value }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);
    try {
      const amount = parseFloat(formData.total_amount || 0);
      const isExpense = formData.type === 'Gasto';
      const dateStr = formData.transaction_date 
        ? `${formData.transaction_date} 00:00:00`
        : new Date().toISOString().split('T')[0] + ' 00:00:00';

      const payload: any = {
        month: formData.month || new Date(formData.transaction_date || new Date()).toLocaleString('es-ES', { month: 'short' }).toLowerCase(),
        transaction_date: dateStr,
        description: formData.description || '',
        exchange_rate: parseFloat(formData.exchange_rate || 380),
        minor_rep_income: isExpense ? 0 : parseFloat(formData.minor_rep_income || 0),
        major_rep_income: isExpense ? 0 : parseFloat(formData.major_rep_income || 0),
        other_income: isExpense ? 0 : (
          (parseFloat(formData.minor_rep_income || 0) + parseFloat(formData.major_rep_income || 0) > 0)
            ? parseFloat(formData.other_income || 0)
            : amount
        ),
        salary_expense: isExpense ? parseFloat(formData.salary_expense || 0) : 0,
        rent_expense: isExpense ? parseFloat(formData.rent_expense || 0) : 0,
        supplies_expense: isExpense ? parseFloat(formData.supplies_expense || 0) : 0,
        tools_equipment_expense: isExpense ? parseFloat(formData.tools_equipment_expense || 0) : 0,
        other_expenses: isExpense ? (
          (parseFloat(formData.salary_expense || 0) + parseFloat(formData.rent_expense || 0) + parseFloat(formData.supplies_expense || 0) + parseFloat(formData.tools_equipment_expense || 0) > 0)
            ? parseFloat(formData.other_expenses || 0)
            : amount
        ) : 0,
        total_expenses: isExpense ? amount : 0,
        total_amount: amount,
      };

      const targetId = transaccion?.id || transaccion?.transaction_id;
      if (targetId) {
        await updateEntity("GestionTallerProd_financial_transactions", targetId, payload);
      } else {
        await createEntity("GestionTallerProd_financial_transactions", payload);
      }
      onSuccess();
      onClose();
    } catch (err: any) {
      setError(err.message || "Error al guardar el movimiento financiero");
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
            <i className="fas fa-chart-line text-primary"></i>
            {transaccion ? "Editar Movimiento Financiero" : "Nuevo Ingreso / Gasto"}
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
                <label className="block text-sm font-semibold text-gray-700 mb-2">Fecha *</label>
                <input 
                  type="date" 
                  required
                  value={formData.transaction_date || ""} 
                  onChange={e => handleFieldChange("transaction_date", e.target.value)} 
                  className="w-full px-4 py-2.5 border-2 border-gray-200 rounded-xl focus:ring-2 focus:ring-primary/30 focus:border-primary/50 transition outline-none text-sm" 
                />
              </div>

              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-2">Tipo de Movimiento</label>
                <select
                  value={formData.type || "Ingreso"}
                  onChange={e => handleFieldChange("type", e.target.value)}
                  className="w-full px-4 py-2.5 border-2 border-gray-200 rounded-xl focus:ring-2 focus:ring-primary/30 focus:border-primary/50 transition outline-none text-sm"
                >
                  <option value="Ingreso">Ingreso (+)</option>
                  <option value="Gasto">Gasto (-)</option>
                </select>
              </div>

              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-2">Método de Pago</label>
                <select
                  value={formData.payment_method_id || ""}
                  onChange={e => {
                    const pmId = e.target.value;
                    const selected = paymentMethods.find(p => p.id === pmId);
                    handleFieldChange("payment_method_id", pmId);
                    if (selected) {
                      handleFieldChange("payment_method_name", selected.title);
                      if (!formData.description) {
                        handleFieldChange("description", `${formData.type || 'Movimiento'} vía ${selected.title}`);
                      }
                    }
                  }}
                  className="w-full px-4 py-2.5 border-2 border-gray-200 rounded-xl focus:ring-2 focus:ring-primary/30 focus:border-primary/50 transition outline-none text-sm bg-white"
                >
                  <option value="">-- Seleccionar Método de Pago --</option>
                  {paymentMethods.map(pm => (
                    <option key={pm.id} value={pm.id}>
                      {pm.country === 'VE' ? '🇻🇪' : pm.country === 'US' ? '🇺🇸' : pm.country === 'CO' ? '🇨🇴' : pm.country === 'ES' ? '🇪🇸' : '🌐'} {pm.title} ({pm.currency})
                    </option>
                  ))}
                </select>
              </div>

              <div className="md:col-span-2">
                <label className="block text-sm font-semibold text-gray-700 mb-2">Descripción del Movimiento *</label>
                <input 
                  type="text" 
                  required
                  value={formData.description || ""} 
                  onChange={e => handleFieldChange("description", e.target.value)} 
                  placeholder="DEVOLUCION DE DEUDAS / COMPRA DE EQUIPOS AA / PAGO DE NOMINA" 
                  className="w-full px-4 py-2.5 border-2 border-gray-200 rounded-xl focus:ring-2 focus:ring-primary/30 focus:border-primary/50 transition outline-none text-sm" 
                />
              </div>

              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-2">Monto ($ USD) *</label>
                <input 
                  type="number" 
                  step="0.01"
                  required
                  value={formData.total_amount ?? 0} 
                  onChange={e => handleFieldChange("total_amount", e.target.value)} 
                  className="w-full px-4 py-2.5 border-2 border-gray-200 rounded-xl focus:ring-2 focus:ring-primary/30 focus:border-primary/50 transition outline-none text-sm font-bold" 
                />
              </div>

              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-2">Tasa de Cambio (Bs/$)</label>
                <input 
                  type="number" 
                  step="0.01"
                  value={formData.exchange_rate ?? 1} 
                  onChange={e => handleFieldChange("exchange_rate", e.target.value)} 
                  className="w-full px-4 py-2.5 border-2 border-gray-200 rounded-xl focus:ring-2 focus:ring-primary/30 focus:border-primary/50 transition outline-none text-sm" 
                />
              </div>

              {/* Cálculo en vivo de equivalencia */}
              <div className="md:col-span-2 bg-blue-50/60 border border-blue-200/80 p-3.5 rounded-2xl flex flex-wrap items-center justify-between text-xs gap-2">
                <span className="font-bold text-blue-900 flex items-center gap-1.5">
                  <i className="fas fa-coins text-primary"></i> Equivalencia al cambio:
                </span>
                <span className="font-mono font-extrabold text-primary text-sm">
                  Bs. {new Intl.NumberFormat('es-VE', { minimumFractionDigits: 2, maximumFractionDigits: 2 }).format((parseFloat(formData.total_amount) || 0) * (parseFloat(formData.exchange_rate) || 1))} VES
                </span>
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
              {transaccion ? "Guardar Cambios" : "Registrar Movimiento"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
