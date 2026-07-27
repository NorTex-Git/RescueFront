import type { FieldOption } from '@/components/ui/form-field'
import { companyTypesListSchema } from '@/features/company-types/types'
import { apiFetch } from '@/lib/api/server'

import { empresasListSchema, type Empresa } from './types'

/** Carga inicial del listado, incluyendo inactivas para poder reactivarlas. */
export async function fetchEmpresas(): Promise<Empresa[]> {
  const raw = await apiFetch<unknown>('/api/empresas/dashboard/all')
  return empresasListSchema.parse(raw).data
}

/**
 * Tipos de empresa para el select del formulario.
 *
 * Solo los activos (`/activos`): un tipo dado de baja no debería poder asignarse a
 * una empresa nueva, aunque las que ya lo tienen lo conserven.
 */
export async function fetchTipoOptions(): Promise<FieldOption[]> {
  const raw = await apiFetch<unknown>('/api/tipos_empresa/activos')
  return companyTypesListSchema
    .parse(raw)
    .data.map((tipo) => ({ value: tipo._id, label: tipo.nombre }))
}
