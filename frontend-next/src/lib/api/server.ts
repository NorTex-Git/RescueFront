import { cookies } from 'next/headers'

import { serverEnv } from '@/lib/config.server'

import { ApiError, extractErrorMessage } from './errors'

/**
 * Fetch tipado para Server Components y Server Actions: pega **directo** al backend
 * (no pasa por el BFF, sería un salto de red inútil) reenviando las cookies del request.
 */

type ApiOptions = Omit<RequestInit, 'body'> & { body?: unknown }

export async function apiFetch<T>(endpoint: string, options: ApiOptions = {}): Promise<T> {
  const cookieStore = await cookies()
  const { body, headers, ...rest } = options

  const response = await fetch(`${serverEnv.BACKEND_API_URL}${endpoint}`, {
    ...rest,
    headers: {
      'Content-Type': 'application/json',
      cookie: cookieStore.toString(),
      ...headers,
    },
    body: body === undefined ? undefined : JSON.stringify(body),
    cache: 'no-store',
  })

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
