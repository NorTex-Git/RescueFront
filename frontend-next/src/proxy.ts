import { NextResponse, type NextRequest } from 'next/server'

import { ACCESS_TOKEN_COOKIE } from '@/lib/auth/cookies'
import { homeForRole, verifyAuthToken, type Role } from '@/lib/auth/jwt'

/**
 * Gating por rol. Sustituye el decorador `@require_role` repetido en las ~25 rutas
 * protegidas de `app.py`, y de paso arregla que aquel "validaba" el token haciendo
 * `GET /health` — es decir, no validaba nada.
 *
 * En Next 16 este archivo se llama `proxy.ts` (antes `middleware.ts`) y corre en el
 * runtime de Node, no en Edge.
 *
 * Esto solo evita renderizar páginas prohibidas. **No** es el control de acceso real:
 * el backend sigue siendo la autoridad en cada llamada de API.
 */

const PROTECTED_PREFIXES: Array<{ prefix: string; roles: Role[] }> = [
  { prefix: '/admin', roles: ['super_admin'] },
  { prefix: '/empresa', roles: ['empresa'] },
]

export async function proxy(request: NextRequest) {
  const { pathname } = request.nextUrl

  const match = PROTECTED_PREFIXES.find(
    ({ prefix }) => pathname === prefix || pathname.startsWith(`${prefix}/`),
  )
  if (!match) return NextResponse.next()

  const session = await verifyAuthToken(request.cookies.get(ACCESS_TOKEN_COOKIE)?.value)

  if (!session) {
    const login = new URL('/login', request.url)
    login.searchParams.set('next', pathname)
    return NextResponse.redirect(login)
  }

  if (!match.roles.includes(session.role)) {
    return NextResponse.redirect(new URL(homeForRole(session.role), request.url))
  }

  return NextResponse.next()
}

export const config = {
  // Solo las páginas protegidas: el BFF (`/api/*`) se autentica solo y los estáticos
  // no deben pasar por aquí.
  matcher: ['/admin/:path*', '/empresa/:path*'],
}
