import type { NextRequest } from 'next/server'

import { REFRESH_TOKEN_COOKIE, clearAuthCookies, forwardAuthCookies } from '@/lib/auth/cookies'
import { serverEnv } from '@/lib/config.server'

/**
 * Renueva el `auth_token` usando el `refresh_token`. Lo llama el interceptor de
 * `lib/api/client.ts` ante un 401, una sola vez para todas las peticiones en vuelo.
 */
export async function POST(request: NextRequest) {
  if (!request.cookies.get(REFRESH_TOKEN_COOKIE)) {
    return Response.json({ success: false, message: 'Sin refresh token' }, { status: 401 })
  }

  let upstream: Response
  try {
    upstream = await fetch(`${serverEnv.BACKEND_API_URL}/auth/refresh`, {
      method: 'POST',
      headers: { cookie: request.headers.get('cookie') ?? '' },
      cache: 'no-store',
    })
  } catch {
    // Fallo de red: la sesión puede seguir siendo válida, no se borran las cookies.
    return Response.json({ success: false, message: 'Backend no disponible' }, { status: 503 })
  }

  const headers = new Headers({ 'content-type': 'application/json' })
  const body = await upstream.text()

  if (upstream.ok) {
    forwardAuthCookies(upstream, headers)
  } else if (upstream.status === 401) {
    // El refresh token ya no sirve: se limpia para que el próximo request vaya a /login.
    clearAuthCookies(headers)
  }

  return new Response(body, { status: upstream.status, headers })
}
