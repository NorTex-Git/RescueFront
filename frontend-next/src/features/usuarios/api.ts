import { apiRequest } from '@/lib/api/client'

import { normalizeEmpresaRoles } from './roles'
import type { UsuarioFormValues } from './schema'
import { usuariosListSchema, type Usuario } from './types'

/**
 * CRUD de usuarios. **Una sola implementación para admin y empresa**: verificado que
 * `usuarios-modals.js` estaba duplicado en los dos portales con 38 líneas distintas de
 * ~1520, y las diferencias eran solo nombres de variable.
 *
 * Rutas del backend confirmadas contra el servidor real: la familia buena es
 * `/empresas/{empresaId}/usuarios`. Los endpoints globales `/api/usuarios` y
 * `/api/users/empresa/{id}` que usaban los clientes viejos responden **404**.
 * Ver docs/api-contract.md.
 */

const base = (empresaId: string) => `/empresas/${encodeURIComponent(empresaId)}/usuarios`

export async function listUsuarios(empresaId: string, includeInactive = false): Promise<Usuario[]> {
  const path = includeInactive ? `${base(empresaId)}/including-inactive` : base(empresaId)
  const raw = await apiRequest<unknown>(path)
  return usuariosListSchema.parse(raw).data
}

/**
 * Roles de la empresa, desde el cliente. Los necesita el portal admin al cambiar de
 * empresa en el selector: alimentan el select del formulario y el filtro por rol.
 *
 * `/api/empresas/{id}`, con prefijo, a diferencia de las rutas de usuarios de arriba:
 * el detalle de empresa vive en otro blueprint. Sin él responde 404.
 */
export async function fetchEmpresaRolesClient(empresaId: string): Promise<string[]> {
  const raw = await apiRequest<{ data?: { roles?: unknown } }>(
    `/api/empresas/${encodeURIComponent(empresaId)}`,
  )
  return normalizeEmpresaRoles(raw.data?.roles)
}

export async function createUsuario(empresaId: string, values: UsuarioFormValues): Promise<void> {
  await apiRequest(base(empresaId), { method: 'POST', body: values })
}

export async function updateUsuario(
  empresaId: string,
  usuarioId: string,
  values: UsuarioFormValues,
): Promise<void> {
  await apiRequest(`${base(empresaId)}/${usuarioId}`, { method: 'PUT', body: values })
}

export async function deleteUsuario(empresaId: string, usuarioId: string): Promise<void> {
  await apiRequest(`${base(empresaId)}/${usuarioId}`, { method: 'DELETE' })
}

export async function toggleUsuarioStatus(
  empresaId: string,
  usuarioId: string,
  activo: boolean,
): Promise<void> {
  await apiRequest(`${base(empresaId)}/${usuarioId}/toggle-status`, {
    method: 'PATCH',
    body: { activo },
  })
}
