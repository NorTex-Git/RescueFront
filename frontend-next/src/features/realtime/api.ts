import { API_PREFIX } from '@/lib/config'

import type { AlertNotification, NotificationFeed } from './types'

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
    })
  }
  let response = await requestTicket()
  if (response.status === 401) {
    await fetch(`${API_PREFIX}/auth/refresh`, { method: 'POST', credentials: 'same-origin' })
    response = await requestTicket()
  }
  const payload = (await response.json().catch(() => null)) as { ticket?: unknown } | null
  if (!response.ok || typeof payload?.ticket !== 'string') {
    throw new Error('No se pudo autenticar el canal realtime')
  }
  return payload.ticket
}
