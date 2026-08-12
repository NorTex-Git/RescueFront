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

function asRecord(value: unknown): Record<string, unknown> {
  return value && typeof value === 'object' && !Array.isArray(value)
    ? (value as Record<string, unknown>)
    : {}
}

function asText(value: unknown): string | null {
  return typeof value === 'string' && value.trim() ? value : null
}

/** Contacto notificado, con su estado de "embarcado" (en camino) reportado por el móvil. */
export type AlertContact = { nombre: string | null; numero: string | null; embarcado: boolean | null }

export function alertContacts(alert: Alert): AlertContact[] {
  return alert.numeros_telefonicos.map((raw) => {
    const contact = asRecord(raw)
    return {
      nombre: asText(contact.nombre),
      numero: asText(contact.numero) ?? asText(contact.telefono),
      embarcado: typeof contact.embarcado === 'boolean' ? contact.embarcado : null,
    }
  })
}

/** Ubicación de la alerta: dirección + URLs de mapa (OSM y Google) que guarda el backend. */
export type AlertLocation = {
  direccion: string | null
  osmUrl: string | null
  googleUrl: string | null
}

export function alertLocation(alert: Alert): AlertLocation {
  const ubicacion = alert.ubicacion
  return {
    direccion: asText(ubicacion.direccion),
    osmUrl: asText(ubicacion.url_open_maps),
    googleUrl: asText(ubicacion.url_maps),
  }
}

/** Nombre/origen de quién o qué activó la alerta (usuario móvil, botonera, central). */
export function alertOrigin(alert: Alert): string | null {
  const activacion = alert.activacion_alerta
  const botonera = asRecord(alert.data.botonera_ubicacion)
  return (
    asText(activacion.nombre) ||
    asText(botonera.hardware_nombre) ||
    asText(alert.hardware_nombre) ||
    asText(alert.data.origen)
  )
}
