'use client'

import type { AlertType } from '@/features/alert-types/types'
import { apiRequest } from '@/lib/api/client'

import { alertsPageSchema, type AlertStatus, type AlertsPage, type CreateAlertInput } from './types'

export async function listEmpresaAlerts(
  empresaId: string,
  status: AlertStatus,
  page: number,
  limit = 8,
): Promise<AlertsPage> {
  const offset = (page - 1) * limit
  const endpoint =
    status === 'active'
      ? `/api/mqtt-alerts/empresa/${empresaId}/active-by-sede?limit=${limit}&offset=${offset}`
      : `/api/mqtt-alerts/inactive?empresaId=${empresaId}&limit=${limit}&offset=${offset}`
  return alertsPageSchema.parse(await apiRequest<unknown>(endpoint))
}

export async function createEmpresaAlert(
  empresaId: string,
  input: CreateAlertInput,
  type: AlertType,
) {
  return apiRequest('/api/mqtt-alerts/user-alert', {
    method: 'POST',
    body: {
      creador: {
        empresa_id: empresaId,
        tipo: 'empresa',
        sede: input.sede,
        direccion: input.direccion,
      },
      descripcion: input.descripcion,
      prioridad: input.prioridad,
      tipo_alerta_id: type._id,
      tipo_alerta: type.tipo_alerta,
      tipo_alerta_nombre: type.nombre,
      tipo_alerta_color: type.color_alerta,
      nombre_alerta: type.nombre,
      image_alert: type.imagen_base64,
      elementos_necesarios: type.implementos_necesarios,
      instrucciones: type.recomendaciones,
    },
  })
}

export async function deactivateEmpresaAlert(alertId: string, empresaId: string, message: string) {
  return apiRequest('/api/mqtt-alerts/user-alert/deactivate', {
    method: 'PUT',
    body: {
      alert_id: alertId,
      desactivado_por_id: empresaId,
      desactivado_por_tipo: 'empresa',
      mensaje_desactivacion: message || undefined,
    },
  })
}
