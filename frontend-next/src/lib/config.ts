import { z } from 'zod'

/**
 * Configuración **segura para el cliente**. Este módulo lo importan Client Components,
 * así que aquí no puede entrar ninguna variable de servidor: en el bundle del navegador
 * `process.env.BACKEND_API_URL` es `undefined` y la validación reventaría al cargar.
 *
 * Lo que solo existe en el servidor vive en `config.server.ts`.
 */

const clientSchema = z.object({
  NEXT_PUBLIC_WEBSOCKET_URL: z.url(),
})

/**
 * `process.env.NEXT_PUBLIC_*` se sustituye en build time, así que hay que
 * enumerarlas literalmente — un `process.env` a secas no funciona en el cliente.
 */
const result = clientSchema.safeParse({
  NEXT_PUBLIC_WEBSOCKET_URL: process.env.NEXT_PUBLIC_WEBSOCKET_URL,
})

if (!result.success) {
  const detail = result.error.issues
    .map((issue) => `  ${issue.path.join('.')}: ${issue.message}`)
    .join('\n')
  throw new Error(`Configuración de entorno inválida (cliente):\n${detail}`)
}

export const clientEnv = result.data

/** Prefijo del BFF. Antes era `PROXY_PREFIX` configurable; ahora es fijo. */
export const API_PREFIX = '/api'
