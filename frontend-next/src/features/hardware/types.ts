import { z } from 'zod'

const physicalStatusSchema = z
  .union([z.string(), z.record(z.string(), z.unknown())])
  .nullish()

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
  // URLs de mapa que guarda el backend: Google Maps y el embed de OpenStreetMap.
  direccion_url: z.string().nullish(),
  direccion_open_maps: z.string().nullish(),
  topic: z.string().nullish(),
  // `catch`: si el backend manda `activa` como null/string en vez de boolean, no se
  // descarta el registro entero — se asume activo.
  activa: z.boolean().catch(true),
  fecha_creacion: z.string().nullish(),
  // El software de monitoreo envía un objeto (estado, updated_at, IP, métricas...);
  // algunos registros históricos contienen solamente el texto del estado.
  physical_status: physicalStatusSchema,
  datos: z.unknown().optional(),
})

export type Hardware = z.infer<typeof hardwareSchema>

export const hardwareListSchema = z.object({
  // `optional`: algunas respuestas del listado omiten el envoltorio `success`.
  success: z.boolean().optional(),
  data: z.array(hardwareSchema).default([]),
})

/**
 * Valida el contrato completo. Una fila inválida hace fallar la carga para evitar que
 * un inventario parcial se presente como si fuera correcto.
 */
export function parseHardwareList(raw: unknown): Hardware[] {
  return Array.isArray(raw)
    ? z.array(hardwareSchema).parse(raw)
    : hardwareListSchema.parse(raw).data
}

export type HardwareCoords = { lat: number; lng: number; zoom: number }

function parseMapUrl(url: string | null | undefined): HardwareCoords | null {
  if (!url) return null
  // OSM: .../#map=15/6.25/-75.56
  let m = url.match(/#map=(\d+)\/(-?\d+\.?\d*)\/(-?\d+\.?\d*)/)
  if (m) return { zoom: Number(m[1]), lat: Number(m[2]), lng: Number(m[3]) }
  // Google Maps: /@6.25,-75.56,15z
  m = url.match(/@(-?\d+\.?\d*),(-?\d+\.?\d*),(\d+)z/)
  if (m) return { lat: Number(m[1]), lng: Number(m[2]), zoom: Number(m[3]) }
  // Google Maps: ?q=6.25,-75.56  ó  /search/6.25,-75.56
  m = url.match(/(?:[?&]q=|search\/)(-?\d+\.?\d*),(-?\d+\.?\d*)/)
  if (m) return { lat: Number(m[1]), lng: Number(m[2]), zoom: 15 }
  // Último recurso: cualquier par lat,lng plausible.
  m = url.match(/(-?\d+\.\d+),\s*(-?\d+\.\d+)/)
  if (m) {
    const lat = Number(m[1])
    const lng = Number(m[2])
    if (lat >= -90 && lat <= 90 && lng >= -180 && lng <= 180) return { lat, lng, zoom: 15 }
  }
  return null
}

/** Coordenadas del equipo, si el backend guardó alguna URL de mapa (OSM tiene prioridad). */
export function hardwareCoords(item: Hardware): HardwareCoords | null {
  return parseMapUrl(item.direccion_open_maps) ?? parseMapUrl(item.direccion_url)
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

function statusText(value: unknown): string {
  if (typeof value === 'string') return value
  if (!value || typeof value !== 'object' || Array.isArray(value)) return ''

  const status = value as Record<string, unknown>
  return typeof status.estado === 'string'
    ? status.estado
    : typeof status.status === 'string'
      ? status.status
      : ''
}

/** Estados que reporta el monitor externo cuando el equipo deja de responder. */
const OFFLINE_PHYSICAL_STATES = ['inactivo', 'inactive', 'desactivado', 'offline']

/** El equipo dejó de reportar (offline), según el estado físico del monitor. */
export function isHardwareOffline(item: Hardware): boolean {
  return OFFLINE_PHYSICAL_STATES.includes(physicalStatusOf(item).trim().toLowerCase())
}

/** Marca de tiempo del último cambio de estado físico, si el monitor la guardó. */
export function physicalStatusUpdatedAt(item: Hardware): string | null {
  const status = item.physical_status
  if (status && typeof status === 'object' && !Array.isArray(status)) {
    const updated = (status as Record<string, unknown>).updated_at
    if (typeof updated === 'string') return updated
  }
  return null
}

/** Estado reportado por el monitor externo, no el flag administrativo `activa`. */
export function physicalStatusOf(item: Hardware): string {
  const outer = item.datos && typeof item.datos === 'object' ? (item.datos as Record<string, unknown>) : {}
  const data = outer.datos && typeof outer.datos === 'object' ? (outer.datos as Record<string, unknown>) : outer

  return (
    statusText(item.physical_status) ||
    statusText(data.physical_status) ||
    statusText(data.physicalStatus) ||
    statusText(data.estado_fisico)
  )
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
    physicalStatus: physicalStatusOf(item),
  }
}
