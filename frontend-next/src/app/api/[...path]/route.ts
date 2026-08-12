import type { NextRequest } from 'next/server'

import { ACCESS_TOKEN_COOKIE, forwardAuthCookies } from '@/lib/auth/cookies'
import { serverEnv } from '@/lib/config.server'

/**
 * BFF: reemplaza `proxy_api` de `app.py:299`.
 *
 * El navegador pega a `/api/<endpoint>` y esto reenvía a `BACKEND_API_URL/<endpoint>`,
 * same-origin, para que las cookies HTTPOnly sigan funcionando sin CORS.
 * Los recursos del backend cuelgan de `/api/`, así que la URL del navegador lleva
 * `api` dos veces: `/api/api/hardware` → `BACKEND_API_URL/api/hardware`.
 */

/** Endpoints que no exigen `auth_token` (mismo criterio que `app.py:302`). */
const PUBLIC_ENDPOINTS = new Set(['auth/login', 'auth/refresh', 'api/contact/send'])

/**
 * Headers que no se reenvían aguas arriba: hop-by-hop (RFC 9110 §7.6.1) más los que
 * describen la conexión con *este* servidor, no con el backend.
 *
 * `expect` es obligatorio quitarlo: el fetch de Node (undici) lanza
 * `NotSupportedError: expect header not supported` y la petición muere con un 502.
 * Lo mandan varios clientes HTTP con `Expect: 100-continue`.
 */
const STRIPPED_REQUEST_HEADERS = new Set([
  'host',
  'connection',
  'keep-alive',
  'content-length',
  'accept-encoding',
  'expect',
  'te',
  'trailer',
  'transfer-encoding',
  'upgrade',
  'proxy-authenticate',
  'proxy-authorization',
  'x-forwarded-host',
])

/**
 * `fetch` ya descomprimió el cuerpo, así que estos headers del backend describirían
 * mal lo que devolvemos. `set-cookie` se maneja aparte en `forwardAuthCookies`.
 */
const STRIPPED_RESPONSE_HEADERS = new Set([
  'content-encoding',
  'content-length',
  'transfer-encoding',
  'connection',
  'set-cookie',
])

async function handle(request: NextRequest, context: RouteContext<'/api/[...path]'>) {
  const { path } = await context.params
  const endpoint = path.join('/')

  if (!PUBLIC_ENDPOINTS.has(endpoint) && !request.cookies.get(ACCESS_TOKEN_COOKIE)) {
    return Response.json({ success: false, error: 'No autenticado' }, { status: 401 })
  }

  const target = new URL(`${serverEnv.BACKEND_API_URL}/${endpoint}`)
  target.search = request.nextUrl.search

  const headers = new Headers()
  for (const [name, value] of request.headers) {
    if (!STRIPPED_REQUEST_HEADERS.has(name.toLowerCase())) headers.set(name, value)
  }
  // El backend distingue al frontend por User-Agent en el endpoint de contacto (app.py:333)
  if (endpoint === 'api/contact/send') headers.set('user-agent', 'RESCUE-Frontend/1.0')

  const hasBody = !['GET', 'HEAD'].includes(request.method)

  let upstream: Response
  try {
    upstream = await fetch(target, {
      method: request.method,
      headers,
      // Se reenvía el cuerpo crudo para soportar tanto JSON como multipart (subidas).
      body: hasBody ? await request.arrayBuffer() : undefined,
      /**
       * Seguir los redirects aquí, no reenviarlos al navegador.
       *
       * El backend es Flask con `strict_slashes`: `/api/hardware` responde 308 hacia
       * `/api/hardware/`. Si devolviéramos ese 308, el `Location` apuntaría a
       * `BACKEND_API_URL`, que el navegador no puede alcanzar (otro origen, y en
       * producción ni siquiera es accesible). `requests` en el proxy Flask seguía los
       * redirects por defecto, así que este era el comportamiento de siempre.
       */
      redirect: 'follow',
      cache: 'no-store',
    })
  } catch (error) {
    console.error(`[bff] ${request.method} /${endpoint} falló:`, error)
    return Response.json({ success: false, error: 'Error del servidor' }, { status: 502 })
  }

  const responseHeaders = new Headers()
  for (const [name, value] of upstream.headers) {
    if (!STRIPPED_RESPONSE_HEADERS.has(name.toLowerCase())) responseHeaders.set(name, value)
  }
  forwardAuthCookies(upstream, responseHeaders)

  return new Response(upstream.body, {
    status: upstream.status,
    statusText: upstream.statusText,
    headers: responseHeaders,
  })
}

export {
  handle as GET,
  handle as POST,
  handle as PUT,
  handle as PATCH,
  handle as DELETE,
  handle as HEAD,
}
