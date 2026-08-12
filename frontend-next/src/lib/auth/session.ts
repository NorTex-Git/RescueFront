import { cookies } from 'next/headers'
import { redirect } from 'next/navigation'

import { ACCESS_TOKEN_COOKIE, DISPLAY_NAME_COOKIE } from './cookies'
import { verifyAuthToken, type SessionPayload } from './jwt'

export type Session = SessionPayload & {
  /** Nombre a mostrar. No viene en el token; ver `DISPLAY_NAME_COOKIE`. */
  displayName: string
}

/**
 * Sesión del request actual. La autoridad es siempre el JWT: reemplaza a
 * `session['user']` de Flask, que era una segunda fuente de verdad capaz de
 * desincronizarse del token.
 */
export async function getSession(): Promise<Session | null> {
  const cookieStore = await cookies()
  const payload = await verifyAuthToken(cookieStore.get(ACCESS_TOKEN_COOKIE)?.value)
  if (!payload) return null

  return {
    ...payload,
    displayName: cookieStore.get(DISPLAY_NAME_COOKIE)?.value || 'Usuario',
  }
}

/**
 * Igual que `getSession` pero redirige si no hay sesión. Para Server Components de
 * páginas protegidas: `proxy.ts` ya bloqueó el acceso, esto solo estrecha el tipo.
 */
export async function requireSession(): Promise<Session> {
  const session = await getSession()
  if (!session) redirect('/login')
  return session
}

/**
 * Id de empresa del usuario.
 *
 * Verificado contra el backend real: el claim `sub` del token es el id de Mongo del
 * usuario, y coincide con el `user.id` del cuerpo de `/auth/login` que Flask guardaba
 * en `session['user']['id']` y usaba como id de empresa (`app.py:1451`). O sea, `sub`
 * reproduce exactamente el comportamiento anterior.
 */
export function empresaIdFrom(session: SessionPayload): string {
  return session.sub
}
