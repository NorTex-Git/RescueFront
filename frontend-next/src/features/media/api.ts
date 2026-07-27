import { apiRequest } from '@/lib/api/client'

import type { MediaFile } from './normalize'

/**
 * Catálogo de archivos, a través de nuestras propias rutas `/api/media/*`.
 *
 * El navegador nunca habla directo con el servicio de imágenes: la URL del servicio
 * vive solo en el servidor y así no hay que abrir CORS ni exponerla.
 */

export async function fetchFolders(): Promise<string[]> {
  const payload = await apiRequest<{ folders?: string[] }>('/media/folders')
  return payload.folders ?? []
}

export async function fetchFiles(folder: string): Promise<MediaFile[]> {
  const payload = await apiRequest<{ files?: MediaFile[] }>(
    `/media/folders/${encodeURIComponent(folder)}/files`,
  )
  return payload.files ?? []
}
