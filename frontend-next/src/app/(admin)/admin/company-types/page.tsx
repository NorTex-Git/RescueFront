import type { Metadata } from 'next'

import { CompanyTypesView } from '@/features/company-types/components/company-types-view'
import { companyTypesListSchema } from '@/features/company-types/types'
import { apiFetch } from '@/lib/api/server'

export const metadata: Metadata = {
  title: 'Tipos de Empresa — RESCUE',
}

export default async function CompanyTypesPage() {
  const tipos = await apiFetch<unknown>('/api/tipos_empresa/dashboard/all')
    .then((raw) => companyTypesListSchema.parse(raw).data)
    .catch(() => [])

  // La cabecera la pinta `CrudView`: el contador y el botón "Nuevo" van dentro de ella
  // y necesitan estado de cliente.
  return (
    <div className="mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-8">
      <CompanyTypesView initialData={tipos} />
    </div>
  )
}
