import React, { useRef, useState, useEffect } from 'react';

interface SignaturePadProps {
  label: string;
  signatureData?: string;
  onChange: (dataUrl: string) => void;
  signerName?: string;
  signerId?: string;
}

export const SignaturePad: React.FC<SignaturePadProps> = ({
  label,
  signatureData,
  onChange,
  signerName,
  signerId
}) => {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const [isDrawing, setIsDrawing] = useState(false);
  const [hasSignature, setHasSignature] = useState(Boolean(signatureData));

  // Initialize canvas with existing data if present
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    if (signatureData) {
      const img = new Image();
      img.onload = () => {
        ctx.clearRect(0, 0, canvas.width, canvas.height);
        ctx.drawImage(img, 0, 0, canvas.width, canvas.height);
        setHasSignature(true);
      };
      img.src = signatureData;
    } else {
      ctx.clearRect(0, 0, canvas.width, canvas.height);
      setHasSignature(false);
    }
  }, [signatureData]);

  const startDrawing = (e: React.PointerEvent<HTMLCanvasElement>) => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    canvas.setPointerCapture(e.pointerId);
    const rect = canvas.getBoundingClientRect();
    ctx.beginPath();
    ctx.moveTo(e.clientX - rect.left, e.clientY - rect.top);
    ctx.lineWidth = 2.5;
    ctx.lineCap = 'round';
    ctx.lineJoin = 'round';
    ctx.strokeStyle = '#0f172a'; // dark navy / black ink
    setIsDrawing(true);
  };

  const draw = (e: React.PointerEvent<HTMLCanvasElement>) => {
    if (!isDrawing) return;
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const rect = canvas.getBoundingClientRect();
    ctx.lineTo(e.clientX - rect.left, e.clientY - rect.top);
    ctx.stroke();
  };

  const stopDrawing = (e: React.PointerEvent<HTMLCanvasElement>) => {
    if (!isDrawing) return;
    const canvas = canvasRef.current;
    if (!canvas) return;
    setIsDrawing(false);
    canvas.releasePointerCapture(e.pointerId);

    const dataUrl = canvas.toDataURL('image/png');
    setHasSignature(true);
    onChange(dataUrl);
  };

  const handleClear = () => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    setHasSignature(false);
    onChange('');
  };

  return (
    <div className="bg-white rounded-2xl border border-gray-200 p-4 shadow-sm flex flex-col justify-between">
      <div className="flex items-center justify-between mb-2">
        <div>
          <h5 className="text-xs font-bold text-gray-800 uppercase tracking-wider">{label}</h5>
          {signerName && (
            <p className="text-xs text-gray-500 mt-0.5">
              {signerName} {signerId ? `(C.I. / RIF: ${signerId})` : ''}
            </p>
          )}
        </div>
        {hasSignature && (
          <button
            type="button"
            onClick={handleClear}
            className="text-xs text-rose-500 hover:text-rose-700 font-bold px-2 py-1 bg-rose-50 rounded-lg transition"
          >
            <i className="fas fa-trash-alt mr-1"></i> Borrar
          </button>
        )}
      </div>

      <div className="relative border-2 border-dashed border-gray-300 rounded-xl bg-slate-50 overflow-hidden touch-none h-40">
        <canvas
          ref={canvasRef}
          width={450}
          height={160}
          onPointerDown={startDrawing}
          onPointerMove={draw}
          onPointerUp={stopDrawing}
          onPointerCancel={stopDrawing}
          className="w-full h-full cursor-draw"
        />

        {!hasSignature && !isDrawing && (
          <div className="absolute inset-0 flex items-center justify-center pointer-events-none text-gray-400 text-xs">
            <span className="flex items-center gap-1.5 bg-white/80 px-3 py-1.5 rounded-full border border-gray-200 shadow-sm">
              <i className="fas fa-pen-nib text-primary"></i> Dibuje su firma aquí
            </span>
          </div>
        )}

        {/* Baseline signature line */}
        <div className="absolute bottom-6 left-8 right-8 border-b border-gray-300 pointer-events-none opacity-40"></div>
      </div>
    </div>
  );
};
export default SignaturePad;
