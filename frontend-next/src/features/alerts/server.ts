import { alertTypesListSchema, type AlertType } from '@/features/alert-types/types'
import { apiFetch } from '@/lib/api/server'

import { alertsPageSchema, type AlertStatus, type AlertsPage } from './types'

export async function fetchEmpresaAlerts(
  empresaId: string,
  status: AlertStatus,
  page = 1,
  limit = 8,
): Promise<AlertsPage> {
  const offset = (page - 1) * limit
  const endpoint =
    status === 'active'
      ? `/api/mqtt-alerts/empresa/${empresaId}/active-by-sede?limit=${limit}&offset=${offset}`
      : `/api/mqtt-alerts/inactive?empresaId=${empresaId}&limit=${limit}&offset=${offset}`
  return alertsPageSchema.parse(await apiFetch<unknown>(endpoint))
}

export async function fetchEmpresaAlertTypes(empresaId: string): Promise<AlertType[]> {
  const raw = await apiFetch<unknown>(
    `/api/tipos-alarma/empresa/${empresaId}/todos?solo_activos=true`,
  )
  return alertTypesListSchema.parse(raw).data.filter((type) => type.activo)
}
