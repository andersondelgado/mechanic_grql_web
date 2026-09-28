import React, { useEffect, useRef, useState } from "react";
import { useNavigate } from "react-router-dom";
import {
  GeminiAiService,
  type QuoteDraftResult,
  type DocumentAnalysisResult,
  type SuggestedPart,
} from "../../services/gemini-ai.service";

interface GeminiCopilotDrawerProps {
  open: boolean;
  onClose: () => void;
}

type CopilotMode = "quote" | "document" | "parts";

interface CopilotTab {
  key: CopilotMode;
  label: string;
  icon: string;
  hint: string;
}

const TABS: CopilotTab[] = [
  {
    key: "quote",
    label: "Presupuesto",
    icon: "fas fa-file-invoice-dollar",
    hint: "Dicta o escribe los trabajos acordados con el cliente para redactar el presupuesto oficial.",
  },
  {
    key: "document",
    label: "Documento",
    icon: "fas fa-file-alt",
    hint: "Sube una factura, orden de compra o remito para extraer sus datos automáticamente.",
  },
  {
    key: "parts",
    label: "Repuestos",
    icon: "fas fa-cogs",
    hint: "Describe los síntomas del vehículo y obtén los repuestos más probables.",
  },
];

const blobToBase64 = (blob: Blob): Promise<string> =>
  new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onloadend = () => {
      const result = reader.result as string;
      resolve(result.split(",")[1] || "");
    };
    reader.onerror = reject;
    reader.readAsDataURL(blob);
  });

