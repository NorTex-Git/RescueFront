import { decodeJwt, jwtVerify } from 'jose'
import { z } from 'zod'

import { serverEnv } from '@/lib/config.server'

export const ROLES = ['empresa', 'super_admin'] as const
export type Role = (typeof ROLES)[number]

/**
 * Claims del `auth_token`, verificados contra el backend real. Un token de ejemplo:
 *
 * ```json
 * { "fresh": false, "iat": …, "jti": "…", "type": "access",
 *   "sub": "6a657c5dfc32af380f385ce1", "nbf": …, "exp": …, "role": "super_admin" }
 * ```
 *
 * Ojo con lo que **no** trae: ni `usuario`/`username` ni `empresa_id`. Esos solo
 * vienen en el cuerpo de `/auth/login`. `sub` es el id de Mongo del usuario, que es
 * exactamente el `session['user']['id']` que Flask usaba como id de empresa.
 */
const payloadSchema = z.object({
  role: z.enum(ROLES),
  exp: z.number(),
  sub: z.string(),
})

export type SessionPayload = z.infer<typeof payloadSchema>

let secretCache: { key: Uint8Array | null } | null = null

/** Perezoso, para no leer el entorno al importar el módulo (ver `config.server.ts`). */
function getSecret(): Uint8Array | null {
  secretCache ??= {
    key: serverEnv.JWT_SECRET ? new TextEncoder().encode(serverEnv.JWT_SECRET) : null,
  }
  return secretCache.key
}

let warnedAboutMissingSecret = false

/**
 * Verifica firma + `exp` cuando hay `JWT_SECRET`.
 *
 * Sin secreto cae a decodificar el payload sin verificar: sirve para no renderizar
 * páginas prohibidas, pero **no es una comprobación de seguridad**. El backend sigue
 * siendo la autoridad en cada llamada de API. Ver docs/api-contract.md §12.
 */
export async function verifyAuthToken(token: string | undefined): Promise<SessionPayload | null> {
  if (!token) return null

  const secret = getSecret()

  try {
    if (secret) {
      const { payload } = await jwtVerify(token, secret)
      return payloadSchema.parse(payload)
    }

    if (!warnedAboutMissingSecret) {
      warnedAboutMissingSecret = true
      console.warn(
        '[auth] JWT_SECRET no configurado: el gating de rutas no verifica la firma del token.',
      )
    }
    const payload = payloadSchema.parse(decodeJwt(token))
    return payload.exp * 1000 > Date.now() ? payload : null
  } catch {
    return null
  }
}

/** Ruta inicial de cada rol, para redirigir tras login o ante un rol equivocado. */
export function homeForRole(role: Role): string {
  return role === 'super_admin' ? '/admin' : '/empresa'
}
