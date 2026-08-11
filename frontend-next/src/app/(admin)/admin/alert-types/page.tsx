import type { Metadata } from 'next'

import { AlertTypesView } from '@/features/alert-types/components/alert-types-view'
import { fetchAlertLevels, fetchAlertTypes } from '@/features/alert-types/server'
import { fetchEmpresas } from '@/features/empresas/server'
import { fetchMediaCatalog } from '@/features/media/server'
import { preload } from '@/preload'

export const metadata: Metadata = {
  title: 'Tipos de Alerta — RESCUE',
}

export default async function AlertTypesPage() {
  // El catálogo multimedia se carga junto con la vista, no al abrir el formulario.
  const [tiposLoad, nivelesLoad, empresasLoad, mediaCatalogLoad] = await Promise.all([
    preload('tipos de alerta', fetchAlertTypes),
    preload('niveles de alerta', fetchAlertLevels),
    preload('empresas para alertas', () =>
      fetchEmpresas().then((empresas) =>
        empresas.map((empresa) => ({ value: empresa._id, label: empresa.nombre })),
      ),
    ),
    preload('catálogo multimedia', fetchMediaCatalog),
  ])

  return (
    <div className="mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-8">
      <AlertTypesView
        nivelesLoad={nivelesLoad}
        empresasLoad={empresasLoad}
        initialLoad={tiposLoad}
        mediaCatalogLoad={mediaCatalogLoad}
      />
    </div>
  )
}
