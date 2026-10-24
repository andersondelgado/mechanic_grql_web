import React, { useMemo, useState, useEffect } from "react";
import { resolveVehicleId, resolveClientId, findClientForVehicle } from "../../utils/entityHelpers";
import { useGrqlList } from "../../hooks/use-grql";
import { downloadInspectionReportPdf } from "../../utils/pdfGenerator";
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
  const [downloading, setDownloading] = useState(false);

  // Cuando el modal está abierto, agregar clase para ocultar todo el fondo de la app al imprimir
  useEffect(() => {
    if (isOpen) {
      document.body.classList.add('has-printable-sheet');
    }
    return () => {
      document.body.classList.remove('has-printable-sheet');
    };
  }, [isOpen]);

  // Carga de entidades para enriquecer el informe si no vienen embebidas
  const { data: vehiculosList } = useGrqlList<any[]>("GestionTallerProd_vehicles", { pagination: { page: 1, size: 500 } });
  const { data: clientesList } = useGrqlList<any[]>("GestionTallerProd_clients", { pagination: { page: 1, size: 500 } });
  const { data: analysisList } = useGrqlList<any[]>("GestionTallerProd_inspection_analysis", { pagination: { page: 1, size: 500 } });
  const { data: employeesList } = useGrqlList<any[]>("GestionTallerProd_employees", { pagination: { page: 1, size: 200 } });

  // 1. Resolver el análisis IA
  const analysis: InspectionAnalysis | null = useMemo(() => {
    if (!peritaje) return null;
    if (Array.isArray(peritaje.inspection_analysis) && peritaje.inspection_analysis.length > 0) {
      return peritaje.inspection_analysis[0];
    }
    if (peritaje.analysis && typeof peritaje.analysis === 'object') {
      return peritaje.analysis;
    }
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
    if (Array.isArray(peritaje.clients) && peritaje.clients.length > 0) {
      return peritaje.clients[0];
    }
    if (peritaje.client && typeof peritaje.client === 'object') {
      return peritaje.client;
    }

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
  const licensePlate = vehicle?.license_plate || vehicle?.plate || peritaje.license_plate || 'SIN PLACA';
  const peritajeDate = peritaje.inspection_date
    ? new Date(peritaje.inspection_date).toLocaleDateString('es-ES', {
        year: 'numeric',
        month: 'long',
        day: 'numeric'
      })
    : new Date().toLocaleDateString('es-ES');

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

  // Manejo de Descarga de PDF directa
  const handleDownloadPdf = async () => {
    try {
      setDownloading(true);
      await downloadInspectionReportPdf({
        peritaje,
        vehicle,
        client,
        analysis,
        inspector
      });
    } catch (err) {
      console.error('Error al generar PDF de peritaje:', err);
      alert('Hubo un inconveniente al generar el archivo PDF directo. Utilice la opción "Imprimir en Papel" para guardar como PDF.');
    } finally {
      setDownloading(false);
    }
  };

  const handlePrint = () => {
    window.print();
  };

  return (
    <div className="printable-modal-overlay fixed inset-0 bg-black/75 backdrop-blur-sm z-[100] flex flex-col items-center justify-start p-2 sm:p-6 overflow-y-auto print:static print:p-0 print:m-0 print:bg-white print:overflow-visible print:h-auto print:block print:inset-auto">
      
      {/* Barra de herramientas superior flotante (Oculta al imprimir gracias a .no-print) */}
      <div className="no-print w-full max-w-4xl bg-slate-900 text-white p-4 rounded-2xl flex flex-col sm:flex-row items-stretch sm:items-center justify-between shadow-xl mb-4 sticky top-2 z-50 gap-3">
        <div className="flex items-center gap-3">
          <div className="p-2.5 bg-purple-600 text-white rounded-xl shadow-soft">
            <i className="fas fa-file-invoice text-xl"></i>
          </div>
          <div>
            <h3 className="font-bold text-base leading-tight">Informe Oficial de Peritaje IA</h3>
            <p className="text-xs text-slate-400">N° {peritajeCode} • Placa: {licensePlate}</p>
          </div>
        </div>

        <div className="flex flex-wrap items-center gap-2.5">
          <button
            type="button"
            onClick={handleDownloadPdf}
            disabled={downloading}
            className="px-4 py-2 bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-700 hover:to-teal-700 text-white rounded-xl hover:shadow-lg font-bold text-xs sm:text-sm flex items-center gap-2 transition active:scale-95 disabled:opacity-50"
            title="Descargar archivo PDF directamente a su equipo"
          >
            {downloading ? (
              <>
                <i className="fas fa-spinner fa-spin"></i> Generando PDF...
              </>
            ) : (
              <>
                <i className="fas fa-file-download"></i> Descargar PDF (.pdf)
              </>
            )}
          </button>
          <button
            type="button"
            onClick={handlePrint}
            className="px-4 py-2 bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 text-white rounded-xl hover:shadow-lg font-bold text-xs sm:text-sm flex items-center gap-2 transition active:scale-95"
            title="Imprimir documento en papel o vista de impresión"
          >
            <i className="fas fa-print"></i> Imprimir en Papel
          </button>
          <button
            type="button"
            onClick={onClose}
            className="p-2 bg-slate-800 hover:bg-slate-700 text-slate-300 hover:text-white rounded-xl transition"
            title="Cerrar informe"
          >
            <i className="fas fa-times text-lg"></i>
          </button>
        </div>
      </div>

      {/* Contenedor del Documento Imprimible Oficial */}
      <div className="printable-document bg-white w-full max-w-[820px] shadow-2xl rounded-xl border border-gray-300 text-slate-900 font-sans p-6 sm:p-8 space-y-6 print:m-0 print:p-0 print:shadow-none print:border-none print:w-full print:max-w-none print:space-y-0">
        
        <div className="page-sheet page-sheet-1 space-y-4 print:space-y-3">
          
          {/* Header Banner Oficial */}
          <div className="border-b-2 border-slate-900 pb-3 flex items-start justify-between">
            <div className="flex items-center gap-4">
              <div className="w-14 h-14 bg-slate-900 text-white rounded-xl flex items-center justify-center text-2xl font-black shrink-0">
                360°
              </div>
              <div>
                <h1 className="text-xl font-black tracking-tight text-slate-900">
                  TALLER INTEGRALE$ 360 GARAGE C.A.
                </h1>
                <p className="text-xs text-slate-600 font-medium uppercase tracking-wider">
                  Mecánica General • Latonería y Pintura • Peritaje Computarizado
                </p>
                <p className="text-[11px] text-slate-500">
                  RIF: J-50123456-7 • Telf: (0212) 555-0360 • Caracas, Venezuela
                </p>
              </div>
            </div>
            <div className="text-right">
              <span className="inline-block px-3 py-1 bg-slate-900 text-amber-400 font-mono font-bold text-xs rounded-lg">
                DICTAMEN N° {peritajeCode}
              </span>
              <p className="text-xs text-slate-600 mt-1 font-medium">
                Fecha: <span className="font-bold text-slate-900">{peritajeDate}</span>
              </p>
              <p className="text-xs text-slate-600 font-medium">
                Tipo: <span className="font-bold text-slate-900 capitalize">{peritaje.inspection_type || 'Revisión General'}</span>
              </p>
            </div>
          </div>

          {/* Franja de Título de Documento */}
          <div className="bg-slate-100 border border-slate-200 py-1.5 px-4 rounded-lg text-center">
            <h2 className="text-xs sm:text-sm font-black text-slate-800 tracking-wider uppercase">
              FICHA DE CONTROL, INSPECCIÓN Y EVALUACIÓN PERICIAL CON IA GEMINI
            </h2>
          </div>

          {/* Cajas Lado a Lado: Cliente y Vehículo */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            
            {/* Caja 1: Datos del Propietario / Cliente */}
            <div className="border border-slate-300 rounded-xl p-4 bg-slate-50/50">
              <div className="text-xs font-black text-slate-700 uppercase tracking-wider mb-2 pb-1.5 border-b border-slate-200 flex items-center gap-1.5">
                <i className="fas fa-user-circle text-primary"></i>
                <span>DATOS DEL PROPIETARIO / CLIENTE</span>
              </div>
              <div className="space-y-1.5 text-xs text-slate-700">
                <p><span className="font-bold text-slate-900">Nombre/Razón:</span> {client?.client_name || client?.name || 'No especificado'}</p>
                <p><span className="font-bold text-slate-900">C.I. / RIF:</span> {client?.tax_id || '-'}</p>
                <p><span className="font-bold text-slate-900">Teléfono:</span> {client?.phone || '-'}</p>
                <p className="truncate"><span className="font-bold text-slate-900">Email:</span> {client?.email || '-'}</p>
                <p className="text-[11px]"><span className="font-bold text-slate-900">Dirección:</span> {client?.address || '-'}</p>
              </div>
            </div>

            {/* Caja 2: Datos del Vehículo */}
            <div className="border border-slate-300 rounded-xl p-4 bg-slate-50/50">
              <div className="text-xs font-black text-slate-700 uppercase tracking-wider mb-2 pb-1.5 border-b border-slate-200 flex items-center justify-between">
                <span className="flex items-center gap-1.5">
                  <i className="fas fa-car-side text-primary"></i>
                  <span>DATOS DEL VEHÍCULO</span>
                </span>
                <span className="px-2.5 py-0.5 bg-amber-400 text-slate-950 font-mono font-black text-xs rounded border border-amber-500 tracking-wider">
                  {licensePlate}
                </span>
              </div>
              <div className="space-y-1.5 text-xs text-slate-700">
                <p><span className="font-bold text-slate-900">Marca / Modelo:</span> {vehicle ? `${vehicle.brand || ''} ${vehicle.model || ''}` : 'No especificado'}</p>
                <div className="grid grid-cols-2 gap-2">
                  <p><span className="font-bold text-slate-900">Año:</span> {vehicle?.year || '-'}</p>
                  <p><span className="font-bold text-slate-900">Color:</span> {vehicle?.color || '-'}</p>
                </div>
                <p><span className="font-bold text-slate-900">Kilometraje:</span> {peritaje.mileage || vehicle?.mileage || '-'} km</p>
                <p className="truncate text-[11px]"><span className="font-bold text-slate-900">VIN / Chasis:</span> {vehicle?.vin || 'No registrado'}</p>
              </div>
            </div>

          </div>

          {/* Sección Dictamen Pericial con IA Gemini */}
          <div className="border-2 border-purple-200 rounded-xl p-4 bg-purple-50/30 space-y-3.5">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between pb-2 border-b border-purple-200 gap-2">
              <div className="flex items-center gap-2">
                <span className="w-7 h-7 bg-purple-600 text-white rounded-lg flex items-center justify-center text-sm shadow-soft">
                  <i className="fas fa-brain"></i>
                </span>
                <div>
                  <h3 className="text-xs sm:text-sm font-black text-purple-950 uppercase tracking-wide">
                    EVALUACIÓN PERICIAL CON IA GEMINI MULTIMODAL
                  </h3>
                  <p className="text-[10px] text-purple-800">Inspección de daños en carrocería, pintura y componentes</p>
                </div>
              </div>
              {analysis && (
                <div className="flex items-center gap-2 self-start sm:self-auto">
                  <span className={`px-2.5 py-0.5 rounded-full text-xs font-bold uppercase ${sevStyle.badge}`}>
                    {sevStyle.label}
                  </span>
                  {analysis.confidence_score !== undefined && (
                    <span className="px-2 py-0.5 bg-purple-200 text-purple-900 rounded-full text-xs font-bold">
                      {analysis.confidence_score}% Certeza
                    </span>
                  )}
                </div>
              )}
            </div>

            {analysis ? (
              <div className="space-y-3 text-xs">
                
                {/* Cuadro de métricas */}
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-2 text-xs">
                  <div className="p-2.5 bg-white rounded-lg border border-purple-100">
                    <span className="text-[10px] font-bold text-slate-400 uppercase block">Tipo de Daño</span>
                    <p className="font-bold text-slate-800 capitalize mt-0.5">
                      {String(analysis.damage_type || 'Revisión General').replace(/_/g, ' ')}
                    </p>
                  </div>
                  <div className="p-2.5 bg-white rounded-lg border border-purple-100">
                    <span className="text-[10px] font-bold text-slate-400 uppercase block">Mano de Obra Estimada</span>
                    <p className="font-bold text-slate-800 mt-0.5 flex items-center gap-1.5">
                      <i className="fas fa-clock text-amber-500"></i>
                      {analysis.repair_estimated_hours || 0} Horas de taller
                    </p>
                  </div>
                  <div className="p-2.5 bg-white rounded-lg border border-purple-100">
                    <span className="text-[10px] font-bold text-slate-400 uppercase block">Estado Dictamen</span>
                    <p className="font-bold text-emerald-700 mt-0.5 capitalize flex items-center gap-1">
                      <i className="fas fa-shield-halved text-emerald-600"></i>
                      {analysis.status || 'Completado'}
                    </p>
                  </div>
                </div>

                {/* Partes Afectadas */}
                {affectedParts.length > 0 && (
                  <div>
                    <span className="text-[10px] font-bold text-slate-500 uppercase block mb-1">
                      Partes y Componentes Afectados:
                    </span>
                    <div className="flex flex-wrap gap-1.5">
                      {affectedParts.map((part, idx) => (
                        <span key={idx} className="px-2 py-0.5 bg-red-100 text-red-800 border border-red-200 rounded font-semibold text-[11px]">
                          • {part}
                        </span>
                      ))}
                    </div>
                  </div>
                )}

                {/* Repuestos Necesarios */}
                {partsNeeded.length > 0 && (
                  <div>
                    <span className="text-[10px] font-bold text-slate-500 uppercase block mb-1">
                      Repuestos Sugeridos para Sustitución:
                    </span>
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-1.5">
                      {partsNeeded.map((part, idx) => (
                        <div key={idx} className="p-1.5 bg-white border border-slate-200 rounded text-slate-700 font-medium text-[11px] flex items-center gap-1.5">
                          <i className="fas fa-check text-emerald-600 text-[9px]"></i>
                          <span>{part}</span>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {/* Acciones Recomendadas */}
                {recommendedActions.length > 0 && (
                  <div>
                    <span className="text-[10px] font-bold text-slate-500 uppercase block mb-1">
                      Plan de Trabajo Recomendado:
                    </span>
                    <div className="space-y-1">
                      {recommendedActions.map((act, idx) => (
                        <div key={idx} className="p-1.5 bg-blue-50/50 border border-blue-100 rounded text-slate-800 text-[11px] flex items-start gap-1.5">
                          <span className="font-bold text-primary">{idx + 1}.</span>
                          <span>{act}</span>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {/* Observaciones de la IA */}
                {analysis.observations && (
                  <div className="p-3 bg-white rounded-lg border border-purple-200 text-slate-800">
                    <span className="text-[10px] font-bold text-purple-900 uppercase block mb-1">
                      Diagnóstico Técnico y Conclusiones del Perito IA:
                    </span>
                    <p className="text-xs leading-relaxed whitespace-pre-line text-slate-700">
                      {analysis.observations}
                    </p>
                  </div>
                )}

              </div>
            ) : (
              <div className="py-6 text-center bg-white rounded-lg border border-dashed border-slate-300">
                <i className="fas fa-robot text-3xl text-purple-300 mb-2"></i>
                <h4 className="font-bold text-slate-700 text-xs">Sin dictamen IA procesado para este peritaje</h4>
                <p className="text-[11px] text-slate-500 max-w-sm mx-auto mt-0.5 mb-3">
                  Cargue un video o imagen en el peritaje para que Gemini examine los daños automáticamente.
                </p>
                {onRunAiAnalysis && (
                  <button
                    onClick={() => onRunAiAnalysis(peritaje)}
                    className="no-print px-3.5 py-1.5 bg-purple-600 text-white rounded-lg font-bold text-xs shadow-soft transition inline-flex items-center gap-1.5 hover:bg-purple-700"
                  >
                    <i className="fas fa-wand-magic-sparkles"></i>
                    <span>Ejecutar Análisis IA</span>
                  </button>
                )}
              </div>
            )}

          </div>

          {/* Observaciones generales de recepción */}
          {peritaje.observations && (
            <div className="border border-slate-300 rounded-xl p-3 bg-slate-50/30">
              <span className="text-[10px] font-bold uppercase text-slate-500 block mb-0.5">
                Observaciones Generales de Recepción:
              </span>
              <p className="text-xs text-slate-700 leading-normal">{peritaje.observations}</p>
            </div>
          )}

          {/* Firmas y Conformidad Técnica */}
          <div className="pt-6 border-t-2 border-slate-900 grid grid-cols-2 gap-8 text-center text-xs">
            <div>
              <div className="border-b border-slate-400 pb-8 mb-1.5">
                <p className="font-bold text-slate-900 text-xs">
                  {inspector ? `${inspector.first_name || ''} ${inspector.last_name || ''}`.trim() : 'Técnico Perito Especialista'}
                </p>
                <p className="text-[10px] text-slate-500">
                  {inspector?.position || 'Inspector Técnico Automotriz'}
                </p>
              </div>
              <p className="text-[10px] text-slate-500 uppercase font-black tracking-wider">Firma del Inspector / Perito</p>
            </div>
            <div>
              <div className="border-b border-slate-400 pb-8 mb-1.5">
                <p className="font-bold text-slate-900 text-xs">
                  {client ? (client.client_name || client.name) : 'Propietario / Cliente'}
                </p>
                <p className="text-[10px] text-slate-500">
                  {client?.tax_id ? `C.I. / RIF: ${client.tax_id}` : 'Conforme recepción'}
                </p>
              </div>
              <p className="text-[10px] text-slate-500 uppercase font-black tracking-wider">Firma de Conformidad del Cliente</p>
            </div>
          </div>

          {/* Pie de página oficial */}
          <div className="text-center pt-3 pb-1 border-t border-slate-200 text-[10px] text-slate-400">
            Documento de diagnóstico asistido por IA generativa • Taller Integrale$ 360 Garage C.A. • {new Date().getFullYear()}
          </div>

        </div>

      </div>

    </div>
  );
}
