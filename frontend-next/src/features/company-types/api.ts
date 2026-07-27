import { apiRequest } from '@/lib/api/client'

import type { CompanyTypeFormValues } from './schema'
import { companyTypesListSchema, type CompanyType } from './types'

/**
 * CRUD de tipos de empresa. Ojo con el guion bajo: la ruta es `tipos_empresa`, a
 * diferencia de `tipos-alarma`. No normalizar (ver docs/api-contract.md §5).
 */
const BASE = '/api/tipos_empresa'

function toPayload(values: CompanyTypeFormValues) {
  return {
    nombre: values.nombre,
    descripcion: values.descripcion ?? '',
    caracteristicas: values.caracteristicas,
  }
}

export async function listCompanyTypes(): Promise<CompanyType[]> {
  // `dashboard/all` trae activos e inactivos, que es lo que necesita la tabla.
  const raw = await apiRequest<unknown>(`${BASE}/dashboard/all`)
  return companyTypesListSchema.parse(raw).data
}

export async function createCompanyType(values: CompanyTypeFormValues): Promise<void> {
  await apiRequest(BASE, { method: 'POST', body: toPayload(values) })
}

export async function updateCompanyType(id: string, values: CompanyTypeFormValues): Promise<void> {
  await apiRequest(`${BASE}/${id}`, { method: 'PUT', body: toPayload(values) })
}

/**
 * Activa o desactiva. El backend no recibe cuerpo: invierte el estado actual
 * (`tipo_empresa_controller.py:103`).
 *
 * Es la única forma de dar de baja un tipo. No existe `deleteCompanyType` a
 * propósito: `DELETE /tipos_empresa/<id>` es un soft delete que hace
 * `{"$set": {"activo": False}}` —lo mismo que esto— y filtra por `activo: True`,
 * así que sobre un tipo ya inactivo responde 404
 * (`repositories/tipo_empresa_repository.py:161`).
 */
export async function toggleCompanyTypeStatus(id: string): Promise<void> {
  await apiRequest(`${BASE}/${id}/toggle-status`, { method: 'PATCH' })
}
