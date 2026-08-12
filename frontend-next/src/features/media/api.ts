import { API_PREFIX } from '@/lib/config'
import { apiRequest } from '@/lib/api/client'
import { ApiError, extractErrorMessage } from '@/lib/api/errors'

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

export async function createFolder(name: string): Promise<void> {
  await apiRequest('/media/folders', { method: 'POST', body: { name } })
}

export async function deleteFolder(folder: string): Promise<void> {
  await apiRequest(`/media/folders/${encodeURIComponent(folder)}`, { method: 'DELETE' })
}

/**
 * Sube un archivo. No pasa por `apiRequest` porque este serializa el cuerpo a JSON y
 * fija `Content-Type: application/json`; una subida necesita `multipart/form-data` con
 * el boundary que pone el navegador solo (por eso no se fija el header a mano).
 */
export async function uploadFile(input: {
  folder: string
  filename: string
  file: File
}): Promise<void> {
  const form = new FormData()
  form.append('folder', input.folder)
  form.append('filename', input.filename)
  form.append('file', input.file, input.file.name)

  const response = await fetch(`${API_PREFIX}/media/upload`, {
    method: 'POST',
    credentials: 'same-origin',
    body: form,
  })

  if (!response.ok) {
    const payload = await response.json().catch(() => null)
    throw new ApiError(
      response.status,
      extractErrorMessage(payload, 'No fue posible cargar el archivo.'),
      payload,
    )
  }
}
