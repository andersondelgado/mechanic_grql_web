import React from 'react';
import type { VehicleReceipt, ChecklistItem, DamagePoint } from '../../types/entities';
import { downloadReceiptPdf } from '../../utils/pdfGenerator';

interface PrintableReceiptSheetProps {
  receipt: VehicleReceipt;
  onClose: () => void;
}

export const PrintableReceiptSheet: React.FC<PrintableReceiptSheetProps> = ({ receipt, onClose }) => {
  const [downloading, setDownloading] = React.useState(false);

  React.useEffect(() => {
    document.body.classList.add('has-printable-sheet');
    return () => {
      document.body.classList.remove('has-printable-sheet');
    };
  }, []);

  const handlePrint = () => {
    window.print();
  };

  const handleDownload = async () => {
    try {
      setDownloading(true);
      await downloadReceiptPdf(receipt);
    } catch (err) {
      console.error('Error al generar PDF:', err);
      alert('Error al generar el archivo PDF. Utilice la opción de Imprimir.');
    } finally {
      setDownloading(false);
    }
  };

  const externalList: ChecklistItem[] = Array.isArray(receipt.checklist_external)
    ? receipt.checklist_external
    : [];
  const internalList: ChecklistItem[] = Array.isArray(receipt.checklist_internal)
    ? receipt.checklist_internal
    : [];
  const damagePoints: DamagePoint[] = Array.isArray(receipt.damage_points)
    ? receipt.damage_points
    : [];

  const fuel = receipt.fuel_level || '1/2';
  const receiptNum = receipt.receipt_number || `REC-${String(receipt.id || '0000').substring(0, 6).toUpperCase()}`;

  return (
    <div className="printable-modal-overlay fixed inset-0 bg-black/75 backdrop-blur-sm z-[100] flex flex-col items-center justify-start p-2 sm:p-6 overflow-y-auto print:static print:p-0 print:m-0 print:bg-white print:overflow-visible print:h-auto print:block print:inset-auto">
      {/* Floating Toolbar (Hidden when printing) */}
      <div className="no-print w-full max-w-4xl bg-slate-900 text-white p-4 rounded-2xl flex flex-col sm:flex-row items-stretch sm:items-center justify-between shadow-xl mb-4 sticky top-2 z-50 gap-3">
        <div className="flex items-center gap-3">
          <div className="p-2 bg-blue-600 rounded-xl">
            <i className="fas fa-file-invoice text-xl"></i>
          </div>
          <div>
            <h3 className="font-bold text-base leading-tight">Ficha Oficial de Recepción</h3>
            <p className="text-xs text-slate-400">N° {receiptNum} • {receipt.license_plate}</p>
          </div>
        </div>
        <div className="flex flex-wrap items-center gap-2.5">
          <button
            type="button"
            onClick={handleDownload}
            disabled={downloading}
            className="px-4 py-2 bg-gradient-to-r from-emerald-600 to-teal-600 text-white rounded-xl hover:shadow-lg font-bold text-xs sm:text-sm flex items-center gap-2 transition"
          >
            {downloading ? (
              <>
                <i className="fas fa-spinner fa-spin"></i> Generando...
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
            className="px-4 py-2 bg-gradient-to-r from-blue-600 to-indigo-600 text-white rounded-xl hover:shadow-lg font-bold text-xs sm:text-sm flex items-center gap-2 transition"
          >
            <i className="fas fa-print"></i> Imprimir en Papel
          </button>
          <button
            type="button"
            onClick={onClose}
            className="p-2 bg-slate-800 hover:bg-slate-700 text-slate-300 rounded-xl transition"
            title="Cerrar vista previa"
          >
            <i className="fas fa-times"></i>
          </button>
        </div>
      </div>

      {/* Printable Sheet Container */}
      <div className="printable-document bg-white w-full max-w-[820px] shadow-2xl rounded-xl border border-gray-300 text-slate-900 font-sans p-6 sm:p-8 space-y-6 print:m-0 print:p-0 print:shadow-none print:border-none print:w-full print:max-w-none print:space-y-0">
        
        {/* ================= PAGE 1 ================= */}
        <div className="page-sheet page-sheet-1 space-y-4 print:space-y-2.5">
          
          {/* Header Banner */}
          <div className="border-b-2 border-slate-900 pb-3 flex items-start justify-between">
            <div className="flex items-center gap-4">
              <div className="w-14 h-14 bg-slate-900 text-white rounded-xl flex items-center justify-center text-2xl font-black">
                360°
              </div>
              <div>
                <h1 className="text-xl font-black tracking-tight text-slate-900">
                  TALLER INTEGRALE$ 360 GARAGE C.A.
                </h1>
                <p className="text-xs text-slate-600 font-medium uppercase tracking-wider">
                  Mecánica General • Latonería y Pintura • Diagnóstico Computarizado
                </p>
                <p className="text-[11px] text-slate-500">
                  RIF: J-50123456-7 • Telf: (0212) 555-0360 • Caracas, Venezuela
                </p>
              </div>
            </div>
            <div className="text-right">
              <span className="inline-block px-3 py-1 bg-slate-100 border border-slate-300 rounded-md text-xs font-mono font-bold text-slate-800">
                N° {receiptNum}
              </span>
              <p className="text-[11px] text-slate-500 mt-1">
                Fecha Entrada: <strong className="text-slate-800">{receipt.entry_date || '-'}</strong>
              </p>
              {receipt.exit_date && (
                <p className="text-[11px] text-slate-500">
                  Fecha Est. Salida: <strong className="text-slate-800">{receipt.exit_date}</strong>
                </p>
              )}
            </div>
          </div>

          <div className="text-center py-1 bg-slate-100 border border-slate-300 rounded font-bold text-xs uppercase tracking-widest text-slate-800">
            Ficha de Control e Inspección de Recepción de Vehículo
          </div>

          {/* Section 1: Client and Vehicle Grid */}
          <div className="grid grid-cols-2 gap-3 text-xs">
            {/* Box 1: Owner */}
            <div className="border border-slate-300 rounded p-2.5 bg-slate-50/50">
              <h4 className="font-bold text-slate-800 border-b border-slate-200 pb-1 mb-1.5 uppercase text-[10px] tracking-wide">
                Datos del Propietario / Cliente
              </h4>
              <table className="w-full text-[11px] leading-tight">
                <tbody>
                  <tr>
                    <td className="font-semibold text-slate-600 w-24 py-0.5">Nombre/Razón:</td>
                    <td className="font-bold text-slate-900">{receipt.owner_name || '-'}</td>
                  </tr>
                  <tr>
                    <td className="font-semibold text-slate-600 py-0.5">C.I. / RIF:</td>
                    <td className="text-slate-800">{receipt.owner_tax_id || '-'}</td>
                  </tr>
                  <tr>
                    <td className="font-semibold text-slate-600 py-0.5">Teléfono:</td>
                    <td className="text-slate-800">{receipt.phone || '-'}</td>
                  </tr>
                  <tr>
                    <td className="font-semibold text-slate-600 py-0.5">Dirección:</td>
                    <td className="text-slate-800">{receipt.address || '-'}</td>
                  </tr>
                </tbody>
              </table>
            </div>

            {/* Box 2: Vehicle */}
            <div className="border border-slate-300 rounded p-2.5 bg-slate-50/50">
              <h4 className="font-bold text-slate-800 border-b border-slate-200 pb-1 mb-1.5 uppercase text-[10px] tracking-wide">
                Datos del Vehículo
              </h4>
              <table className="w-full text-[11px] leading-tight">
                <tbody>
                  <tr>
                    <td className="font-semibold text-slate-600 w-24 py-0.5">Placa:</td>
                    <td className="font-black font-mono text-slate-900 text-xs bg-yellow-100 px-1 rounded inline-block">
                      {receipt.license_plate || '-'}
                    </td>
                  </tr>
                  <tr>
                    <td className="font-semibold text-slate-600 py-0.5">Marca / Modelo:</td>
                    <td className="font-bold text-slate-800">{receipt.brand || ''} {receipt.model || ''}</td>
                  </tr>
                  <tr>
                    <td className="font-semibold text-slate-600 py-0.5">Color:</td>
                    <td className="text-slate-800">{receipt.color || '-'}</td>
                  </tr>
                  <tr>
                    <td className="font-semibold text-slate-600 py-0.5">Kilometraje:</td>
                    <td className="font-bold text-slate-900">{receipt.mileage ? `${receipt.mileage} km` : '-'}</td>
                  </tr>
                </tbody>
              </table>
            </div>
          </div>

          {/* Section 2: Custody & Personnel */}
          <div className="border border-slate-300 rounded p-2.5 text-xs bg-white">
            <h4 className="font-bold text-slate-800 border-b border-slate-200 pb-1 mb-1.5 uppercase text-[10px] tracking-wide">
              Custodia y Personal Responsable
            </h4>
            <div className="grid grid-cols-3 gap-2 text-[11px]">
              <div>
                <span className="font-semibold text-slate-600">Recibido por:</span>{' '}
                <span className="font-bold text-slate-900">{receipt.received_by || receipt.receiving_technician || '-'}</span>
              </div>
              <div>
                <span className="font-semibold text-slate-600">Entregado por:</span>{' '}
                <span className="font-bold text-slate-900">{receipt.delivered_by || receipt.owner_name || '-'}</span>
              </div>
              <div>
                <span className="font-semibold text-slate-600">Técnico Asignado:</span>{' '}
                <span className="font-bold text-slate-900">{receipt.assigned_technician || '-'}</span>
              </div>
            </div>
          </div>

          {/* Section 3: Fuel Level & Reason for visit */}
          <div className="grid grid-cols-3 gap-3 text-xs">
            {/* Fuel gauge visual representation */}
            <div className="border border-slate-300 rounded p-2.5 bg-slate-50 flex flex-col justify-between">
              <h4 className="font-bold text-slate-800 mb-1 uppercase text-[10px]">Nivel de Combustible</h4>
              <div className="py-2 text-center">
                <div className="inline-flex items-center gap-2 border border-slate-300 bg-white px-3 py-1.5 rounded-md font-mono font-bold text-xs text-blue-700">
                  <i className="fas fa-gas-pump"></i> {fuel}
                </div>
                {/* Visual bar */}
                <div className="w-full bg-gray-200 h-3 rounded-full mt-2 overflow-hidden border border-gray-300">
                  <div
                    className={`h-full ${
                      fuel === 'Reserva' ? 'bg-red-500 w-[10%]' :
                      fuel === '1/4' ? 'bg-amber-500 w-[25%]' :
                      fuel === '1/2' ? 'bg-emerald-500 w-[50%]' :
                      fuel === '3/4' ? 'bg-emerald-600 w-[75%]' : 'bg-blue-600 w-full'
                    }`}
                  ></div>
                </div>
                <div className="flex justify-between text-[9px] text-gray-500 mt-1 font-bold">
                  <span>E (Reserva)</span>
                  <span>1/4</span>
                  <span>1/2</span>
                  <span>3/4</span>
                  <span>F (Lleno)</span>
                </div>
              </div>
            </div>

            {/* Motivo de Entrada */}
            <div className="col-span-2 border border-slate-300 rounded p-2.5 bg-slate-50 flex flex-col">
              <h4 className="font-bold text-slate-800 mb-1 uppercase text-[10px]">
                Motivo de Ingreso / Fallas Reportadas
              </h4>
              <p className="text-[11px] text-slate-800 flex-1 whitespace-pre-line leading-relaxed">
                {receipt.reason_for_entry || receipt.observations || 'Ingreso regular a taller para revisión.'}
              </p>
            </div>
          </div>

          {/* Section 4: Visual Damage Diagram & Notes */}
          <div className="border border-slate-300 rounded p-2.5">
            <div className="flex items-center justify-between border-b border-slate-200 pb-1 mb-2">
              <h4 className="font-bold text-slate-800 uppercase text-[10px] tracking-wide">
                Diagrama de Estado de Carrocería y Daños ({damagePoints.length} marcas)
              </h4>
              <div className="flex gap-2 text-[10px]">
                <span className="font-bold text-amber-600">R: Rayón</span>
                <span className="font-bold text-red-600">G: Golpe</span>
                <span className="font-bold text-purple-600">Q: Quebrado</span>
                <span className="font-bold text-blue-600">F: Falta</span>
              </div>
            </div>

            {damagePoints.length > 0 ? (
              <div className="grid grid-cols-2 gap-2 text-[10px]">
                {damagePoints.map((pt, idx) => (
                  <div key={pt.id || idx} className="border border-slate-200 rounded p-1.5 bg-slate-50 flex items-center gap-2">
                    <span className={`w-4 h-4 rounded text-white font-black flex items-center justify-center ${
                      pt.type === 'scratch' ? 'bg-amber-500' :
                      pt.type === 'dent' ? 'bg-red-500' :
                      pt.type === 'broken' ? 'bg-purple-500' : 'bg-blue-500'
                    }`}>
                      {pt.type === 'scratch' ? 'R' : pt.type === 'dent' ? 'G' : pt.type === 'broken' ? 'Q' : 'F'}
                    </span>
                    <span className="font-bold text-slate-700 capitalize">Vista {pt.view}:</span>
                    <span className="text-slate-600 truncate">{pt.notes || 'Detalle no especificado'}</span>
                  </div>
                ))}
              </div>
            ) : (
              <p className="text-center text-[11px] text-slate-500 py-3 italic">
                No se registraron daños visuales. El vehículo se recibe con carrocería en buen estado general.
              </p>
            )}
          </div>

          <div className="text-[10px] text-slate-400 text-right">
            Página 1 de 2 • Taller Integrale$ 360 Garage C.A.
          </div>
        </div>

        {/* ================= PAGE 2 ================= */}
        <div className="page-sheet page-sheet-2 space-y-4 pt-4 border-t-2 border-slate-300 print:space-y-2.5 print:pt-0 print:border-none">
          
          <div className="text-center py-1 bg-slate-100 border border-slate-300 rounded font-bold text-xs uppercase tracking-widest text-slate-800">
            Inventario de Componentes y Estado Físico (77 Puntos)
          </div>

          {/* Checklist 2 Columns (Externa e Interna) */}
          <div className="grid grid-cols-2 gap-3 text-[10px]">
            {/* Revisión Externa */}
            <div className="border border-slate-300 rounded p-2">
              <h5 className="font-bold text-slate-800 border-b border-slate-200 pb-1 mb-1.5 uppercase tracking-wide">
                Revisión Externa (Carrocería / Cristales / Luces / Ruedas)
              </h5>
              <div className="space-y-1 max-h-[360px] overflow-y-auto pr-1 print:max-h-none print:overflow-visible print:pr-0">
                {externalList.length > 0 ? (
                  externalList.map((item, idx) => (
                    <div key={item.id || idx} className="flex items-center justify-between border-b border-slate-100 py-0.5">
                      <span className="text-slate-800 truncate">{item.name}</span>
                      <div className="flex items-center gap-1.5 flex-shrink-0">
                        <span className={`px-1 rounded text-[9px] font-bold ${
                          item.status === 'ok' ? 'bg-emerald-100 text-emerald-800' :
                          item.status === 'bad' ? 'bg-rose-100 text-rose-800 font-black' : 'bg-gray-100 text-gray-600'
                        }`}>
                          {item.status === 'ok' ? 'OK' : item.status === 'bad' ? 'MAL' : 'N/A'}
                        </span>
                        {item.notes && (
                          <span className="text-[9px] text-rose-600 truncate max-w-[120px]">
                            ({item.notes})
                          </span>
                        )}
                      </div>
                    </div>
                  ))
                ) : (
                  <p className="text-slate-400 italic">Todos los componentes externos verificados OK.</p>
                )}
              </div>
            </div>

            {/* Revisión Interna */}
            <div className="border border-slate-300 rounded p-2">
              <h5 className="font-bold text-slate-800 border-b border-slate-200 pb-1 mb-1.5 uppercase tracking-wide">
                Revisión Interna (Habitáculo / Mandos / Auxilio)
              </h5>
              <div className="space-y-1 max-h-[360px] overflow-y-auto pr-1 print:max-h-none print:overflow-visible print:pr-0">
                {internalList.length > 0 ? (
                  internalList.map((item, idx) => (
                    <div key={item.id || idx} className="flex items-center justify-between border-b border-slate-100 py-0.5">
                      <span className="text-slate-800 truncate">{item.name}</span>
                      <div className="flex items-center gap-1.5 flex-shrink-0">
                        <span className={`px-1 rounded text-[9px] font-bold ${
                          item.status === 'ok' ? 'bg-emerald-100 text-emerald-800' :
                          item.status === 'bad' ? 'bg-rose-100 text-rose-800 font-black' : 'bg-gray-100 text-gray-600'
                        }`}>
                          {item.status === 'ok' ? 'OK' : item.status === 'bad' ? 'MAL' : 'N/A'}
                        </span>
                        {item.notes && (
                          <span className="text-[9px] text-rose-600 truncate max-w-[120px]">
                            ({item.notes})
                          </span>
                        )}
                      </div>
                    </div>
                  ))
                ) : (
                  <p className="text-slate-400 italic">Todos los componentes internos verificados OK.</p>
                )}
              </div>
            </div>
          </div>

          {/* Servicios y Reparaciones Aprobadas */}
          <div className="border border-slate-300 rounded p-2.5 text-xs bg-slate-50/50">
            <h4 className="font-bold text-slate-800 border-b border-slate-200 pb-1 mb-1.5 uppercase text-[10px] tracking-wide">
              Servicios y Reparaciones Aprobadas a Realizar
            </h4>
            <p className="text-[11px] text-slate-800 whitespace-pre-line leading-relaxed min-h-[40px]">
              {receipt.authorized_services || receipt.work_performed || 'Inspección diagnóstica inicial y presupuesto previo a ejecución.'}
            </p>
          </div>

          {/* Legal Acceptance Clause */}
          <div className="text-[9px] text-slate-500 leading-tight border border-slate-200 rounded p-2 bg-slate-50 text-justify">
            <strong>CLÁUSULA DE CUSTODIA Y CONFORMIDAD:</strong> El cliente autoriza los trabajos mencionados y los desplazamientos necesarios para pruebas mecánicas bajo su cuenta y riesgo. El taller no se hace responsable por pérdidas de objetos de valor o dinero no especificados en este reporte. Todo trabajo adicional no contemplado requerirá previa autorización.
          </div>

          {/* Digital Signatures Blocks */}
          <div className="grid grid-cols-2 gap-6 pt-2">
            {/* Signature Client */}
            <div className="border border-slate-300 rounded-lg p-3 text-center flex flex-col justify-between h-36 bg-white">
              <div className="flex-1 flex items-center justify-center">
                {receipt.client_signature ? (
                  <img
                    src={receipt.client_signature}
                    alt="Firma del Cliente"
                    className="max-h-20 max-w-full object-contain"
                  />
                ) : (
                  <span className="text-slate-300 text-xs italic">Firma Digital Registrada</span>
                )}
              </div>
              <div className="border-t border-slate-400 pt-1">
                <p className="font-bold text-[11px] text-slate-900">{receipt.owner_name || 'Firma del Cliente / Propietario'}</p>
                <p className="text-[10px] text-slate-500">{receipt.owner_tax_id ? `C.I. / RIF: ${receipt.owner_tax_id}` : 'Cliente Receptor'}</p>
              </div>
            </div>

            {/* Signature Mechanic / Receiver */}
            <div className="border border-slate-300 rounded-lg p-3 text-center flex flex-col justify-between h-36 bg-white">
              <div className="flex-1 flex items-center justify-center">
                {receipt.mechanic_signature ? (
                  <img
                    src={receipt.mechanic_signature}
                    alt="Firma del Técnico"
                    className="max-h-20 max-w-full object-contain"
                  />
                ) : (
                  <span className="text-slate-300 text-xs italic">Firma Digital Registrada</span>
                )}
              </div>
              <div className="border-t border-slate-400 pt-1">
                <p className="font-bold text-[11px] text-slate-900">{receipt.receiving_technician || receipt.received_by || 'Técnico Receptor'}</p>
                <p className="text-[10px] text-slate-500">Por Taller Integrale$ 360 Garage C.A.</p>
              </div>
            </div>
          </div>

          <div className="text-[10px] text-slate-400 text-right">
            Página 2 de 2 • Taller Integrale$ 360 Garage C.A.
          </div>
        </div>
      </div>
    </div>
  );
};
export default PrintableReceiptSheet;
