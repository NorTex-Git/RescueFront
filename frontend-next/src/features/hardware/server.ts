import { z } from 'zod'

import type { FieldOption } from '@/components/ui/form-field'
import { apiFetch } from '@/lib/api/server'

import { parseHardwareList, type Hardware } from './types'

export async function fetchHardware(): Promise<Hardware[]> {
  const raw = await apiFetch<unknown>('/api/hardware/all-including-inactive')
  return parseHardwareList(raw)
}

const hardwareTypesSchema = z.object({
  success: z.boolean(),
  data: z.array(z.object({ nombre: z.string().default(''), name: z.string().optional() })).default([]),
})

export async function fetchHardwareTypeOptions(): Promise<FieldOption[]> {
  const raw = await apiFetch<unknown>('/api/hardware-types')
  return hardwareTypesSchema.parse(raw).data
    .map((item) => item.nombre || item.name || '')
    .filter(Boolean)
    .map((nombre) => ({ value: nombre, label: nombre }))
}
