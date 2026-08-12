import { z } from 'zod'

const unknownRecord = z.record(z.string(), z.unknown()).catch({})

export const alertSchema = z
  .object({
    _id: z.coerce.string(),
    empresa_nombre: z.string().nullish(),
    sede: z.string().nullish(),
    hardware_nombre: z.string().nullish(),
    tipo_alerta: z.string().nullish(),
    nombre_alerta: z.string().nullish(),
    descripcion: z.string().nullish(),
    prioridad: z.string().default('media'),
    image_alert: z.string().nullish(),
    elementos_necesarios: z.array(z.string()).catch([]),
    instrucciones: z.array(z.string()).catch([]),
    numeros_telefonicos: z.array(z.unknown()).catch([]),
    data: unknownRecord,
    activacion_alerta: unknownRecord,
    ubicacion: unknownRecord,
    desactivado_por: unknownRecord,
    activo: z.boolean().default(true),
    fecha_creacion: z.string().nullish(),
    fecha_actualizacion: z.string().nullish(),
    fecha_desactivacion: z.string().nullish(),
    mensaje_desactivacion: z.string().nullish(),
    contactos_count: z.coerce.number().catch(0),
  })
  .passthrough()

const paginationSchema = z
  .object({
    total_pages: z.coerce.number().catch(0),
    current_page: z.coerce.number().catch(1),
    total_items: z.coerce.number().catch(0),
    has_next: z.boolean().catch(false),
    has_prev: z.boolean().catch(false),
  })
  .catch({ total_pages: 0, current_page: 1, total_items: 0, has_next: false, has_prev: false })

export const alertsPageSchema = z.object({
  success: z.boolean(),
  data: z.array(alertSchema).default([]),
  pagination: paginationSchema,
})

export type Alert = z.infer<typeof alertSchema>
export type AlertsPage = z.infer<typeof alertsPageSchema>
export type AlertStatus = 'active' | 'inactive'

export type CreateAlertInput = {
  sede: string
  direccion: string
  tipoAlertaId: string
  descripcion: string
  prioridad: string
}
