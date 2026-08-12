export type ConnectionStatus = 'connecting' | 'connected' | 'disconnected'

export type AlertNotification = {
  _id?: string
  nombre_alerta?: string
  tipo_alerta?: string
  empresa_nombre?: string
  sede?: string
  prioridad?: string
  descripcion?: string
  activo?: boolean
  fecha_creacion?: string
  fecha_actualizacion?: string
  [key: string]: unknown
}

export type RealtimeEvent = {
  eventId: string
  version: number
  type: string
  occurredAt: string
  empresaId: string | null
  entityId: string | null
  payload: Record<string, unknown>
}

export type NotificationFeed = {
  notifications: AlertNotification[]
  total: number
}
