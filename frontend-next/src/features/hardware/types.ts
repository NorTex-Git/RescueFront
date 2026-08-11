import { z } from 'zod'

/** Forma tolerante del recurso: el backend ha guardado datos antiguos en varias claves. */
export const hardwareSchema = z.object({
  // `coerce`: algún registro trae el id como número/ObjectId serializado, no como string.
  _id: z.coerce.string(),
  nombre: z.string().default(''),
  tipo: z.string().nullish(),
  empresa_id: z.string().nullish(),
  empresa_nombre: z.string().nullish(),
  sede: z.string().nullish(),
  direccion: z.string().nullish(),
  topic: z.string().nullish(),
  // `catch`: si el backend manda `activa` como null/string en vez de boolean, no se
  // descarta el registro entero — se asume activo.
  activa: z.boolean().catch(true),
  fecha_creacion: z.string().nullish(),
  physical_status: z.string().nullish(),
  datos: z.unknown().optional(),
})

export type Hardware = z.infer<typeof hardwareSchema>

export const hardwareListSchema = z.object({
  // `optional`: algunas respuestas del listado omiten el envoltorio `success`.
  success: z.boolean().optional(),
  data: z.array(z.unknown()).default([]),
})

/**
 * Parseo **resiliente** del listado: valida ítem por ítem y descarta solo los que no
 * calzan, en vez de tirar toda la tabla si un único registro trae una forma inesperada
 * (que era justo lo que dejaba la lista vacía tras crear un equipo). Acepta tanto el
 * envoltorio `{ success, data }` como un array plano.
 */
export function parseHardwareList(raw: unknown): Hardware[] {
  const rows = Array.isArray(raw)
    ? raw
    : (hardwareListSchema.safeParse(raw).data?.data ?? [])

  return rows.flatMap((row) => {
    const parsed = hardwareSchema.safeParse(row)
    return parsed.success ? [parsed.data] : []
  })
}

export type HardwareDetails = {
  brand: string
  model: string
  price: number
  stock: number
  status: string
  warranty: number
  description: string
  physicalStatus: string
}

/** Unifica `datos.datos`, `datos` y los nombres en español de registros históricos. */
export function detailsOf(item: Hardware): HardwareDetails {
  const outer = item.datos && typeof item.datos === 'object' ? (item.datos as Record<string, unknown>) : {}
  const data = outer.datos && typeof outer.datos === 'object' ? (outer.datos as Record<string, unknown>) : outer
  const text = (...values: unknown[]) => values.find((value) => typeof value === 'string')?.toString() ?? ''
  const number = (...values: unknown[]) => {
    const value = values.find((candidate) => candidate !== undefined && candidate !== null && candidate !== '')
    const parsed = Number(value)
    return Number.isFinite(parsed) ? parsed : 0
  }

  return {
    brand: text(data.brand, data.marca),
    model: text(data.model, data.modelo),
    price: number(data.price, data.precio),
    stock: number(data.stock),
    status: text(data.status, data.estado) || 'available',
    warranty: number(data.warranty, data.garantia),
    description: text(data.description, data.descripcion),
    physicalStatus: text(item.physical_status, data.physical_status, data.physicalStatus, data.estado_fisico),
  }
}
