import { unstable_rethrow } from 'next/navigation'

import { toLoadError, type LoadResult } from '@/load-result'

/** Ejecuta una precarga de servidor sin confundir un fallo con una lista vacía. */
export async function preload<T>(
  resource: string,
  loader: () => Promise<T>,
): Promise<LoadResult<T>> {
  try {
    return { ok: true, data: await loader() }
  } catch (error) {
    // Next usa excepciones para redirect, notFound y detección de rutas dinámicas.
    unstable_rethrow(error)

    const normalized = toLoadError(error, resource)
    console.error('[preload] Falló la carga', {
      resource,
      kind: normalized.kind,
      status: normalized.status,
      cause: error,
    })
    return { ok: false, error: normalized }
  }
}
