import { extractErrorMessage } from '@/lib/api/errors'
import { apiFetch } from '@/lib/api/server'

import { mapStatistics, statisticsResponseSchema, type EmpresaStatistics } from './types'

/**
 * Estadísticas de una empresa. Equivale a `empresa_stats()` de `app.py:1445`, pero
 * sin la duplicación de datos por defecto: si el backend falla, devolvemos el error
 * y la página lo muestra, en vez de renderizar ceros como si fueran datos reales
 * (que es lo que hacía Flask y confundía al usuario).
 */
export async function getEmpresaStatistics(
  empresaId: string,
  fallbackNombre: string,
): Promise<{ data: EmpresaStatistics; error: null } | { data: null; error: string }> {
  try {
    const raw = await apiFetch<unknown>(`/api/empresas/${empresaId}/statistics`)
    const parsed = statisticsResponseSchema.safeParse(raw)

    if (!parsed.success) {
      return { data: null, error: 'La respuesta del servidor no tiene el formato esperado.' }
    }
    if (!parsed.data.success) {
      return {
        data: null,
        error: extractErrorMessage(raw, 'No se pudieron cargar las estadísticas.'),
      }
    }

    return {
      data: mapStatistics(parsed.data.data, { id: empresaId, nombre: fallbackNombre }),
      error: null,
    }
  } catch (error) {
    return {
      data: null,
      error: error instanceof Error ? error.message : 'Error al contactar el servidor.',
    }
  }
}