export default function GeminiCopilotDrawer({ open, onClose }: GeminiCopilotDrawerProps) {
  const navigate = useNavigate();

  const [mode, setMode] = useState<CopilotMode>("quote");
  const [quickNotes, setQuickNotes] = useState("");
  const [symptoms, setSymptoms] = useState("");
  const [isRecording, setIsRecording] = useState(false);
  const [recordingSeconds, setRecordingSeconds] = useState(0);
  const [isLoadingAi, setIsLoadingAi] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const [aiResult, setAiResult] = useState<QuoteDraftResult | null>(null);
  const [documentResult, setDocumentResult] = useState<DocumentAnalysisResult | null>(null);
  const [partsResult, setPartsResult] = useState<SuggestedPart[] | null>(null);

  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const audioChunksRef = useRef<Blob[]>([]);
  const timerRef = useRef<any>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    return () => {
      if (timerRef.current) clearInterval(timerRef.current);
      mediaRecorderRef.current?.stream?.getTracks().forEach((t) => t.stop());
    };
  }, []);

  const resetState = () => {
    setAiResult(null);
    setDocumentResult(null);
    setPartsResult(null);
    setError(null);
    setIsLoadingAi(false);
  };

  const startAudioRecording = async () => {
    setError(null);
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      const mimeType = MediaRecorder.isTypeSupported("audio/webm;codecs=opus")
        ? "audio/webm;codecs=opus"
        : "audio/webm";
      const recorder = new MediaRecorder(stream, { mimeType });
      audioChunksRef.current = [];

      recorder.ondataavailable = (e) => {
        if (e.data.size > 0) audioChunksRef.current.push(e.data);
      };
      recorder.start(250);
      mediaRecorderRef.current = recorder;
      setIsRecording(true);
      setRecordingSeconds(0);
      timerRef.current = setInterval(() => setRecordingSeconds((s) => s + 1), 1000);
    } catch (err: any) {
      setError("No se pudo acceder al micrófono: " + (err?.message || err));
    }
  };

  const stopAudioRecording = async () => {
    const recorder = mediaRecorderRef.current;
    if (!recorder) return;

    const audioData: { base64: string; mimeType: string } = await new Promise((resolve) => {
      recorder.onstop = async () => {
        const blob = new Blob(audioChunksRef.current, { type: "audio/webm" });
        const base64 = await blobToBase64(blob);
        resolve({ base64, mimeType: "audio/webm" });
      };
      recorder.stop();
    });

    clearInterval(timerRef.current);
    recorder.stream.getTracks().forEach((t) => t.stop());
    setIsRecording(false);

    await processQuote({ audio_base64: audioData.base64, mime_type: audioData.mimeType });
  };

  const processQuote = async (extra: { audio_base64?: string; mime_type?: string }) => {
    if (!extra.audio_base64 && !quickNotes.trim()) {
      setError("Graba un audio o escribe las notas del trabajo antes de continuar.");
      return;
    }
    setIsLoadingAi(true);
    setError(null);
    try {
      const draft = await GeminiAiService.generateDraftQuote({
        ...extra,
        text_notes: quickNotes,
      });
      setAiResult(draft);
    } catch (err: any) {
      setError(err?.message || "No fue posible generar el presupuesto.");
    } finally {
      setIsLoadingAi(false);
    }
  };

  const processWithGemini = async () => {
    await processQuote({});
  };

  const onPickDocument = async (file: File) => {
    setIsLoadingAi(true);
    setError(null);
    try {
      const base64 = await blobToBase64(file);
      const mimeType = file.type || "image/jpeg";
      const result = await GeminiAiService.analyzeDocument(base64, mimeType, quickNotes || undefined);
      setDocumentResult(result);
    } catch (err: any) {
      setError(err?.message || "No fue posible analizar el documento.");
    } finally {
      setIsLoadingAi(false);
    }
  };

  const suggestParts = async () => {
    if (!symptoms.trim()) {
      setError("Describe los síntomas del vehículo antes de continuar.");
      return;
    }
    setIsLoadingAi(true);
    setError(null);
    try {
      const result = await GeminiAiService.suggestParts(symptoms, quickNotes || undefined);
      setPartsResult(result);
    } catch (err: any) {
      setError(err?.message || "No fue posible sugerir repuestos.");
    } finally {
      setIsLoadingAi(false);
    }
  };

  if (!open) return null;

  const activeTab = TABS.find((t) => t.key === mode)!;
  const totalItems = (aiResult?.items || []).reduce((acc, it) => acc + (Number(it.total_price) || 0), 0);

  return (
    <>
      {/* Backdrop */}
      <div className="fixed inset-0 z-40 bg-black/40 backdrop-blur-sm" onClick={onClose}></div>

      {/* Drawer */}
      <aside className="fixed inset-y-0 right-0 z-50 w-full max-w-md bg-white shadow-strong flex flex-col animate-fadeIn">
        {/* Header */}
        <div className="flex items-center justify-between px-5 py-4 border-b border-gray-100 bg-secondary text-white">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-primary/20 text-primary flex items-center justify-center">
              <i className="fas fa-brain text-lg"></i>
            </div>
            <div>
              <h3 className="font-bold text-lg leading-tight">Gemini Copilot</h3>
              <p className="text-xs text-gray-400">Asistente de Taller Inteligente</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="w-9 h-9 rounded-xl bg-white/10 hover:bg-white/20 transition flex items-center justify-center"
            title="Cerrar"
          >
            <i className="fas fa-times"></i>
          </button>
        </div>

        {/* Tabs */}
        <div className="grid grid-cols-3 gap-2 px-5 pt-4">
          {TABS.map((tab) => (
            <button
              key={tab.key}
              onClick={() => {
                setMode(tab.key);
                resetState();
              }}
              className={`flex flex-col items-center gap-1 py-2 rounded-xl text-xs font-semibold transition ${
                mode === tab.key
                  ? "bg-primary/10 text-primary border border-primary/30"
                  : "bg-gray-50 text-gray-500 border border-transparent hover:bg-gray-100"
              }`}
            >
              <i className={`${tab.icon} text-sm`}></i>
              {tab.label}
            </button>
          ))}
        </div>

        <div className="flex-1 overflow-y-auto px-5 py-4 space-y-4">
          {/* Modo Presupuesto */}
          {mode === "quote" && (
            <>
              <div className="rounded-2xl border border-gray-100 bg-gray-50 p-4">
                <h4 className="font-bold text-secondary text-sm">Captura de Orden de Trabajo</h4>
                <p className="text-xs text-gray-500 mt-1">{activeTab.hint}</p>

                <div className="mt-3 space-y-2">
                  {isRecording && (
                    <div className="flex items-center gap-2">
                      {[0, 1, 2, 3, 4].map((i) => (
                        <span
                          key={i}
                          className="w-1.5 rounded-full bg-danger animate-pulse"
                          style={{ height: `${14 + ((i * 7) % 20)}px` }}
                        ></span>
                      ))}
                      <span className="text-xs font-mono text-danger ml-1">
                        00:{recordingSeconds < 10 ? `0${recordingSeconds}` : recordingSeconds}
                      </span>
                    </div>
                  )}

                  <div className="flex gap-2">
                    {!isRecording ? (
                      <button
                        onClick={startAudioRecording}
                        className="flex-1 inline-flex items-center justify-center gap-2 px-3 py-2.5 rounded-xl bg-secondary text-white text-sm font-semibold hover:bg-secondary/90 transition"
                      >
                        <i className="fas fa-microphone"></i> Iniciar Grabación
                      </button>
                    ) : (
                      <button
                        onClick={stopAudioRecording}
                        className="flex-1 inline-flex items-center justify-center gap-2 px-3 py-2.5 rounded-xl bg-danger text-white text-sm font-semibold animate-pulse hover:opacity-90 transition"
                      >
                        <i className="fas fa-stop"></i> Finalizar y Procesar
                      </button>
                    )}
                  </div>
                </div>
              </div>

              <div>
                <label className="text-xs font-semibold text-gray-500 uppercase">
                  O ingresa notas / dictado en texto:
                </label>
                <textarea
                  rows={4}
                  value={quickNotes}
                  onChange={(e) => setQuickNotes(e.target.value)}
                  placeholder="Ej: Hilux 2020 ABC123, cliente reporta chirrido al frenar, cambiar balatas delanteras y rectificar discos..."
                  className="mt-1 w-full rounded-xl border border-gray-200 bg-white px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-primary/40 resize-none"
                />
              </div>

              <button
                onClick={processWithGemini}
                disabled={isLoadingAi || isRecording}
                className="w-full inline-flex items-center justify-center gap-2 px-4 py-3 rounded-xl bg-primary text-white text-sm font-bold hover:bg-primary-dark transition disabled:opacity-60"
              >
                {isLoadingAi ? (
                  <>
                    <i className="fas fa-circle-notch fa-spin"></i> Gemini procesando solicitud...
                  </>
                ) : (
                  <>
                    <i className="fas fa-wand-magic-sparkles"></i> Estructurar Presupuesto
                  </>
                )}
              </button>

              {aiResult && (
                <div className="rounded-2xl border border-success/30 bg-success/5 p-4 space-y-3">
                  <div className="flex items-center justify-between">
                    <span className="inline-flex items-center gap-1.5 text-xs font-bold text-success bg-success/10 px-2.5 py-1 rounded-full">
                      <i className="fas fa-check-circle"></i>
                      {aiResult.mock_generated ? "Borrador simulado" : "Borrador generado con éxito"}
                    </span>
                    <span className="text-xs text-gray-500">{aiResult.quote_date || ""}</span>
                  </div>

                  <div className="text-sm space-y-1">
                    <p>
                      <strong className="text-secondary">Cliente:</strong> {aiResult.client_name || "—"}
                      {aiResult.tax_id ? ` (${aiResult.tax_id})` : ""}
                    </p>
                    <p>
                      <strong className="text-secondary">Vehículo:</strong>{" "}
                      {[aiResult.brand, aiResult.model, aiResult.year].filter(Boolean).join(" ") || "—"}
                      {aiResult.license_plate ? ` · ${aiResult.license_plate}` : ""}
                    </p>
                  </div>

                  {!!aiResult.diagnostic?.length && (
                    <div>
                      <strong className="text-xs uppercase text-gray-500">Diagnóstico</strong>
                      <ul className="mt-1 space-y-1 text-sm text-gray-700">
                        {aiResult.diagnostic.map((d, i) => (
                          <li key={i} className="flex gap-2">
                            <i className="fas fa-angle-right text-primary mt-1"></i>
                            <span>{d}</span>
                          </li>
                        ))}
                      </ul>
                    </div>
                  )}

                  {!!aiResult.items?.length && (
                    <div className="overflow-hidden rounded-xl border border-gray-100">
                      <table className="w-full text-xs">
                        <thead className="bg-gray-50 text-gray-500 uppercase">
                          <tr>
                            <th className="text-left px-2 py-1.5">Ítem</th>
                            <th className="text-center px-2 py-1.5">Cant.</th>
                            <th className="text-right px-2 py-1.5">Total</th>
                          </tr>
                        </thead>
                        <tbody>
                          {aiResult.items.map((item, i) => (
                            <tr key={i} className="border-t border-gray-100">
                              <td className="px-2 py-1.5">{item.description}</td>
                              <td className="px-2 py-1.5 text-center">{item.quantity}</td>
                              <td className="px-2 py-1.5 text-right">{Number(item.total_price || 0).toFixed(2)}</td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  )}

                  <div className="flex items-center justify-between text-sm font-bold text-secondary border-t border-gray-100 pt-2">
                    <span>Subtotal: {Number(aiResult.subtotal ?? totalItems).toFixed(2)}</span>
                    <span className="text-primary">Total: {Number(aiResult.total ?? totalItems).toFixed(2)}</span>
                  </div>

                  <button
                    onClick={() => {
                      onClose();
                      navigate("/cotizaciones");
                    }}
                    className="w-full inline-flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl border border-primary text-primary text-sm font-semibold hover:bg-primary/10 transition"
                  >
                    <i className="fas fa-external-link-alt"></i> Ir a Presupuestos
                  </button>
                </div>
              )}
            </>
          )}

          {/* Modo Documento */}
          {mode === "document" && (
            <>
              <div className="rounded-2xl border border-gray-100 bg-gray-50 p-4">
                <h4 className="font-bold text-secondary text-sm">Análisis Documental con IA</h4>
                <p className="text-xs text-gray-500 mt-1">{activeTab.hint}</p>
                <input
                  ref={fileInputRef}
                  type="file"
                  accept="image/*"
                  className="hidden"
                  onChange={(e) => {
                    const file = e.target.files?.[0];
                    if (file) onPickDocument(file);
                    e.target.value = "";
                  }}
                />
                <button
                  onClick={() => fileInputRef.current?.click()}
                  disabled={isLoadingAi}
                  className="mt-3 w-full inline-flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl bg-secondary text-white text-sm font-semibold hover:bg-secondary/90 transition disabled:opacity-60"
                >
                  <i className="fas fa-upload"></i> Seleccionar imagen del documento
                </button>
              </div>

              <div>
                <label className="text-xs font-semibold text-gray-500 uppercase">
                  Contexto adicional (opcional):
                </label>
                <textarea
                  rows={3}
                  value={quickNotes}
                  onChange={(e) => setQuickNotes(e.target.value)}
                  placeholder="Ej: Factura de proveedor de repuestos del mes en curso..."
                  className="mt-1 w-full rounded-xl border border-gray-200 bg-white px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-primary/40 resize-none"
                />
              </div>

              {isLoadingAi && (
                <div className="flex items-center justify-center gap-2 text-sm text-primary font-semibold py-3">
                  <i className="fas fa-circle-notch fa-spin"></i> Analizando documento con Gemini...
                </div>
              )}

              {documentResult && (
                <div className="rounded-2xl border border-success/30 bg-success/5 p-4 space-y-2 text-sm">
                  <span className="inline-flex items-center gap-1.5 text-xs font-bold text-success bg-success/10 px-2.5 py-1 rounded-full">
                    <i className="fas fa-check-circle"></i> Documento procesado
                  </span>
                  <p><strong className="text-secondary">Tipo:</strong> {documentResult.document_type || "—"}</p>
                  <p><strong className="text-secondary">Proveedor:</strong> {documentResult.provider || "—"}</p>
                  <p><strong className="text-secondary">Folio:</strong> {documentResult.folio || "—"}</p>
                  <p><strong className="text-secondary">Fecha:</strong> {documentResult.issue_date || "—"}</p>
                  {!!documentResult.items?.length && (
                    <ul className="mt-1 space-y-1 text-gray-700">
                      {documentResult.items.map((it, i) => (
                        <li key={i} className="flex justify-between gap-2 border-b border-gray-100 pb-1">
                          <span>{it.description}</span>
                          <span className="font-mono">{Number(it.total || 0).toFixed(2)}</span>
                        </li>
                      ))}
                    </ul>
                  )}
                  <p className="font-bold text-secondary">
                    Total: {Number(documentResult.total || 0).toFixed(2)}
                  </p>
                  {!!documentResult.findings?.length && (
                    <ul className="list-disc list-inside text-xs text-gray-500 space-y-1">
                      {documentResult.findings.map((f, i) => (
                        <li key={i}>{f}</li>
                      ))}
                    </ul>
                  )}
                </div>
              )}
            </>
          )}

          {/* Modo Repuestos */}
          {mode === "parts" && (
            <>
              <div>
                <label className="text-xs font-semibold text-gray-500 uppercase">
                  Síntomas del vehículo:
                </label>
                <textarea
                  rows={4}
                  value={symptoms}
                  onChange={(e) => setSymptoms(e.target.value)}
                  placeholder="Ej: ruido al frenar, vibración en el volante a 80 km/h, pierde líquido..."
                  className="mt-1 w-full rounded-xl border border-gray-200 bg-white px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-primary/40 resize-none"
                />
              </div>

              <div>
                <label className="text-xs font-semibold text-gray-500 uppercase">
                  Impresión del técnico (opcional):
                </label>
                <textarea
                  rows={2}
                  value={quickNotes}
                  onChange={(e) => setQuickNotes(e.target.value)}
                  placeholder="Ej: desgaste irregular de balatas y discos..."
                  className="mt-1 w-full rounded-xl border border-gray-200 bg-white px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-primary/40 resize-none"
                />
              </div>

              <button
                onClick={suggestParts}
                disabled={isLoadingAi}
                className="w-full inline-flex items-center justify-center gap-2 px-4 py-3 rounded-xl bg-primary text-white text-sm font-bold hover:bg-primary-dark transition disabled:opacity-60"
              >
                {isLoadingAi ? (
                  <>
                    <i className="fas fa-circle-notch fa-spin"></i> Gemini buscando repuestos...
                  </>
                ) : (
                  <>
                    <i className="fas fa-cogs"></i> Sugerir Repuestos
                  </>
                )}
              </button>

              {!!partsResult?.length && (
                <div className="rounded-2xl border border-success/30 bg-success/5 p-4 space-y-2">
                  <span className="inline-flex items-center gap-1.5 text-xs font-bold text-success bg-success/10 px-2.5 py-1 rounded-full">
                    <i className="fas fa-check-circle"></i> {partsResult.length} repuestos sugeridos
                  </span>
                  {partsResult.map((part, i) => (
                    <div key={i} className="rounded-xl bg-white border border-gray-100 p-3 text-sm">
                      <div className="flex items-start justify-between gap-2">
                        <div>
                          <p className="font-semibold text-secondary">{part.description}</p>
                          <p className="text-xs text-gray-500">
                            {part.code} · {part.supplier || "—"}
                          </p>
                        </div>
                        <span
                          className={`text-[10px] font-bold uppercase px-2 py-0.5 rounded-full ${
                            part.urgency === "alta"
                              ? "bg-danger/10 text-danger"
                              : part.urgency === "media"
                              ? "bg-warning/10 text-warning"
                              : "bg-gray-100 text-gray-500"
                          }`}
                        >
                          {part.urgency || "n/a"}
                        </span>
                      </div>
                      <div className="mt-1 flex justify-between text-xs text-gray-600">
                        <span>Cant: {part.quantity ?? 1}</span>
                        <span className="font-semibold">~ {Number(part.estimated_price || 0).toFixed(2)}</span>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </>
          )}

          {error && (
            <div className="rounded-xl bg-danger/10 border border-danger/30 text-danger text-sm px-3 py-2.5 flex gap-2">
              <i className="fas fa-exclamation-triangle mt-0.5"></i>
              <span>{error}</span>
            </div>
          )}

          {activeTab.hint && (
            <p className="text-[11px] text-gray-400 text-center pt-2">
              Las respuestas son generadas por Gemini a través de la Lambda gRQL del taller.
            </p>
          )}
        </div>
      </aside>
    </>
  );
}
