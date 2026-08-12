import 'server-only'

import { z } from 'zod'

import { API_PREFIX } from './config'

/**
 * Equivalente de `utils/config.py`. Valida el entorno una sola vez al arrancar y falla
 * ruidosamente si falta algo obligatorio, en vez de reventar en runtime.
 *
 * `server-only` hace que el build falle si un Client Component importa este módulo,
 * en vez de romper en el navegador con un `undefined` difícil de rastrear.
 */

const serverSchema = z.object({
  BACKEND_API_URL: z.url(),
  IMAGES_SERVICE_BASE_URL: z.url(),
  /**
   * Secreto para verificar la firma del `auth_token` con jose.
   * Opcional a propósito: hoy no está en los .env del backend. Sin él, el gating
   * de `proxy.ts` es optimista (solo lee el payload). Ver docs/api-contract.md §12.
   */
  JWT_SECRET: z
    // Una variable declarada pero vacía (`JWT_SECRET=` en el .env, o `${JWT_SECRET}`
    // sin valor en compose) cuenta como ausente, no como secreto inválido.
    .preprocess((value) => (value === '' ? undefined : value), z.string().min(16).optional()),
  NODE_ENV: z.enum(['development', 'test', 'production']).default('development'),

  // Contacto — opcionales, se sirven desde un Server Component (no en HTML global)
  RECIPIENT_EMAIL: z.string().default(''),
  COMPANY_PHONE: z.string().default(''),
  EMAIL_SUBJECT: z.string().default(''),
  WHATSAPP_MESSAGE: z.string().default(''),
  EMAIL_BODY_MESSAGE: z.string().default(''),
})

type ServerEnv = z.infer<typeof serverSchema>

let cached: ServerEnv | null = null

function parseServerEnv(): ServerEnv {
  if (cached) return cached

  const result = serverSchema.safeParse(process.env)
  if (!result.success) {
    const detail = result.error.issues
      .map((issue) => `  ${issue.path.join('.')}: ${issue.message}`)
      .join('\n')
    throw new Error(`Configuración de entorno inválida (servidor):\n${detail}`)
  }

  cached = result.data
  return cached
}

/**
 * La validación es **perezosa**: corre en el primer acceso a una variable, no al
 * importar el módulo.
 *
 * Sin esto, `next build` fallaría al recolectar las páginas porque en la máquina de
 * build no existen `BACKEND_API_URL` ni `IMAGES_SERVICE_BASE_URL` — y la salida fácil
 * sería inventarse valores de relleno en el Dockerfile, que es justo lo que no
 * queremos. Así el build no necesita el entorno de producción y el arranque en
 * runtime sigue fallando ruidosamente si falta algo.
 */
export const serverEnv = new Proxy({} as ServerEnv, {
  get: (_target, key: string) => parseServerEnv()[key as keyof ServerEnv],
})

export function isProduction(): boolean {
  return parseServerEnv().NODE_ENV === 'production'
}

export function getPublicContactConfig() {
  const env = parseServerEnv()
  return {
    recipientEmail: env.RECIPIENT_EMAIL,
    companyPhone: env.COMPANY_PHONE,
    emailSubject: env.EMAIL_SUBJECT,
    whatsappMessage: env.WHATSAPP_MESSAGE,
    emailBodyMessage: env.EMAIL_BODY_MESSAGE,
    apiUrl: `${API_PREFIX}/api/contact/send`,
  }
}
