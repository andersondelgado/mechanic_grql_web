/**
 * Conversión de archivos a base64 antes de enviarlos a la IA generativa.
 *
 * `base64`  -> payload limpio (sin prefijo `data:`) para Gemini `inlineData`.
 * `dataUrl` -> data URL completa, utilizada por la subida a la nube y el preview.
 */

export interface Base64File {
  name: string;
  size: number;
  mimeType: string;
  /** Base64 puro, sin el prefijo `data:<mime>;base64,` */
  base64: string;
  /** Data URL completa (`data:image/png;base64,...`) */
  dataUrl: string;
  kind: FileKind;
}

export type FileKind = 'image' | 'video' | 'audio' | 'other';

export function detectFileKind(mimeType: string): FileKind {
  const mime = (mimeType || '').toLowerCase();
  if (mime.startsWith('image/')) return 'image';
  if (mime.startsWith('video/')) return 'video';
  if (mime.startsWith('audio/')) return 'audio';
  return 'other';
}

export function stripDataUrl(value: string): string {
  return value.replace(/^data:[^;,]+;base64,/i, '');
}

export function fileToBase64(file: File): Promise<Base64File> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onerror = () => reject(reader.error || new Error('No se pudo leer el archivo'));
    reader.onload = () => {
      const dataUrl = String(reader.result || '');
      if (!dataUrl.includes(',')) {
        reject(new Error('Formato de archivo no soportado'));
        return;
      }
      resolve({
        name: file.name,
        size: file.size,
        mimeType: file.type || 'application/octet-stream',
        base64: stripDataUrl(dataUrl),
        dataUrl,
        kind: detectFileKind(file.type),
      });
    };
    reader.readAsDataURL(file);
  });
}

export function formatBytes(bytes: number): string {
  if (!bytes || bytes < 0) return '0 B';
  const units = ['B', 'KB', 'MB', 'GB'];
  const index = Math.min(Math.floor(Math.log(bytes) / Math.log(1024)), units.length - 1);
  const value = bytes / Math.pow(1024, index);
  return `${value >= 10 || index === 0 ? Math.round(value) : value.toFixed(1)} ${units[index]}`;
}
