import 'server-only'

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

async function get(path: string): Promise<unknown> {
  const response = await fetch(buildServiceUrl(serverEnv.IMAGES_SERVICE_BASE_URL, path), {
    signal: AbortSignal.timeout(CATALOG_TIMEOUT_MS),
    // El catálogo cambia poco y se precarga al entrar a la vista de tipos de alerta.
    next: { revalidate: 300 },
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
