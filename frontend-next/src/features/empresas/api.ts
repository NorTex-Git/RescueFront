import { apiRequest } from '@/lib/api/client'

import type { EmpresaFormValues } from './schema'
import { empresasListSchema, type Empresa } from './types'

/**
 * CRUD de empresas. Rutas de `core/routes.py:54` en adelante.
 *
 * `creado_por` no se envía: el backend lo saca del token del super admin
 * (`empresa_controller.py:28`).
 */
const BASE = '/api/empresas'

function toPayload(values: EmpresaFormValues) {
  return {
    nombre: values.nombre,
    descripcion: values.descripcion,
    ubicacion: values.ubicacion,
    username: values.username,
    email: values.email,
    sedes: values.sedes,
    roles: values.roles,
    // Cadena vacía significa "sin tipo": mandarla haría fallar el `ObjectId()`.
    ...(values.tipo_empresa_id ? { tipo_empresa_id: values.tipo_empresa_id } : {}),
    // Al editar, en blanco conserva la actual, así que ni se manda.
    ...(values.password ? { password: values.password } : {}),
  }
}

export async function listEmpresas(): Promise<Empresa[]> {
  // `dashboard/all` incluye inactivas, que es lo que necesita la tabla para poder
  // reactivarlas. `GET /api/empresas` a secas solo trae las activas.
  const raw = await apiRequest<unknown>(`${BASE}/dashboard/all`)
  return empresasListSchema.parse(raw).data
}

export async function createEmpresa(values: EmpresaFormValues): Promise<void> {
  await apiRequest(BASE, { method: 'POST', body: toPayload(values) })
}

export async function updateEmpresa(id: string, values: EmpresaFormValues): Promise<void> {
  await apiRequest(`${BASE}/${id}`, { method: 'PUT', body: toPayload(values) })
}

/**
 * Activa o desactiva. A diferencia de tipos de empresa, **este sí recibe cuerpo**:
 * `{activa}` con el estado deseado, no un conmutador (`empresa_controller.py:377`).
 *
 * No hay `deleteEmpresa`: `DELETE /api/empresas/<id>` llama a `soft_delete()`, que
 * solo pone `activa: False` (`empresa_service.py:342`). Es esto mismo con otro nombre.
 */
export async function toggleEmpresaStatus(id: string, activa: boolean): Promise<void> {
  await apiRequest(`${BASE}/${id}/toggle-status`, { method: 'PATCH', body: { activa } })
}
