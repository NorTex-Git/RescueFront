import { apiRequest } from '@/lib/api/client'

import type { HardwareFormValues } from './schema'
import { hardwareListSchema, type Hardware } from './types'

const BASE = '/api/hardware'

function toPayload(values: HardwareFormValues) {
  return {
    nombre: values.nombre,
    tipo: values.tipo,
    empresa_id: values.empresa_id,
    empresa_nombre: values.empresa_nombre,
    sede: values.sede,
    direccion: values.direccion,
    datos: { datos: {
      brand: values.brand, model: values.model, price: values.price, stock: values.stock,
      status: values.status, warranty: values.warranty, description: values.description,
    } },
  }
}

export async function listHardware(): Promise<Hardware[]> {
  const raw = await apiRequest<unknown>(`${BASE}/all-including-inactive`)
  return hardwareListSchema.parse(raw).data
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
