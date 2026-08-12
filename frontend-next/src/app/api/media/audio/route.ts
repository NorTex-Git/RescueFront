import { fetchMediaContent } from '@/features/media/server'
import { requireSession } from '@/lib/auth/session'

/**
 * Sirve el binario de un audio del catálogo desde nuestro propio origen.
 *
 * **Sin segmentos dinámicos a propósito.** Antes vivía en
 * `/api/media/folders/[folder]/files/[file]`, pero `folder` y `file` eran constantes
 * inventadas (`shared`/`audio`): el archivo real siempre venía en `?source=`. Esos
 * segmentos solo servían para que Next intentara generar rutas estáticas para ellos,
 * lo que reventaba el worker ("Failed to generate static paths") y devolvía un 500 en
 * vez del audio. El `<audio>` lo veía como formato inválido y no sonaba nada.
 */

const FORWARDED_HEADERS = [
  'accept-ranges',
  'cache-control',
  'content-length',
  'content-range',
  'content-type',
  'etag',
  'last-modified',
] as const

/** Nombre de descarga a partir de la propia URL de origen, sin parámetros extra. */
function filenameFrom(sourceUrl: string): string {
  const last = sourceUrl.split('?')[0].split('/').pop() ?? ''
  return last.replaceAll('"', '') || 'audio'
}

export async function GET(request: Request) {
  await requireSession()
  const sourceUrl = new URL(request.url).searchParams.get('source')

  if (!sourceUrl) {
    return Response.json({ error: 'Falta la URL del archivo multimedia.' }, { status: 400 })
  }

  try {
    const upstream = await fetchMediaContent(sourceUrl, request.headers.get('range'))
    if (!upstream.ok) {
      return Response.json(
        { error: 'No fue posible reproducir el archivo multimedia.' },
        { status: upstream.status },
      )
    }

    const headers = new Headers()
    for (const name of FORWARDED_HEADERS) {
      const value = upstream.headers.get(name)
      if (value) headers.set(name, value)
    }
    headers.set('content-disposition', `inline; filename="${filenameFrom(sourceUrl)}"`)

    return new Response(upstream.body, { status: upstream.status, headers })
  } catch {
    return Response.json(
      { error: 'No fue posible reproducir el archivo multimedia.' },
      { status: 502 },
    )
  }
}
