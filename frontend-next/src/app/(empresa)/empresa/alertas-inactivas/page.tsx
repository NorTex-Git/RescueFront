import type { Metadata } from 'next'

import { AlertsView } from '@/features/alerts/components/alerts-view'
import { fetchEmpresaAlerts } from '@/features/alerts/server'
import { fetchEmpresa } from '@/features/empresas/server'
import { empresaIdFrom, requireSession } from '@/lib/auth/session'

export const metadata: Metadata = { title: 'Historial de alertas — RESCUE' }

export default async function AlertasInactivasPage() {
  const session = await requireSession()
  const empresaId = empresaIdFrom(session)
  const [empresa, initialPage] = await Promise.all([
    fetchEmpresa(empresaId),
    fetchEmpresaAlerts(empresaId, 'inactive'),
  ])

  return (
    <AlertsView
      empresaId={empresaId}
      empresaNombre={empresa.nombre}
      sedes={empresa.sedes}
      status="inactive"
      initialPage={initialPage}
      alertTypes={[]}
    />
  )
}
