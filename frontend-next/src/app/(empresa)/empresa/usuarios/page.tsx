import type { Metadata } from 'next'

import { UsuariosView } from '@/features/usuarios/components/usuarios-view'
import { fetchRoles, fetchUsuarios } from '@/features/usuarios/server'
import { empresaIdFrom, requireSession } from '@/lib/auth/session'
import { preload } from '@/preload'

export const metadata: Metadata = {
  title: 'Usuarios — RESCUE',
}

export default async function UsuariosPage() {
  const session = await requireSession()
  const empresaId = empresaIdFrom(session)

  // En paralelo: son independientes y así la página no espera dos viajes en serie.
  const [usuariosLoad, rolesLoad] = await Promise.all([
    preload('usuarios', () => fetchUsuarios(empresaId)),
    preload('roles de empresa', () => fetchRoles(empresaId)),
  ])

  // La cabecera la pinta `CrudView`: el contador y el botón "Nuevo" van dentro de ella
  // y necesitan estado de cliente.
  return (
    <div className="mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-8">
      <UsuariosView
        empresaId={empresaId}
        empresaNombre={session.displayName}
        rolesLoad={rolesLoad}
        initialLoad={usuariosLoad}
      />
    </div>
  )
}
