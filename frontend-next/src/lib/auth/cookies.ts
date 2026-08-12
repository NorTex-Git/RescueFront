import { isProduction } from '@/lib/config.server'

export const ACCESS_TOKEN_COOKIE = 'auth_token'
export const REFRESH_TOKEN_COOKIE = 'refresh_token'

/**
 * Nombre a mostrar en navbar y sidebar. La escribimos nosotros al hacer login, con el
 * `user.username` del cuerpo de la respuesta, porque **el JWT no lo trae**.
 *
 * No es una segunda fuente de verdad de autenticación: es solo texto de UI. Los
 * permisos salen siempre del token, y si esta cookie falta se muestra un genérico.
 */
export const DISPLAY_NAME_COOKIE = 'display_name'

/** Las únicas cookies del backend que reenviamos al navegador. */
export const FORWARDED_COOKIES: string[] = [ACCESS_TOKEN_COOKIE, REFRESH_TOKEN_COOKIE]

export type AuthCookie = {
  name: string
  value: string
  maxAge?: number
  expires?: Date
}

/**
 * Extrae nombre/valor y vencimiento de un header `Set-Cookie` crudo.
 *
 * Deliberadamente ignoramos los flags del backend: `Secure`, `SameSite`, `HttpOnly`,
 * `Domain` y `Path` los fijamos nosotros. Eso corrige el `secure=False` hardcodeado
 * de `app.py:215` y `app.py:381`, que en producción mandaba la cookie de auth sin
 * flag Secure.
 */
function parseSetCookie(raw: string): AuthCookie | null {
  const [pair, ...attributes] = raw.split(';')
  const separator = pair.indexOf('=')
  if (separator === -1) return null

  const name = pair.slice(0, separator).trim()
  if (!name) return null

  const parsed: AuthCookie = { name, value: pair.slice(separator + 1).trim() }
  for (const attribute of attributes) {
    const [key, attributeValue] = attribute.split('=')
    const normalized = key.trim().toLowerCase()
    if (normalized === 'max-age' && attributeValue) {
      const maxAge = Number(attributeValue.trim())
      if (Number.isFinite(maxAge)) parsed.maxAge = maxAge
    } else if (normalized === 'expires' && attributeValue) {
      const expires = new Date(attributeValue.trim())
      if (!Number.isNaN(expires.getTime())) parsed.expires = expires
    }
  }
  return parsed
}

/** Cookies de auth presentes en una respuesta del backend. */
export function extractAuthCookies(response: Response): AuthCookie[] {
  return response.headers
    .getSetCookie()
    .map(parseSetCookie)
    .filter(
      (cookie): cookie is AuthCookie => cookie !== null && FORWARDED_COOKIES.includes(cookie.name),
    )
}

/** Flags que aplicamos nosotros, iguales en todos los caminos de escritura. */
export function authCookieOptions(cookie: Pick<AuthCookie, 'maxAge' | 'expires'>) {
  return {
    httpOnly: true,
    secure: isProduction(),
    sameSite: 'lax' as const,
    path: '/',
    ...(cookie.maxAge !== undefined ? { maxAge: cookie.maxAge } : {}),
    ...(cookie.expires ? { expires: cookie.expires } : {}),
  }
}

function serialize(cookie: AuthCookie): string {
  const parts = [`${cookie.name}=${cookie.value}`, 'Path=/', 'HttpOnly', 'SameSite=Lax']
  if (isProduction()) parts.push('Secure')
  if (cookie.maxAge !== undefined) parts.push(`Max-Age=${cookie.maxAge}`)
  else if (cookie.expires) parts.push(`Expires=${cookie.expires.toUTCString()}`)
  return parts.join('; ')
}

/**
 * Copia las cookies de auth de una respuesta del backend a los headers que
 * devolvemos al navegador. Para Route Handlers; en Server Actions se usa el
 * store de `cookies()` con `authCookieOptions`.
 */
export function forwardAuthCookies(from: Response, to: Headers): void {
  for (const cookie of extractAuthCookies(from)) {
    to.append('set-cookie', serialize(cookie))
  }
}

/** Borra las cookies de auth en el navegador (logout). */
export function clearAuthCookies(headers: Headers): void {
  for (const name of [...FORWARDED_COOKIES, DISPLAY_NAME_COOKIE]) {
    headers.append('set-cookie', serialize({ name, value: '', maxAge: 0 }))
  }
}
