import type { Metadata } from 'next'

import { AlertsView } from '@/features/alerts/components/alerts-view'
import { fetchEmpresaAlerts, fetchEmpresaAlertTypes } from '@/features/alerts/server'
import { fetchEmpresa } from '@/features/empresas/server'
import { empresaIdFrom, requireSession } from '@/lib/auth/session'

export const metadata: Metadata = { title: 'Alertas activas — RESCUE' }

export default async function AlertasPage() {
  const session = await requireSession()
  const empresaId = empresaIdFrom(session)
  const [empresa, initialPage, alertTypes] = await Promise.all([
    fetchEmpresa(empresaId),
    fetchEmpresaAlerts(empresaId, 'active'),
    fetchEmpresaAlertTypes(empresaId),
  ])

  return (
    <AlertsView
      empresaId={empresaId}
      empresaNombre={empresa.nombre}
      sedes={empresa.sedes}
      status="active"
      initialPage={initialPage}
      alertTypes={alertTypes}
    />
  )
}
