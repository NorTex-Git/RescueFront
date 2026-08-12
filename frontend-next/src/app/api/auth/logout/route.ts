import type { NextRequest } from 'next/server'

import { clearAuthCookies } from '@/lib/auth/cookies'
import { serverEnv } from '@/lib/config.server'

/**
 * Cierra sesión. A diferencia de `logout()` de `app.py:231`, que solo limpiaba la
 * sesión Flask y dejaba las cookies JWT vivas, aquí se invalida en el backend
 * **y** se borran las cookies del navegador.
 */
export async function POST(request: NextRequest) {
  try {
    await fetch(`${serverEnv.BACKEND_API_URL}/auth/logout`, {
      method: 'POST',
      headers: { cookie: request.headers.get('cookie') ?? '' },
      cache: 'no-store',
    })
  } catch {
    // Si el backend no responde, igual se cierra la sesión local.
  }

  const headers = new Headers({ 'content-type': 'application/json' })
  clearAuthCookies(headers)

  return new Response(JSON.stringify({ success: true }), { status: 200, headers })
}
