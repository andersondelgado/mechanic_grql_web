import React, { useMemo } from "react";
import { resolveVehicleId, resolveClientId, findClientForVehicle } from "../../utils/entityHelpers";
import { useGrqlList } from "../../hooks/use-grql";
import type { InspectionAnalysis } from "../../types/entities";

interface InformePeritajeModalProps {
  isOpen: boolean;
  onClose: () => void;
  peritaje: any;
  onRunAiAnalysis?: (item: any) => void;
}

export default function InformePeritajeModal({
  isOpen,
  onClose,
  peritaje,
  onRunAiAnalysis
}: InformePeritajeModalProps) {
  // Carga de entidades para enriquecer el informe si no vienen embebidas
  const { data: vehiculosList } = useGrqlList<any[]>("GestionTallerProd_vehicles", { pagination: { page: 1, size: 500 } });
  const { data: clientesList } = useGrqlList<any[]>("GestionTallerProd_clients", { pagination: { page: 1, size: 500 } });
  const { data: analysisList } = useGrqlList<any[]>("GestionTallerProd_inspection_analysis", { pagination: { page: 1, size: 500 } });
  const { data: employeesList } = useGrqlList<any[]>("GestionTallerProd_employees", { pagination: { page: 1, size: 200 } });

  // 1. Resolver el análisis IA
  const analysis: InspectionAnalysis | null = useMemo(() => {
    if (!peritaje) return null;
    // Directamente en el peritaje si vino de una relación expandida
    if (Array.isArray(peritaje.inspection_analysis) && peritaje.inspection_analysis.length > 0) {
      return peritaje.inspection_analysis[0];
    }
    if (peritaje.analysis && typeof peritaje.analysis === 'object') {
      return peritaje.analysis;
    }
    // Buscar en analysisList
    if (analysisList && analysisList.length > 0) {
      const peritajeId = peritaje.id || peritaje.card_id;
      const match = analysisList.find((a: any) =>
        (a.inspection_cards_fk_id && a.inspection_cards_fk_id === peritajeId) ||
        (Array.isArray(a.inspection_cards) && a.inspection_cards.some((c: any) => (c.id || c) === peritajeId))
      );
      if (match) return match;
    }
    return null;
  }, [peritaje, analysisList]);

  // 2. Resolver el vehículo
  const vehicle = useMemo(() => {
    if (!peritaje) return null;
    if (Array.isArray(peritaje.vehicles) && peritaje.vehicles.length > 0) {
      return peritaje.vehicles[0];
    }
    if (peritaje.vehicle && typeof peritaje.vehicle === 'object') {
      return peritaje.vehicle;
    }
    const vId = resolveVehicleId(peritaje, vehiculosList || undefined);
    if (vId && vehiculosList) {
      const strId = String(vId);
      return vehiculosList.find((v: any) =>
        (v.id && String(v.id) === strId) ||
        (v.vehicle_id && String(v.vehicle_id) === strId) ||
        (v._id && String(v._id) === strId)
      ) || null;
    }
    return null;
  }, [peritaje, vehiculosList]);

  // 3. Resolver el cliente
  const client = useMemo(() => {
    if (!peritaje) return null;
    // Si el peritaje ya tiene relación directa con el cliente
    if (Array.isArray(peritaje.clients) && peritaje.clients.length > 0) {
      return peritaje.clients[0];
    }
    if (peritaje.client && typeof peritaje.client === 'object') {
      return peritaje.client;
    }

    // Resolver por ID del peritaje
    const cId = resolveClientId(peritaje, clientesList || undefined);
    if (cId && clientesList) {
      const strId = String(cId);
      const match = clientesList.find((c: any) =>
        (c.id && String(c.id) === strId) ||
        (c.client_id && String(c.client_id) === strId) ||
        (c._id && String(c._id) === strId)
      );
      if (match) return match;
    }

    // Si no está directamente, resolver a través del vehículo
    if (vehicle) {
      const directClient = vehicle.clients?.[0];
      const associatedClient = findClientForVehicle(vehicle, clientesList || undefined);
      if (associatedClient) return associatedClient;
      if (directClient) return directClient;
    }
    return null;
  }, [peritaje, vehicle, clientesList]);

  // 4. Resolver el inspector / empleado
  const inspector = useMemo(() => {
    if (!peritaje) return null;
    if (Array.isArray(peritaje.employees) && peritaje.employees.length > 0) {
      return peritaje.employees[0];
    }
    if (peritaje.employee && typeof peritaje.employee === 'object') {
      return peritaje.employee;
    }
    const empId = peritaje.employees_fk_id;
    if (empId && employeesList) {
      const strId = String(empId);
      return employeesList.find((e: any) =>
        (e.id && String(e.id) === strId) ||
        (e.employee_id && String(e.employee_id) === strId)
      ) || null;
    }
    return null;
  }, [peritaje, employeesList]);

  if (!isOpen || !peritaje) return null;

  const peritajeCode = peritaje.id ? `PER-${String(peritaje.id).slice(-4).toUpperCase()}` : 'PER-001';
  const peritajeDate = peritaje.inspection_date
    ? new Date(peritaje.inspection_date).toLocaleDateString('es-ES', {
        year: 'numeric',
        month: 'long',
        day: 'numeric'
      })
    : new Date().toLocaleDateString('es-ES');

  // Formato de listas para partes y repuestos
  const affectedParts: string[] = Array.isArray(analysis?.affected_parts)
    ? analysis!.affected_parts
    : typeof analysis?.affected_parts === 'string'
    ? String(analysis!.affected_parts).split(',').map(s => s.trim()).filter(Boolean)
    : [];

  const partsNeeded: string[] = Array.isArray(analysis?.parts_needed)
    ? analysis!.parts_needed
    : typeof analysis?.parts_needed === 'string'
    ? String(analysis!.parts_needed).split(',').map(s => s.trim()).filter(Boolean)
    : [];

  const recommendedActions: string[] = Array.isArray(analysis?.recommended_actions)
    ? analysis!.recommended_actions
    : typeof analysis?.recommended_actions === 'string'
    ? String(analysis!.recommended_actions).split(',').map(s => s.trim()).filter(Boolean)
    : [];

  const severityColor = (sev?: string) => {
    const s = String(sev || '').toLowerCase();
    if (s.includes('grave') || s.includes('alto') || s.includes('high') || s.includes('severo')) {
      return {
        bg: 'bg-red-50 text-red-700 border-red-200',
        badge: 'bg-red-600 text-white',
        label: 'Grave / Severo'
      };
    }
    if (s.includes('moderado') || s.includes('medio') || s.includes('medium')) {
      return {
        bg: 'bg-amber-50 text-amber-800 border-amber-200',
        badge: 'bg-amber-500 text-white',
        label: 'Moderado'
      };
    }
    return {
      bg: 'bg-emerald-50 text-emerald-700 border-emerald-200',
      badge: 'bg-emerald-600 text-white',
      label: 'Leve'
    };
  };

  const sevStyle = severityColor(analysis?.damage_severity);

  const handlePrint = () => {
    window.print();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm overflow-y-auto animate-fade-in print:p-0 print:bg-white print:static">
      <div className="bg-white rounded-3xl shadow-2xl max-w-4xl w-full max-h-[92vh] flex flex-col overflow-hidden border border-gray-150 print:max-h-none print:shadow-none print:border-none print:rounded-none">
        
        {/* Header de la Modal (Acciones en pantalla) */}
        <div className="p-5 md:p-6 bg-gradient-to-r from-secondary to-slate-900 text-white flex items-center justify-between border-b border-gray-800 shrink-0 print:hidden">
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 bg-purple-500/20 text-purple-300 rounded-2xl flex items-center justify-center border border-purple-400/30">
              <i className="fas fa-file-invoice text-2xl"></i>
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h2 className="text-xl font-bold tracking-tight">Informe Técnico de Peritaje</h2>
                <span className="px-2.5 py-0.5 rounded-full text-xs font-mono font-bold bg-purple-500/30 text-purple-200 border border-purple-400/30">
                  {peritajeCode}
                </span>
              </div>
              <p className="text-xs text-gray-400 mt-0.5">
                Diagnóstico pericial con Inteligencia Artificial Gemini Multimodal
              </p>
            </div>
          </div>
          <div className="flex items-center gap-2.5">
            <button
              onClick={handlePrint}
              className="px-4 py-2 bg-white/10 hover:bg-white/20 text-white rounded-xl font-semibold text-xs transition flex items-center gap-2 border border-white/10"
              title="Imprimir informe o guardar como PDF"
            >
              <i className="fas fa-print"></i>
              <span className="hidden sm:inline">Imprimir / PDF</span>
            </button>
            <button
              onClick={onClose}
              className="w-10 h-10 rounded-xl bg-white/10 hover:bg-white/20 text-gray-300 hover:text-white flex items-center justify-center transition border border-white/10"
              title="Cerrar ventana"
            >
              <i className="fas fa-xmark text-lg"></i>
            </button>
          </div>
        </div>

        {/* Cuerpo del Informe (Scrollable e imprimible) */}
        <div className="flex-1 overflow-y-auto p-6 md:p-8 space-y-6 print:overflow-visible print:p-0 print:space-y-4 text-gray-800">
          
          {/* Encabezado Oficial / Membrete Corporativo */}
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between pb-6 border-b-2 border-gray-200 gap-4">
            <div className="flex items-center gap-3.5">
              <div className="w-14 h-14 bg-primary text-white rounded-2xl flex items-center justify-center text-2xl font-bold shadow-soft">
                <i className="fas fa-car-burst"></i>
              </div>
              <div>
                <h1 className="text-xl font-black text-secondary tracking-tight">TALLER INTEGRAL 360</h1>
                <p className="text-xs text-gray-500 font-medium">Urbaez Motors 2030 C.A. • RIF: J-50349281-0</p>
                <p className="text-[11px] text-gray-400">Servicio de Peritaje, Latonería, Pintura y Mecánica Avanzada</p>
              </div>
            </div>
            <div className="text-left sm:text-right">
              <span className="inline-block px-3 py-1 bg-primary/10 text-primary font-mono font-bold text-xs rounded-lg border border-primary/20">
                DICTAMEN TÉCNICO #{peritajeCode}
              </span>
              <p className="text-xs text-gray-500 mt-1 font-medium">
                Fecha de Peritaje: <span className="font-bold text-gray-700">{peritajeDate}</span>
              </p>
              <p className="text-xs text-gray-500 font-medium">
                Tipo: <span className="font-bold text-gray-700 capitalize">{peritaje.inspection_type || 'Revisión General'}</span>
              </p>
            </div>
          </div>

          {/* Bloque Superior: Datos del Cliente y Datos del Vehículo (Lado a lado) */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            
            {/* Tarjeta: Datos del Cliente */}
            <div className="bg-gradient-to-br from-blue-50/50 to-indigo-50/40 rounded-2xl p-5 border border-blue-100/80 shadow-2xs">
              <div className="flex items-center gap-2 mb-3 pb-2 border-b border-blue-100 text-primary font-bold text-xs uppercase tracking-wider">
                <i className="fas fa-user-circle text-base"></i>
                <span>Datos del Propietario / Cliente</span>
              </div>
              {client ? (
                <div className="space-y-2 text-xs">
                  <div>
                    <span className="text-gray-400 block text-[10px] uppercase font-bold">Nombre o Razón Social</span>
                    <p className="font-bold text-secondary text-sm">{client.client_name || client.name || 'No especificado'}</p>
                  </div>
                  <div className="grid grid-cols-2 gap-2 pt-1">
                    <div>
                      <span className="text-gray-400 block text-[10px] uppercase font-bold">Cédula / RIF</span>
                      <p className="font-semibold text-gray-700">{client.tax_id || 'N/A'}</p>
                    </div>
                    <div>
                      <span className="text-gray-400 block text-[10px] uppercase font-bold">Teléfono</span>
                      <p className="font-semibold text-gray-700">{client.phone || 'N/A'}</p>
                    </div>
                  </div>
                  <div className="pt-1">
                    <span className="text-gray-400 block text-[10px] uppercase font-bold">Correo Electrónico</span>
                    <p className="font-medium text-gray-600 truncate">{client.email || 'N/A'}</p>
                  </div>
                  {client.address && (
                    <div className="pt-1">
                      <span className="text-gray-400 block text-[10px] uppercase font-bold">Dirección</span>
                      <p className="font-medium text-gray-600 text-[11px]">{client.address}</p>
                    </div>
                  )}
                </div>
              ) : (
                <div className="py-4 text-center text-gray-400 text-xs">
                  <i className="fas fa-user-slash text-2xl mb-1.5 opacity-40"></i>
                  <p className="font-medium">Cliente no asignado directamente</p>
                  {vehicle && <p className="text-[11px] text-gray-500 mt-0.5">Vehículo sin cliente vinculado en catálogo</p>}
                </div>
              )}
            </div>

            {/* Tarjeta: Datos del Vehículo */}
            <div className="bg-gradient-to-br from-slate-50 to-gray-100/60 rounded-2xl p-5 border border-gray-200 shadow-2xs">
              <div className="flex items-center gap-2 mb-3 pb-2 border-b border-gray-200 text-secondary font-bold text-xs uppercase tracking-wider">
                <i className="fas fa-car-side text-base text-primary"></i>
                <span>Identificación del Vehículo Inspeccionado</span>
              </div>
              {vehicle ? (
                <div className="space-y-2 text-xs">
                  <div className="flex items-center justify-between">
                    <div>
                      <span className="text-gray-400 block text-[10px] uppercase font-bold">Marca y Modelo</span>
                      <p className="font-bold text-secondary text-sm">
                        {vehicle.brand || ''} {vehicle.model || ''}
                      </p>
                    </div>
                    <div className="px-3 py-1 bg-yellow-400/90 text-gray-900 font-mono font-black text-sm rounded-lg border-2 border-yellow-500 shadow-2xs tracking-widest uppercase">
                      {vehicle.license_plate || vehicle.plate || 'SIN PLACA'}
                    </div>
                  </div>
                  <div className="grid grid-cols-3 gap-2 pt-1">
                    <div>
                      <span className="text-gray-400 block text-[10px] uppercase font-bold">Año</span>
                      <p className="font-semibold text-gray-700">{vehicle.year || 'N/A'}</p>
                    </div>
                    <div>
                      <span className="text-gray-400 block text-[10px] uppercase font-bold">Color</span>
                      <p className="font-semibold text-gray-700 capitalize">{vehicle.color || 'N/A'}</p>
                    </div>
                    <div>
                      <span className="text-gray-400 block text-[10px] uppercase font-bold">Kilometraje</span>
                      <p className="font-semibold text-gray-700">{peritaje.mileage || vehicle.mileage || '—'} km</p>
                    </div>
                  </div>
                  <div className="pt-1">
                    <span className="text-gray-400 block text-[10px] uppercase font-bold">VIN / Número de Chasis</span>
                    <p className="font-mono text-gray-700 text-[11px] truncate">{vehicle.vin || 'No registrado'}</p>
                  </div>
                </div>
              ) : (
                <div className="py-4 text-center text-gray-400 text-xs">
                  <i className="fas fa-car-burst text-2xl mb-1.5 opacity-40"></i>
                  <p className="font-medium">Vehículo no identificado</p>
                  <p className="text-[11px] text-gray-500 mt-0.5">ID Ref: {peritaje.vehicles_fk_id || 'N/A'}</p>
                </div>
              )}
            </div>

          </div>

          {/* Sección Principal: Dictamen Técnico de IA Gemini */}
          <div className="bg-white rounded-2xl border-2 border-purple-200/80 p-5 md:p-6 shadow-sm space-y-5">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between pb-3 border-b border-purple-100 gap-2">
              <div className="flex items-center gap-2.5">
                <div className="w-9 h-9 rounded-xl bg-purple-600 text-white flex items-center justify-center shadow-soft">
                  <i className="fas fa-brain text-lg"></i>
                </div>
                <div>
                  <h3 className="font-bold text-secondary text-base">Evaluación Pericial con Gemini Multimodal</h3>
                  <p className="text-[11px] text-gray-500">Inspección de carrocería, daños estructurales y piezas mecánicas</p>
                </div>
              </div>
              {analysis && (
                <div className="flex items-center gap-2 self-start sm:self-auto">
                  <span className={`px-3 py-1 rounded-full text-xs font-bold uppercase tracking-wider ${sevStyle.bg} border`}>
                    Severidad: {sevStyle.label}
                  </span>
                  {analysis.confidence_score !== undefined && (
                    <span className="px-2.5 py-1 bg-purple-100 text-purple-800 rounded-full text-xs font-bold flex items-center gap-1">
                      <i className="fas fa-check-circle text-purple-600"></i>
                      {analysis.confidence_score}% Certeza
                    </span>
                  )}
                </div>
              )}
            </div>

            {analysis ? (
              <div className="space-y-4">
                {/* Métricas destacadas del peritaje */}
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                  <div className="p-3.5 bg-gray-50 rounded-xl border border-gray-150">
                    <span className="text-[11px] font-bold uppercase text-gray-400 block">Tipo de Daño Principal</span>
                    <p className="text-sm font-bold text-secondary mt-0.5 capitalize">
                      {String(analysis.damage_type || 'Evaluación general').replace(/_/g, ' ')}
                    </p>
                  </div>
                  <div className="p-3.5 bg-gray-50 rounded-xl border border-gray-150">
                    <span className="text-[11px] font-bold uppercase text-gray-400 block">Mano de Obra Estimada</span>
                    <p className="text-sm font-bold text-secondary mt-0.5 flex items-center gap-1.5">
                      <i className="fas fa-clock text-amber-500"></i>
                      {analysis.repair_estimated_hours || 0} Horas de taller
                    </p>
                  </div>
                  <div className="p-3.5 bg-gray-50 rounded-xl border border-gray-150">
                    <span className="text-[11px] font-bold uppercase text-gray-400 block">Estado del Dictamen</span>
                    <p className="text-sm font-bold text-emerald-700 mt-0.5 capitalize flex items-center gap-1.5">
                      <i className="fas fa-shield-halved text-emerald-600"></i>
                      {analysis.status || 'Completado'}
                    </p>
                  </div>
                </div>

                {/* Partes Afectadas */}
                {affectedParts.length > 0 && (
                  <div>
                    <h4 className="text-xs font-bold uppercase text-gray-500 mb-2 flex items-center gap-1.5">
                      <i className="fas fa-wrench text-primary"></i> Partes y Componentes Afectados
                    </h4>
                    <div className="flex flex-wrap gap-2">
                      {affectedParts.map((part, idx) => (
                        <span
                          key={idx}
                          className="px-3 py-1 bg-red-50 text-red-700 border border-red-200/80 rounded-lg text-xs font-semibold flex items-center gap-1.5"
                        >
                          <i className="fas fa-triangle-exclamation text-[10px] text-red-500"></i>
                          {part}
                        </span>
                      ))}
                    </div>
                  </div>
                )}

                {/* Repuestos Necesarios */}
                {partsNeeded.length > 0 && (
                  <div>
                    <h4 className="text-xs font-bold uppercase text-gray-500 mb-2 flex items-center gap-1.5">
                      <i className="fas fa-boxes-stacked text-primary"></i> Repuestos Requeridos para Sustitución
                    </h4>
                    <ul className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-xs">
                      {partsNeeded.map((part, idx) => (
                        <li key={idx} className="p-2.5 bg-slate-50 border border-gray-200 rounded-xl flex items-center gap-2 font-medium text-gray-700">
                          <i className="fas fa-check text-emerald-600 text-[10px]"></i>
                          <span>{part}</span>
                        </li>
                      ))}
                    </ul>
                  </div>
                )}

                {/* Acciones Recomendadas */}
                {recommendedActions.length > 0 && (
                  <div>
                    <h4 className="text-xs font-bold uppercase text-gray-500 mb-2 flex items-center gap-1.5">
                      <i className="fas fa-list-check text-primary"></i> Plan de Trabajo y Acciones Recomendadas
                    </h4>
                    <div className="space-y-1.5 text-xs text-gray-700">
                      {recommendedActions.map((action, idx) => (
                        <div key={idx} className="p-2.5 bg-blue-50/50 border border-blue-100 rounded-xl flex items-start gap-2.5">
                          <span className="w-5 h-5 rounded-full bg-primary text-white text-[10px] font-bold flex items-center justify-center shrink-0 mt-0.5">
                            {idx + 1}
                          </span>
                          <span className="font-medium text-gray-800">{action}</span>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {/* Observaciones del Perito IA */}
                {analysis.observations && (
                  <div className="p-4 bg-purple-50/50 rounded-2xl border border-purple-150">
                    <h4 className="text-xs font-bold uppercase text-purple-900 mb-1 flex items-center gap-1.5">
                      <i className="fas fa-comment-dots text-purple-600"></i> Diagnóstico y Conclusiones del Perito IA
                    </h4>
                    <p className="text-xs md:text-sm text-gray-700 leading-relaxed font-normal whitespace-pre-line">
                      {analysis.observations}
                    </p>
                  </div>
                )}
              </div>
            ) : (
              <div className="py-8 text-center bg-gray-50 rounded-2xl border border-dashed border-gray-200">
                <i className="fas fa-robot text-4xl text-purple-300 mb-2"></i>
                <h4 className="font-bold text-secondary text-sm">Este peritaje aún no tiene informe de IA generado</h4>
                <p className="text-xs text-gray-500 max-w-md mx-auto mt-1 mb-4">
                  Sube una foto o video del vehículo para que Gemini AI examine los daños y genere el diagnóstico técnico.
                </p>
                {onRunAiAnalysis && (
                  <button
                    onClick={() => onRunAiAnalysis(peritaje)}
                    className="px-4 py-2 bg-purple-600 hover:bg-purple-700 text-white rounded-xl font-bold text-xs shadow-soft transition inline-flex items-center gap-1.5"
                  >
                    <i className="fas fa-wand-magic-sparkles"></i>
                    <span>Ejecutar Análisis con IA Ahora</span>
                  </button>
                )}
              </div>
            )}
          </div>

          {/* Información Adicional y Observaciones Generales del Taller */}
          {peritaje.observations && (
            <div className="p-4 bg-gray-50 rounded-2xl border border-gray-200">
              <span className="text-[11px] font-bold uppercase text-gray-400 block mb-1">
                <i className="fas fa-clipboard text-primary mr-1"></i> Observaciones Generales de Recepción
              </span>
              <p className="text-xs text-gray-700">{peritaje.observations}</p>
            </div>
          )}

          {/* Firmas y Cierre Técnico del Peritaje */}
          <div className="pt-8 border-t-2 border-gray-200 grid grid-cols-2 gap-8 text-center text-xs">
            <div>
              <div className="border-b border-gray-300 pb-8 mb-2">
                <p className="font-bold text-secondary text-sm">
                  {inspector ? `${inspector.first_name || ''} ${inspector.last_name || ''}`.trim() : 'Técnico Perito'}
                </p>
                <p className="text-[11px] text-gray-500 font-medium">
                  {inspector?.position || 'Inspector Técnico Automotriz'}
                </p>
              </div>
              <p className="text-[10px] text-gray-400 uppercase font-bold tracking-wider">Firma del Inspector / Perito</p>
            </div>
            <div>
              <div className="border-b border-gray-300 pb-8 mb-2">
                <p className="font-bold text-secondary text-sm">
                  {client ? (client.client_name || client.name) : 'Propietario / Representante'}
                </p>
                <p className="text-[11px] text-gray-500 font-medium">
                  {client?.tax_id ? `C.I. / RIF: ${client.tax_id}` : 'Conforme recepción'}
                </p>
              </div>
              <p className="text-[10px] text-gray-400 uppercase font-bold tracking-wider">Firma de Conformidad del Cliente</p>
            </div>
          </div>

          {/* Pie de página con sello digital */}
          <div className="text-center pt-4 pb-2 border-t border-gray-100 text-[10px] text-gray-400">
            Documento de diagnóstico asistido por IA generativa • Taller Integral 360 Garage • {new Date().getFullYear()}
          </div>

        </div>

        {/* Footer Modal con Botones */}
        <div className="p-4 bg-gray-50 border-t border-gray-150 flex items-center justify-between shrink-0 print:hidden">
          <span className="text-xs text-gray-500 flex items-center gap-1.5 font-medium">
            <i className="fas fa-shield-halved text-purple-600"></i>
            Validez técnica respaldada por IA Gemini
          </span>
          <div className="flex gap-2.5">
            <button
              onClick={handlePrint}
              className="px-4 py-2 bg-gradient-to-r from-primary to-blue-600 hover:from-primary-dark hover:to-blue-700 text-white font-bold text-xs rounded-xl shadow-soft transition flex items-center gap-1.5"
            >
              <i className="fas fa-print"></i>
              <span>Imprimir / Exportar PDF</span>
            </button>
            <button
              onClick={onClose}
              className="px-4 py-2 border border-gray-200 hover:bg-gray-100 text-gray-700 font-bold text-xs rounded-xl transition"
            >
              Cerrar
            </button>
          </div>
        </div>

      </div>
    </div>
  );
}
