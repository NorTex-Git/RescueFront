import {
  isHardwareOffline,
  parseHardwareList,
  physicalStatusUpdatedAt,
  type Hardware,
} from '@/features/hardware/types'
import { API_PREFIX } from '@/lib/config'

import type { AlertNotification, HardwareNotification, NotificationFeed } from './types'

/** Proyecta un equipo a la notificación mínima que muestra el centro de notificaciones. */
export function hardwareToNotification(item: Hardware): HardwareNotification {
  return {
    _id: item._id,
    nombre: item.nombre || 'Equipo',
    tipo: item.tipo ?? undefined,
    sede: item.sede ?? undefined,
    empresa_nombre: item.empresa_nombre ?? undefined,
    fecha: physicalStatusUpdatedAt(item) ?? undefined,
  }
}

/** Equipos actualmente inactivos (offline) y registrados (activa).
 *
 * Con `empresaId` (portal empresa) se acota a esa empresa; sin él (admin) trae todo el
 * hardware del sistema (endpoint de super admin).
 */
export async function fetchHardwareNotifications(empresaId?: string): Promise<HardwareNotification[]> {
  const endpoint = empresaId
    ? `/api/hardware/empresa/${encodeURIComponent(empresaId)}/including-inactive`
    : `/api/hardware/all-including-inactive`
  const response = await fetch(`${API_PREFIX}${endpoint}`, {
    credentials: 'same-origin',
    cache: 'no-store',
  })
  if (!response.ok) throw new Error('No se pudo cargar el estado del hardware')
  const payload = await response.json().catch(() => null)
  return parseHardwareList(payload ?? [])
    .filter((item) => item.activa && isHardwareOffline(item))
    .map(hardwareToNotification)
}

export async function fetchActiveNotifications(): Promise<NotificationFeed> {
  const response = await fetch(`${API_PREFIX}/api/notifications/active?limit=10`, {
    credentials: 'same-origin',
    cache: 'no-store',
  })
  const payload = (await response.json().catch(() => null)) as {
    notifications?: unknown
    total?: unknown
  } | null
  if (!response.ok) throw new Error('No se pudieron cargar las notificaciones')
  const notifications = Array.isArray(payload?.notifications)
    ? (payload.notifications as AlertNotification[])
    : []
  return {
    notifications,
    total: typeof payload?.total === 'number' ? payload.total : notifications.length,
  }
}

export async function fetchRealtimeTicket(): Promise<string> {
  async function requestTicket() {
    return fetch(`${API_PREFIX}/auth/realtime-ticket`, {
      credentials: 'same-origin',
      cache: 'no-store',
      signal: AbortSignal.timeout(10_000),
    })
  }
  let response = await requestTicket()
  if (response.status === 401) {
    await fetch(`${API_PREFIX}/auth/refresh`, {
      method: 'POST',
      credentials: 'same-origin',
      signal: AbortSignal.timeout(10_000),
    })
    response = await requestTicket()
  }
  const payload = (await response.json().catch(() => null)) as { ticket?: unknown } | null
  if (!response.ok || typeof payload?.ticket !== 'string') {
    throw new Error('No se pudo autenticar el canal realtime')
  }
  return payload.ticket
}
