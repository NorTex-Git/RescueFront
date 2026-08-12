import { apiFetch } from '@/lib/api/server'
import { empresaSchema } from '@/features/empresas/types'

import { normalizeEmpresaRoles } from './roles'
import type { UsuarioFormOptions } from './schema'
import { usuariosListSchema, type Usuario } from './types'

/**
 * Carga inicial del listado, para que la página llegue con datos y sin spinner.
 *
 * `including-inactive` para que coincida con lo que pide el cliente: si aquí se
 * trajeran solo los activos, el registro recién desactivado desaparecería hasta
 * el siguiente refetch y no habría manera de reactivarlo.
 */
export async function fetchUsuarios(empresaId: string): Promise<Usuario[]> {
  const raw = await apiFetch<unknown>(
    `/empresas/${encodeURIComponent(empresaId)}/usuarios/including-inactive`,
  )
  return usuariosListSchema.parse(raw).data
}

/**
 * Roles disponibles para los usuarios de una empresa.
 *
 * No son una lista fija: viven en el campo `roles` del propio documento de empresa
 * (`RescueBack/models/empresa.py:32`), y `models/usuario.py` lo dice explícitamente:
 * "El rol ya no se valida con lista fija, viene de la empresa".
 *
 * La ruta es `/api/empresas/{id}` y no `/empresas/{id}`: los usuarios cuelgan del
 * blueprint multi-tenant (`/empresas`), pero el detalle de la empresa está en el
 * blueprint de empresas (`/api/empresas`). Sin el prefijo responde 404.
 */
export async function fetchUsuarioFormOptions(empresaId: string): Promise<UsuarioFormOptions> {
  const raw = await apiFetch<{ data?: unknown }>(`/api/empresas/${encodeURIComponent(empresaId)}`)
  const empresa = empresaSchema.parse(raw.data)
  return { roles: normalizeEmpresaRoles(empresa.roles), sedes: empresa.sedes }
}

export { normalizeEmpresaRoles } from './roles'
