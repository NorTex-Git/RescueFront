import type { Metadata } from 'next'

import { EmpresasView } from '@/features/empresas/components/empresas-view'
import { fetchEmpresas, fetchTipoOptions } from '@/features/empresas/server'

export const metadata: Metadata = {
  title: 'Empresas — RESCUE',
}

export default async function EmpresasPage() {
  // En paralelo: son independientes y así la página no encadena dos viajes.
  const [empresas, tipos] = await Promise.all([
    fetchEmpresas().catch(() => []),
    fetchTipoOptions().catch(() => []),
  ])

  // La cabecera la pinta `CrudView`: el contador y el botón "Nuevo" van dentro de ella
  // y necesitan estado de cliente.
  return (
    <div className="mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-8">
      <EmpresasView initialData={empresas} tipos={tipos} />
    </div>
  )
}
