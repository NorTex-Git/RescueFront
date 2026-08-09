import { z } from 'zod'

/** Forma tolerante del recurso: el backend ha guardado datos antiguos en varias claves. */
export const hardwareSchema = z.object({
  _id: z.string(),
  nombre: z.string().default(''),
  tipo: z.string().nullish(),
  empresa_id: z.string().nullish(),
  empresa_nombre: z.string().nullish(),
  sede: z.string().nullish(),
  direccion: z.string().nullish(),
  topic: z.string().nullish(),
  activa: z.boolean().default(true),
  fecha_creacion: z.string().nullish(),
  physical_status: z.string().nullish(),
  datos: z.unknown().optional(),
})

export type Hardware = z.infer<typeof hardwareSchema>

export const hardwareListSchema = z.object({
  success: z.boolean(),
  data: z.array(hardwareSchema).default([]),
})

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
