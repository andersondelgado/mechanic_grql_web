/**
 * Servicio de archivos / bucket — espejo de ELYTRABIT `file.service.ts`.
 * Sube archivos directamente a /api/secure-rQL/put-to-bucket evitando
 * el límite de 6MB de payload de AWS Lambda.
 */
import { apiClient } from '../api/client';
import { BASE_URL, DB_NAME, API_KEY } from '../api/config';

export interface BucketFileUploadResult {
  id: string;
  name: string;
  size: number;
  type: string;
  created_at?: string;
  url: string;
}

export const FileService = {
  /**
   * Sube un archivo binario directamente al bucket del servidor (bypasses lambda).
   * @param file Archivo File o Blob
   * @param table Tabla de almacenamiento (por defecto 'bucket')
   * @param fileName Nombre opcional del archivo
   */
  async uploadFile(
    file: File | Blob,
    table: string = 'bucket',
    fileName?: string
  ): Promise<BucketFileUploadResult> {
    const formData = new FormData();
    const name = fileName || (file instanceof File ? file.name : 'archivo.bin');
    formData.append('db', DB_NAME);
    formData.append('table', table);
    formData.append('files', file, name);

    const res = await apiClient.post<any>('/api/secure-rQL/put-to-bucket', formData);
    const data = res.data;
    const fileId = data?.id;

    return {
      id: fileId,
      name: data?.name || name,
      size: data?.size || file.size,
      type: data?.type || (file instanceof File ? file.type : ''),
      created_at: data?.created_at,
      url: fileId ? this.getImageUrl(table, fileId) : '',
    };
  },

  /**
   * Genera la URL pública de descarga con query token autenticado.
   */
  getImageUrl(table: string = 'bucket', id: string): string {
    let tokenAuth = API_KEY;
    try {
      tokenAuth = atob(API_KEY);
    } catch {
      // Si no está en base64, usar valor original
    }
    return `${BASE_URL}/api/secure-rQL/bucket-to-pull-queryToken-no-cache?table=${encodeURIComponent(
      table
    )}&id=${encodeURIComponent(id)}&db=${encodeURIComponent(DB_NAME)}&tokenAuth=${encodeURIComponent(
      tokenAuth
    )}`;
  },

  /**
   * Elimina un archivo del bucket.
   */
  async deleteFile(table: string = 'bucket', id: string): Promise<any> {
    const res = await apiClient.request<any>('/api/secure-rQL/destroy-file-bucket', {
      method: 'DELETE',
      body: { table, id, db: DB_NAME },
    });
    return res.data;
  },
};

export default FileService;
