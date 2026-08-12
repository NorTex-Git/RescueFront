'use client'

import { API_PREFIX } from '@/lib/config'

import { ApiError, extractErrorMessage } from './errors'

/**
 * Fetch del cliente contra el BFF. Same-origin, así que las cookies HTTPOnly
 * viajan solas: nunca hay que tocar el token desde JS.
 *
 * Conserva la única lógica que valía la pena de `static/js/api-client.js`: ante un
 * 401 refresca el token **una sola vez** y encola las peticiones concurrentes para
 * que no disparen N refreshes en paralelo.
 */

type RequestOptions = Omit<RequestInit, 'body'> & { body?: unknown }

let refreshPromise: Promise<boolean> | null = null

async function refreshToken(): Promise<boolean> {
  // Si ya hay un refresh en vuelo, todas las peticiones esperan a ese.
  refreshPromise ??= (async () => {
    try {
      const response = await fetch(`${API_PREFIX}/auth/refresh`, {
        method: 'POST',
        credentials: 'same-origin',
      })
      return response.ok
    } catch {
      // Fallo de red: no es sesión inválida, no se expulsa al usuario.
      return false
    } finally {
      // Se libera en el microtask siguiente para que los que esperan lean el mismo resultado.
      queueMicrotask(() => {
        refreshPromise = null
      })
    }
  })()

  return refreshPromise
}

async function send(endpoint: string, { body, headers, ...rest }: RequestOptions) {
  return fetch(`${API_PREFIX}${endpoint}`, {
    ...rest,
    credentials: 'same-origin',
    headers: { 'Content-Type': 'application/json', ...headers },
    body: body === undefined ? undefined : JSON.stringify(body),
  })
}

export async function apiRequest<T>(endpoint: string, options: RequestOptions = {}): Promise<T> {
  let response = await send(endpoint, options)

  if (response.status === 401) {
    const refreshed = await refreshToken()
    if (refreshed) response = await send(endpoint, options)
  }

  const payload = await response.json().catch(() => null)

  if (!response.ok) {
    throw new ApiError(
      response.status,
      extractErrorMessage(payload, `Error ${response.status} en ${endpoint}`),
      payload,
    )
  }

  return payload as T
}
