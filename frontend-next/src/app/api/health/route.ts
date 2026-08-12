import { serverEnv } from '@/lib/config.server'

/**
 * Health del contenedor (Docker healthcheck). Equivale a `health_check` de `app.py:237`:
 * `healthy` solo si además el backend responde.
 */
export async function GET() {
  let backendOk = false
  try {
    const response = await fetch(`${serverEnv.BACKEND_API_URL}/health`, {
      cache: 'no-store',
      signal: AbortSignal.timeout(5_000),
    })
    backendOk = response.ok
  } catch {
    backendOk = false
  }

  return Response.json(
    {
      status: backendOk ? 'healthy' : 'degraded',
      frontend: 'running',
      backend_connection: backendOk ? 'connected' : 'disconnected',
    },
    { status: backendOk ? 200 : 503 },
  )
}
