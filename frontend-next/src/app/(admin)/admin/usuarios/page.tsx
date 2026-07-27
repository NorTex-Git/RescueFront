import type { Metadata } from 'next'

import { AdminUsuariosView } from '@/features/usuarios/components/admin-usuarios-view'
import { fetchEmpresas } from '@/features/empresas/server'
import { fetchRoles, fetchUsuarios } from '@/features/usuarios/server'

export const metadata: Metadata = {
  title: 'Usuarios — RESCUE',
}

export default async function AdminUsuariosPage() {
  const empresas = await fetchEmpresas().catch(() => [])
  const options = empresas.map((empresa) => ({ value: empresa._id, label: empresa.nombre }))

  // Se precarga la primera para que la pantalla no llegue vacía esperando un fetch
  // de cliente. Las demás se piden al cambiar el selector.
  const initialEmpresaId = options[0]?.value ?? ''

  const [usuarios, roles] = initialEmpresaId
    ? await Promise.all([
        fetchUsuarios(initialEmpresaId).catch(() => []),
        fetchRoles(initialEmpresaId).catch(() => []),
      ])
    : [[], []]

  return (
    <div className="mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-8">
      <AdminUsuariosView
        empresas={options}
        initialEmpresaId={initialEmpresaId}
        initialRoles={roles}
        initialData={usuarios}
      />
    </div>
  )
}
