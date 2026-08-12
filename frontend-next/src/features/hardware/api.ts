import { apiRequest } from '@/lib/api/client'

import type { HardwareFormValues } from './schema'
import { parseHardwareList, type Hardware } from './types'

const BASE = '/api/hardware'

function toPayload(values: HardwareFormValues) {
  return {
    nombre: values.nombre,
    tipo: values.tipo,
    empresa_id: values.empresa_id,
    empresa_nombre: values.empresa_nombre,
    sede: values.sede,
    direccion: values.direccion,
    datos: {
      datos: {
        brand: values.brand,
        model: values.model,
        price: values.price,
        stock: values.stock,
        status: values.status,
        warranty: values.warranty,
        description: values.description,
      },
    },
  }
}

export async function listHardware(empresaId?: string): Promise<Hardware[]> {
  // El monitor externo actualiza `physical_status`; esta comprobación marca como
  // inactivos los equipos cuyo último reporte venció antes de volver a listarlos.
  await apiRequest(`${BASE}/physical-status/check`, { method: 'POST' })
  const endpoint = empresaId
    ? `${BASE}/empresa/${encodeURIComponent(empresaId)}/including-inactive`
    : `${BASE}/all-including-inactive`
  const raw = await apiRequest<unknown>(endpoint)
  return parseHardwareList(raw)
}

export async function createHardware(values: HardwareFormValues): Promise<void> {
  await apiRequest(BASE, { method: 'POST', body: toPayload(values) })
}

export async function updateHardware(id: string, values: HardwareFormValues): Promise<void> {
  await apiRequest(`${BASE}/${id}`, { method: 'PUT', body: toPayload(values) })
}

export async function toggleHardwareStatus(id: string, activa: boolean): Promise<void> {
  await apiRequest(`${BASE}/${id}/toggle-status`, { method: 'PATCH', body: { activa } })
}
