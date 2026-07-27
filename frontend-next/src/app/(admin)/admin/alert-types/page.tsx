import type { Metadata } from 'next'

import { AlertTypesView } from '@/features/alert-types/components/alert-types-view'
import { fetchAlertLevels, fetchAlertTypes } from '@/features/alert-types/server'
import { fetchEmpresas } from '@/features/empresas/server'
import { fetchMediaCatalog } from '@/features/media/server'
import type { MediaCatalog } from '@/features/media/normalize'

export const metadata: Metadata = {
  title: 'Tipos de Alerta — RESCUE',
}

export default async function AlertTypesPage() {
  const emptyCatalog: MediaCatalog = { folders: [], filesByFolder: {} }

  // El catálogo multimedia se carga junto con la vista, no al abrir el formulario.
  const [tipos, niveles, empresas, mediaCatalog] = await Promise.all([
    fetchAlertTypes().catch(() => []),
    fetchAlertLevels().catch(() => []),
    fetchEmpresas().catch(() => []),
    fetchMediaCatalog().catch(() => emptyCatalog),
  ])

  return (
    <div className="mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-8">
      <AlertTypesView
        niveles={niveles}
        empresas={empresas.map((empresa) => ({ value: empresa._id, label: empresa.nombre }))}
        initialData={tipos}
        mediaCatalog={mediaCatalog}
      />
    </div>
  )
}
