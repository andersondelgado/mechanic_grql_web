import { PDFDocument, rgb, StandardFonts } from 'pdf-lib';
import type { VehicleReceipt, ChecklistItem, DamagePoint } from '../types/entities';

export async function downloadReceiptPdf(receipt: VehicleReceipt): Promise<void> {
  const pdfDoc = await PDFDocument.create();
  const helveticaBold = await pdfDoc.embedFont(StandardFonts.HelveticaBold);
  const helvetica = await pdfDoc.embedFont(StandardFonts.Helvetica);

  const receiptNum = receipt.receipt_number || `REC-${String(receipt.id || '0000').substring(0, 6).toUpperCase()}`;
  const fuel = receipt.fuel_level || '1/2';
  const externalList: ChecklistItem[] = Array.isArray(receipt.checklist_external)
    ? receipt.checklist_external
    : (typeof receipt.checklist_external === 'string' ? JSON.parse(receipt.checklist_external) : []);
  const internalList: ChecklistItem[] = Array.isArray(receipt.checklist_internal)
    ? receipt.checklist_internal
    : (typeof receipt.checklist_internal === 'string' ? JSON.parse(receipt.checklist_internal) : []);
  const damagePoints: DamagePoint[] = Array.isArray(receipt.damage_points)
    ? receipt.damage_points
    : (typeof receipt.damage_points === 'string' ? JSON.parse(receipt.damage_points) : []);

  // ─── PÁGINA 1: Identificación, Custodia, Combustible y Daños ─────────
  const page1 = pdfDoc.addPage([612, 792]);
  const { width, height } = page1.getSize();

  // Banner Superior
  page1.drawRectangle({
    x: 30,
    y: height - 85,
    width: width - 60,
    height: 60,
    color: rgb(0.08, 0.12, 0.18),
  });

  page1.drawText('TALLER INTEGRALE$ 360 GARAGE C.A.', {
    x: 45,
    y: height - 50,
    size: 14,
    font: helveticaBold,
    color: rgb(1, 1, 1),
  });

  page1.drawText('MECÁNICA GENERAL • LATONERÍA Y PINTURA • DIAGNÓSTICO', {
    x: 45,
    y: height - 68,
    size: 8,
    font: helvetica,
    color: rgb(0.7, 0.8, 0.9),
  });

  page1.drawText(`N° ${receiptNum}`, {
    x: width - 180,
    y: height - 50,
    size: 12,
    font: helveticaBold,
    color: rgb(0.95, 0.75, 0.2),
  });

  page1.drawText(`Fecha Entrada: ${receipt.entry_date || '-'}`, {
    x: width - 180,
    y: height - 66,
    size: 8,
    font: helvetica,
    color: rgb(1, 1, 1),
  });

  // Franja de Título
  page1.drawRectangle({
    x: 30,
    y: height - 105,
    width: width - 60,
    height: 16,
    color: rgb(0.93, 0.94, 0.96),
  });
  page1.drawText('FICHA DE CONTROL E INSPECCIÓN DE RECEPCIÓN DE VEHÍCULO', {
    x: 45,
    y: height - 101,
    size: 8,
    font: helveticaBold,
    color: rgb(0.1, 0.1, 0.1),
  });

  // Caja 1: Propietario / Cliente
  const colW = (width - 70) / 2;
  page1.drawRectangle({
    x: 30,
    y: height - 200,
    width: colW,
    height: 90,
    borderColor: rgb(0.8, 0.8, 0.8),
    borderWidth: 1,
  });
  page1.drawText('DATOS DEL PROPIETARIO / CLIENTE', {
    x: 38,
    y: height - 120,
    size: 8,
    font: helveticaBold,
    color: rgb(0.2, 0.2, 0.2),
  });
  page1.drawText(`Nombre/Razón: ${receipt.owner_name || '-'}`, { x: 38, y: height - 138, size: 8, font: helvetica });
  page1.drawText(`C.I. / RIF: ${receipt.owner_tax_id || '-'}`, { x: 38, y: height - 152, size: 8, font: helvetica });
  page1.drawText(`Teléfono: ${receipt.phone || '-'}`, { x: 38, y: height - 166, size: 8, font: helvetica });
  page1.drawText(`Dirección: ${receipt.address || '-'}`, { x: 38, y: height - 180, size: 8, font: helvetica });

  // Caja 2: Vehículo
  page1.drawRectangle({
    x: 35 + colW,
    y: height - 200,
    width: colW,
    height: 90,
    borderColor: rgb(0.8, 0.8, 0.8),
    borderWidth: 1,
  });
  page1.drawText('DATOS DEL VEHÍCULO', {
    x: 43 + colW,
    y: height - 120,
    size: 8,
    font: helveticaBold,
    color: rgb(0.2, 0.2, 0.2),
  });
  page1.drawText(`Placa: ${receipt.license_plate}`, { x: 43 + colW, y: height - 138, size: 9, font: helveticaBold, color: rgb(0.1, 0.3, 0.8) });
  page1.drawText(`Marca / Modelo: ${receipt.brand} ${receipt.model}`, { x: 43 + colW, y: height - 152, size: 8, font: helvetica });
  page1.drawText(`Color: ${receipt.color || '-'}`, { x: 43 + colW, y: height - 166, size: 8, font: helvetica });
  page1.drawText(`Kilometraje: ${receipt.mileage ? `${receipt.mileage} km` : '-'}`, { x: 43 + colW, y: height - 180, size: 8, font: helvetica });

  // Caja 3: Custodia
  page1.drawRectangle({
    x: 30,
    y: height - 250,
    width: width - 60,
    height: 42,
    borderColor: rgb(0.8, 0.8, 0.8),
    borderWidth: 1,
  });
  page1.drawText(`Recibido por: ${receipt.received_by || receipt.receiving_technician || '-'}`, { x: 38, y: height - 225, size: 8, font: helvetica });
  page1.drawText(`Entregado por: ${receipt.delivered_by || receipt.owner_name || '-'}`, { x: 220, y: height - 225, size: 8, font: helvetica });
  page1.drawText(`Técnico Asignado: ${receipt.assigned_technician || '-'}`, { x: 400, y: height - 225, size: 8, font: helvetica });

  // Caja 4: Combustible y Motivo
  page1.drawRectangle({
    x: 30,
    y: height - 330,
    width: 170,
    height: 70,
    borderColor: rgb(0.8, 0.8, 0.8),
    borderWidth: 1,
  });
  page1.drawText('NIVEL DE COMBUSTIBLE', { x: 38, y: height - 275, size: 8, font: helveticaBold });
  page1.drawText(`Tanque: ${fuel}`, { x: 38, y: height - 300, size: 10, font: helveticaBold, color: rgb(0.1, 0.4, 0.7) });

  page1.drawRectangle({
    x: 210,
    y: height - 330,
    width: width - 240,
    height: 70,
    borderColor: rgb(0.8, 0.8, 0.8),
    borderWidth: 1,
  });
  page1.drawText('MOTIVO DE INGRESO / FALLAS REPORTADAS', { x: 218, y: height - 275, size: 8, font: helveticaBold });
  const reason = (receipt.reason_for_entry || receipt.observations || 'Revisión en taller.').substring(0, 180);
  page1.drawText(reason, { x: 218, y: height - 295, size: 8, font: helvetica, maxWidth: width - 260 });

  // Caja 5: Daños en Carrocería
  page1.drawRectangle({
    x: 30,
    y: height - 480,
    width: width - 60,
    height: 140,
    borderColor: rgb(0.8, 0.8, 0.8),
    borderWidth: 1,
  });
  page1.drawText(`DIAGRAMA DE ESTADO DE CARROCERÍA Y DAÑOS (${damagePoints.length} marcas)`, {
    x: 38,
    y: height - 355,
    size: 8,
    font: helveticaBold,
  });

  if (damagePoints.length === 0) {
    page1.drawText('Sin averías observadas. Carrocería en buen estado general al recibir.', {
      x: 38,
      y: height - 380,
      size: 8,
      font: helvetica,
      color: rgb(0.4, 0.4, 0.4),
    });
  } else {
    let dy = height - 375;
    for (let i = 0; i < Math.min(damagePoints.length, 6); i++) {
      const d = damagePoints[i];
      page1.drawText(`• [${d.type.toUpperCase()}] Vista: ${d.view} - Detalle: ${d.notes || 'Avería observada'}`, {
        x: 38,
        y: dy,
        size: 7.5,
        font: helvetica,
      });
      dy -= 14;
    }
  }

  // Decodificar e incrustar firmas digitales en base64
  const embedSignatureImage = async (base64Str?: string) => {
    if (!base64Str || typeof base64Str !== 'string') return null;
    let clean = base64Str.trim();
    if (clean.includes('base64,')) {
      clean = clean.split('base64,')[1];
    } else if (clean.includes(',')) {
      clean = clean.split(',')[1];
    }
    clean = clean.replace(/\s+/g, '');
    if (!clean) return null;

    let imageBytes: Uint8Array;
    const g = typeof window !== 'undefined' ? (window as any) : (globalThis as any);
    if (typeof g.Buffer !== 'undefined') {
      imageBytes = g.Buffer.from(clean, 'base64');
    } else {
      try {
        const binary = atob(clean);
        imageBytes = new Uint8Array(binary.length);
        for (let i = 0; i < binary.length; i++) {
          imageBytes[i] = binary.charCodeAt(i);
        }
      } catch {
        return null;
      }
    }

    if (!imageBytes || imageBytes.length === 0) return null;

    try {
      return await pdfDoc.embedPng(imageBytes);
    } catch (errPng) {
      try {
        return await pdfDoc.embedJpg(imageBytes);
      } catch (errJpg) {
        console.warn('No se pudo procesar la firma como PNG o JPG:', errPng, errJpg);
        return null;
      }
    }
  };

  const clientSigRaw = receipt.client_signature || (receipt as any).signature_client || (receipt as any).firma_cliente;
  const mechanicSigRaw = receipt.mechanic_signature || (receipt as any).signature_mechanic || (receipt as any).firma_mecanico || (receipt as any).firma_tecnico;

  const [clientSigImg, mechanicSigImg] = await Promise.all([
    embedSignatureImage(clientSigRaw),
    embedSignatureImage(mechanicSigRaw),
  ]);

  // Firmas en página 1
  page1.drawRectangle({ x: 30, y: 70, width: 260, height: 90, borderColor: rgb(0.8, 0.8, 0.8), borderWidth: 1 });
  page1.drawText('FIRMA DEL CLIENTE / PROPIETARIO', { x: 40, y: 145, size: 8, font: helveticaBold });

  if (clientSigImg) {
    const maxW = 210;
    const maxH = 44;
    const scale = Math.min(maxW / clientSigImg.width, maxH / clientSigImg.height, 1);
    const w = clientSigImg.width * scale;
    const h = clientSigImg.height * scale;
    const x = 30 + (260 - w) / 2;
    const y = 96 + (46 - h) / 2;
    page1.drawImage(clientSigImg, { x, y, width: w, height: h });
  }

  page1.drawLine({ start: { x: 45, y: 95 }, end: { x: 275, y: 95 }, color: rgb(0.7, 0.7, 0.7), thickness: 1 });
  page1.drawText(receipt.owner_name || 'Cliente', { x: 45, y: 82, size: 8, font: helvetica });

  page1.drawRectangle({ x: 320, y: 70, width: 262, height: 90, borderColor: rgb(0.8, 0.8, 0.8), borderWidth: 1 });
  page1.drawText('FIRMA DEL TÉCNICO RECEPTOR', { x: 330, y: 145, size: 8, font: helveticaBold });

  if (mechanicSigImg) {
    const maxW = 210;
    const maxH = 44;
    const scale = Math.min(maxW / mechanicSigImg.width, maxH / mechanicSigImg.height, 1);
    const w = mechanicSigImg.width * scale;
    const h = mechanicSigImg.height * scale;
    const x = 320 + (262 - w) / 2;
    const y = 96 + (46 - h) / 2;
    page1.drawImage(mechanicSigImg, { x, y, width: w, height: h });
  }

  page1.drawLine({ start: { x: 335, y: 95 }, end: { x: 565, y: 95 }, color: rgb(0.7, 0.7, 0.7), thickness: 1 });
  page1.drawText(receipt.received_by || receipt.receiving_technician || 'Taller Integrale$ 360 Garage', { x: 335, y: 82, size: 8, font: helvetica });

  page1.drawText('Página 1 de 2 • Taller Integrale$ 360 Garage C.A.', { x: width - 240, y: 40, size: 7, font: helvetica, color: rgb(0.5, 0.5, 0.5) });

  // ─── PÁGINA 2: Inventario 77 Puntos y Servicios Autorizados ──────────
  const page2 = pdfDoc.addPage([612, 792]);

  page2.drawRectangle({
    x: 30,
    y: height - 55,
    width: width - 60,
    height: 30,
    color: rgb(0.08, 0.12, 0.18),
  });
  page2.drawText('INVENTARIO DE COMPONENTES Y ESTADO FÍSICO (77 PUNTOS)', {
    x: 45,
    y: height - 42,
    size: 10,
    font: helveticaBold,
    color: rgb(1, 1, 1),
  });

  // Columna Externa
  page2.drawRectangle({ x: 30, y: 220, width: 265, height: height - 290, borderColor: rgb(0.8, 0.8, 0.8), borderWidth: 1 });
  page2.drawText('REVISIÓN EXTERNA (CARROCERÍA / RUEDAS)', { x: 38, y: height - 75, size: 7.5, font: helveticaBold });
  let extY = height - 90;
  for (let i = 0; i < Math.min(externalList.length, 36); i++) {
    const it = externalList[i];
    const st = (it.status || 'OK').toUpperCase();
    page2.drawText(`${it.name.substring(0, 32)}: [${st}]`, { x: 38, y: extY, size: 6.5, font: helvetica });
    extY -= 12.5;
  }

  // Columna Interna
  page2.drawRectangle({ x: 315, y: 220, width: 267, height: height - 290, borderColor: rgb(0.8, 0.8, 0.8), borderWidth: 1 });
  page2.drawText('REVISIÓN INTERNA (HABITÁCULO / MANDOS)', { x: 323, y: height - 75, size: 7.5, font: helveticaBold });
  let intY = height - 90;
  for (let i = 0; i < Math.min(internalList.length, 36); i++) {
    const it = internalList[i];
    const st = (it.status || 'OK').toUpperCase();
    page2.drawText(`${it.name.substring(0, 32)}: [${st}]`, { x: 323, y: intY, size: 6.5, font: helvetica });
    intY -= 12.5;
  }

  // Servicios Autorizados
  page2.drawRectangle({ x: 30, y: 100, width: width - 60, height: 105, borderColor: rgb(0.8, 0.8, 0.8), borderWidth: 1 });
  page2.drawText('SERVICIOS Y REPARACIONES APROBADAS A REALIZAR', { x: 40, y: 190, size: 8, font: helveticaBold });
  const auth = (receipt.authorized_services || receipt.work_performed || 'Inspección diagnóstica inicial autorizada.').substring(0, 300);
  page2.drawText(auth, { x: 40, y: 172, size: 8, font: helvetica, maxWidth: width - 80 });

  page2.drawText('CLÁUSULA LEGAL: El cliente autoriza los trabajos indicados y las pruebas de manejo correspondientes.', {
    x: 40,
    y: 115,
    size: 6.5,
    font: helvetica,
    color: rgb(0.4, 0.4, 0.4),
  });

  page2.drawText('Página 2 de 2 • Taller Integrale$ 360 Garage C.A.', { x: width - 240, y: 40, size: 7, font: helvetica, color: rgb(0.5, 0.5, 0.5) });

  const pdfBytes = await pdfDoc.save();

  // Trigger browser download
  const blob = new Blob([pdfBytes as any], { type: 'application/pdf' });
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.href = url;
  link.download = `Ficha_Recepcion_${receipt.license_plate || 'vehiculo'}_${receiptNum}.pdf`;
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  URL.revokeObjectURL(url);
}
