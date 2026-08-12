import { z } from 'zod'

/**
 * Forma según `RescueBack/models/tipo_alarma.py:to_json()`.
 *
 * Un tipo de alarma pertenece a una empresa. Los que no traen `empresa_id` son los
 * "globales", que el backend puede excluir con `?exclude_globales=`.
 */
export const alertTypeSchema = z.object({
  _id: z.string(),
  nombre: z.string().default(''),
  descripcion: z.string().nullish(),
  tipo_alerta: z.string().default(''),
  color_alerta: z.string().nullish(),
  imagen_base64: z.string().nullish(),
  sonido_link: z.string().nullish(),
  recomendaciones: z.array(z.string()).default([]),
  implementos_necesarios: z.array(z.string()).default([]),
  empresa_id: z.string().nullish(),
  activo: z.boolean().default(true),
  fecha_creacion: z.string().nullish(),
})

export type AlertType = z.infer<typeof alertTypeSchema>

/** Global = sin empresa. El backend excluye estos con `?exclude_globales=`. */
export function isGlobalAlertType(type: Pick<AlertType, 'empresa_id'>): boolean {
  return !type.empresa_id
}

/**
 * El listado global responde `{ success, data, pagination }` y el de empresa
 * `{ success, data, count }`. Los dos campos son opcionales para cubrir ambos.
 */
export const alertTypesListSchema = z.object({
  success: z.boolean(),
  data: z.array(alertTypeSchema).default([]),
  count: z.number().optional(),
  pagination: z
    .object({ page: z.number(), limit: z.number(), pages: z.number(), total: z.number() })
    .optional(),
})

/** `/tipos-alarma/tipos-alerta` devuelve el enum; no se escribe a mano en el front. */
export const alertLevelsSchema = z.object({
  success: z.boolean(),
  data: z.array(z.string()).default([]),
})
