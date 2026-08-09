import 'server-only'

import { revalidateTag } from 'next/cache'

import { serverEnv } from '@/lib/config.server'

import {
  buildServiceUrl,
  normalizeFileEntry,
  unwrapList,
  type MediaCatalog,
  type MediaFile,
} from './normalize'

/**
 * Cliente del servicio externo de imágenes.
 *
 * Tiene **base propia** (`IMAGES_SERVICE_BASE_URL`), así que no pasa por el BFF
 * genérico de `/api/[...path]`, que apunta al backend. Ver docs/api-contract.md §10.
 *
 * Solo servidor: la URL del servicio no tiene por qué acabar en el bundle del cliente,
 * y así el navegador habla siempre con nuestro propio origen.
 */

/** Las consultas JSON son pequenas; transferir el binario necesita mas margen. */
const CATALOG_TIMEOUT_MS = 6000
const MEDIA_CONTENT_TIMEOUT_MS = 60_000
const UPLOAD_TIMEOUT_MS = 60_000

/**
 * Etiqueta común de las lecturas cacheadas. Tras crear/eliminar/subir se invalida con
 * `expire: 0` para que la siguiente lectura traiga el catálogo fresco de inmediato
 * —el original devolvía las carpetas actualizadas en cada mutación—.
 */
const MEDIA_CACHE_TAG = 'media'

async function get(path: string): Promise<unknown> {
  const response = await fetch(buildServiceUrl(serverEnv.IMAGES_SERVICE_BASE_URL, path), {
    signal: AbortSignal.timeout(CATALOG_TIMEOUT_MS),
    // El catálogo cambia poco y se precarga al entrar a la vista de tipos de alerta.
    next: { revalidate: 300, tags: [MEDIA_CACHE_TAG] },
  })

  if (!response.ok) throw new Error(`El servicio de imágenes respondió ${response.status}`)
  return response.json()
}

export async function fetchMediaFolders(): Promise<string[]> {
  const payload = await get('folders')
  return unwrapList(payload, ['folders', 'data', 'items']).map(String)
}

export async function fetchMediaFiles(folder: string): Promise<MediaFile[]> {
  const payload = await get(`folders/${encodeURIComponent(folder)}/files`)
  return unwrapList(payload, ['files', 'data', 'items']).map((entry) =>
    normalizeFileEntry(entry, folder, serverEnv.IMAGES_SERVICE_BASE_URL),
  )
}

/**
 * Catálogo completo para formularios: se obtiene una vez al entrar a la vista y se
 * entrega serializado al cliente. Los archivos de todas las carpetas se consultan en
 * paralelo; abrir o cerrar un modal no vuelve a tocar el microservicio.
 */
export async function fetchMediaCatalog(): Promise<MediaCatalog> {
  const folders = await fetchMediaFolders()
  const entries = await Promise.all(
    folders.map(async (folder) => {
      try {
        return [folder, await fetchMediaFiles(folder)] as const
      } catch {
        return [folder, []] as const
      }
    }),
  )

  return { folders, filesByFolder: Object.fromEntries(entries) }
}

/** Obtiene el binario de un recurso confiable del catálogo y preserva rangos de audio. */
export async function fetchMediaContent(
  sourceUrl: string,
  range: string | null,
): Promise<Response> {
  const serviceBase = new URL(`${serverEnv.IMAGES_SERVICE_BASE_URL.replace(/\/+$/, '')}/`)
  const contentUrl = new URL(sourceUrl, serviceBase)

  if (contentUrl.origin !== serviceBase.origin) {
    throw new Error('La URL multimedia no pertenece al servicio configurado.')
  }

  return fetch(contentUrl.toString(), {
    headers: range ? { Range: range } : undefined,
    cache: 'no-store',
    signal: AbortSignal.timeout(MEDIA_CONTENT_TIMEOUT_MS),
  })
}

/**
 * Mutaciones de la biblioteca. Como las lecturas, pegan **directo** al servicio de
 * imágenes (`IMAGES_SERVICE_BASE_URL`), no al backend principal —porta
 * `utils/images_service.py` (`create_image_folder`, `delete_image_folder`,
 * `upload_image_file`)—. Solo se llaman desde las rutas API `/api/media/*`, así que
 * invalidar la caché aquí es seguro (`revalidateTag` no corre durante el render).
 */

/** Crea un directorio: `POST {base}/folders` con JSON `{ name }`. */
export async function createMediaFolder(name: string): Promise<void> {
  const response = await fetch(buildServiceUrl(serverEnv.IMAGES_SERVICE_BASE_URL, 'folders'), {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ name }),
    cache: 'no-store',
    signal: AbortSignal.timeout(CATALOG_TIMEOUT_MS),
  })

  if (!response.ok) throw new Error('No fue posible crear el directorio, intenta nuevamente.')
  revalidateTag(MEDIA_CACHE_TAG, { expire: 0 })
}

/** Elimina un directorio: `DELETE {base}/folders/{folder}`. */
export async function deleteMediaFolder(folder: string): Promise<void> {
  const response = await fetch(
    buildServiceUrl(serverEnv.IMAGES_SERVICE_BASE_URL, `folders/${encodeURIComponent(folder)}`),
    {
      method: 'DELETE',
      cache: 'no-store',
      signal: AbortSignal.timeout(CATALOG_TIMEOUT_MS),
    },
  )

  if (!response.ok) throw new Error('No fue posible eliminar el directorio, intenta nuevamente.')
  revalidateTag(MEDIA_CACHE_TAG, { expire: 0 })
}

/**
 * Sube un archivo: `POST {base}/upload` multipart con `file`, `folder` y `filename`,
 * igual que `upload_image_file`. El nombre del `File` que llega del navegador conserva
 * su extensión, que es lo que necesita el servicio para tipar el binario.
 */
export async function uploadMediaFile(
  folder: string,
  filename: string,
  file: File,
): Promise<void> {
  const form = new FormData()
  form.append('file', file, file.name)
  form.append('folder', folder)
  form.append('filename', filename)

  const response = await fetch(buildServiceUrl(serverEnv.IMAGES_SERVICE_BASE_URL, 'upload'), {
    method: 'POST',
    body: form,
    cache: 'no-store',
    signal: AbortSignal.timeout(UPLOAD_TIMEOUT_MS),
  })

  if (!response.ok) throw new Error('No fue posible cargar el archivo, intenta nuevamente.')
  revalidateTag(MEDIA_CACHE_TAG, { expire: 0 })
}
