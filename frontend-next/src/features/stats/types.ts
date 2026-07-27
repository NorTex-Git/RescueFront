import { z } from 'zod'

/**
 * Respuesta cruda de `GET /api/empresas/{id}/statistics`.
 *
 * Todo opcional a propósito: el backend no garantiza qué campos vienen y el código
 * Flask usaba `.get(..., 0)` en cada nivel (`app.py:1509-1547`). Con `catch` de Zod
 * un campo con forma inesperada no tumba la página entera.
 */
const numeric = z.coerce.number().catch(0)

const rawStatisticsSchema = z.object({
  empresa: z
    .object({
      id: z.union([z.string(), z.number()]).optional(),
      nombre: z.string().optional(),
      activa: z.boolean().optional(),
      fecha_creacion: z.string().optional(),
      ultima_actividad: z.string().optional(),
    })
    .optional(),
  usuarios: z
    .object({
      total_usuarios: numeric.optional(),
      usuarios_activos: numeric.optional(),
      usuarios_inactivos: numeric.optional(),
    })
    .optional(),
  hardware: z
    .object({
      total_hardware: numeric.optional(),
      hardware_activo: numeric.optional(),
      hardware_inactivo: numeric.optional(),
      por_tipo: z.record(z.string(), numeric).optional(),
    })
    .optional(),
  alertas: z
    .object({
      total_alertas: numeric.optional(),
      alertas_activas: numeric.optional(),
      alertas_inactivas: numeric.optional(),
      alertas_recientes_30d: numeric.optional(),
      alertas_por_prioridad: z.record(z.string(), numeric).optional(),
    })
    .optional(),
})

export const statisticsResponseSchema = z.object({
  success: z.boolean(),
  data: rawStatisticsSchema.optional(),
  message: z.string().optional(),
})

/** Forma que consume la UI, ya normalizada. */
export type EmpresaStatistics = {
  empresa: { id: string; nombre: string; activa: boolean; fechaCreacion: string }
  usuarios: { total: number; activos: number; inactivos: number }
  hardware: { total: number; activos: number; inactivos: number; porTipo: Record<string, number> }
  alertas: {
    total: number
    activas: number
    resueltas: number
    porPrioridad: Record<string, number>
  }
  actividadReciente: { logsUltimos30Dias: number; ultimaActividad: string | null }
}

/**
 * Traduce la respuesta del backend a la forma de la UI.
 *
 * Este mapeo es lógica de negocio real, no boilerplate: los nombres difieren
 * (`total_usuarios` → `usuarios.total`) y estaba enterrado en `app.py:1509`.
 */
export function mapStatistics(
  raw: z.infer<typeof rawStatisticsSchema> | undefined,
  fallback: { id: string; nombre: string },
): EmpresaStatistics {
  return {
    empresa: {
      id: String(raw?.empresa?.id ?? fallback.id),
      nombre: raw?.empresa?.nombre ?? fallback.nombre,
      activa: raw?.empresa?.activa ?? true,
      fechaCreacion: raw?.empresa?.fecha_creacion ?? '',
    },
    usuarios: {
      total: raw?.usuarios?.total_usuarios ?? 0,
      activos: raw?.usuarios?.usuarios_activos ?? 0,
      inactivos: raw?.usuarios?.usuarios_inactivos ?? 0,
    },
    hardware: {
      total: raw?.hardware?.total_hardware ?? 0,
      activos: raw?.hardware?.hardware_activo ?? 0,
      inactivos: raw?.hardware?.hardware_inactivo ?? 0,
      porTipo: raw?.hardware?.por_tipo ?? {},
    },
    alertas: {
      total: raw?.alertas?.total_alertas ?? 0,
      activas: raw?.alertas?.alertas_activas ?? 0,
      resueltas: raw?.alertas?.alertas_inactivas ?? 0,
      porPrioridad: raw?.alertas?.alertas_por_prioridad ?? {},
    },
    actividadReciente: {
      logsUltimos30Dias: raw?.alertas?.alertas_recientes_30d ?? 0,
      ultimaActividad: raw?.empresa?.ultima_actividad ?? null,
    },
  }
}
