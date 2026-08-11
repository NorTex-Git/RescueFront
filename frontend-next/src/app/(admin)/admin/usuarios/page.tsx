import type { Metadata } from 'next'

import { AdminUsuariosView } from '@/features/usuarios/components/admin-usuarios-view'
import { fetchEmpresas } from '@/features/empresas/server'
import { fetchRoles, fetchUsuarios } from '@/features/usuarios/server'
import type { LoadResult } from '@/load-result'
import { preload } from '@/preload'

export const metadata: Metadata = {
  title: 'Usuarios — RESCUE',
}

export default async function AdminUsuariosPage() {
  const empresasLoad = await preload('empresas para usuarios', () =>
    fetchEmpresas().then((empresas) =>
      empresas.map((empresa) => ({ value: empresa._id, label: empresa.nombre })),
    ),
  )
  const options = empresasLoad.ok ? empresasLoad.data : []

  // Se precarga la primera para que la pantalla no llegue vacía esperando un fetch
  // de cliente. Las demás se piden al cambiar el selector.
  const initialEmpresaId = options[0]?.value ?? ''

  const [usuariosLoad, rolesLoad]: [LoadResult<Awaited<ReturnType<typeof fetchUsuarios>>>, LoadResult<string[]>] = initialEmpresaId
    ? await Promise.all([
        preload('usuarios', () => fetchUsuarios(initialEmpresaId)),
        preload('roles de empresa', () => fetchRoles(initialEmpresaId)),
      ])
    : [{ ok: true, data: [] }, { ok: true, data: [] }]

  return (
    <div className="mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-8">
      <AdminUsuariosView
        empresasLoad={empresasLoad}
        initialEmpresaId={initialEmpresaId}
        initialRolesLoad={rolesLoad}
        initialLoad={usuariosLoad}
      />
    </div>
  )
}
