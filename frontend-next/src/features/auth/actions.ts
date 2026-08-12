'use server'

import { cookies } from 'next/headers'
import { redirect } from 'next/navigation'

import { extractErrorMessage } from '@/lib/api/errors'
import {
  DISPLAY_NAME_COOKIE,
  REFRESH_TOKEN_COOKIE,
  authCookieOptions,
  extractAuthCookies,
} from '@/lib/auth/cookies'
import { homeForRole, ROLES, type Role } from '@/lib/auth/jwt'
import { serverEnv } from '@/lib/config.server'

import { loginSchema } from './schema'

/**
 * Server Action de login. Reemplaza `login()` de `app.py:165`.
 *
 * Diferencias con Flask: no se crea sesión de servidor (`session['user']` era una
 * segunda fuente de verdad junto al JWT) y las cookies salen con `Secure` según
 * entorno en vez de `secure=False` fijo.
 */

export type LoginState = { error: string | null }

export async function login(_previous: LoginState, formData: FormData): Promise<LoginState> {
  const parsed = loginSchema.safeParse({
    usuario: formData.get('usuario'),
    password: formData.get('password'),
  })

  if (!parsed.success) {
    return { error: parsed.error.issues[0]?.message ?? 'Datos inválidos' }
  }

  let response: Response
  try {
    response = await fetch(`${serverEnv.BACKEND_API_URL}/auth/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(parsed.data),
      cache: 'no-store',
    })
  } catch {
    return { error: 'El servidor no está disponible. Intenta más tarde.' }
  }

  const payload = (await response.json().catch(() => null)) as {
    user?: { role?: string; username?: string }
  } | null

  if (!response.ok) {
    // El backend responde `{"success":false,"errors":["Credenciales inválidas"]}`.
    return { error: extractErrorMessage(payload, 'Credenciales inválidas') }
  }

  const authCookies = extractAuthCookies(response)
  if (authCookies.length === 0) {
    // Sin cookies no hay sesión: fallar aquí es más claro que redirigir a un portal
    // que devolvería 401 en la primera llamada.
    return { error: 'El servidor no devolvió una sesión válida.' }
  }

  const cookieStore = await cookies()
  for (const cookie of authCookies) {
    cookieStore.set(cookie.name, cookie.value, authCookieOptions(cookie))
  }

  // El nombre no viaja en el JWT, solo en este cuerpo. Se guarda aparte para la UI.
  const username = payload?.user?.username
  if (username) {
    // Con la vigencia del refresh token, no la del access: si caducara a los 15 min,
    // el nombre desaparecería de la UI tras el primer refresh silencioso.
    const refresh = authCookies.find((cookie) => cookie.name === REFRESH_TOKEN_COOKIE)
    cookieStore.set(DISPLAY_NAME_COOKIE, username, authCookieOptions(refresh ?? {}))
  }

  const role = payload?.user?.role
  if (!role || !ROLES.includes(role as Role)) {
    return { error: 'Tu usuario no tiene un rol válido en el sistema.' }
  }

  // `redirect` lanza, así que va fuera del try de arriba.
  redirect(safeNext(formData.get('next')) ?? homeForRole(role as Role))
}

/**
 * `?next=` viene de la redirección de `proxy.ts`. Solo se aceptan rutas internas:
 * un `next=https://otro-sitio` sería un open redirect.
 */
function safeNext(value: FormDataEntryValue | null): string | null {
  if (typeof value !== 'string') return null
  if (!value.startsWith('/') || value.startsWith('//')) return null
  return value
}
