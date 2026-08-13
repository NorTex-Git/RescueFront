'use client'

import { useQuery, useQueryClient } from '@tanstack/react-query'
import {
  createContext,
  useContext,
  useEffect,
  useMemo,
  useRef,
  useState,
  type ReactNode,
} from 'react'
import { toast } from 'sonner'

import { clientEnv } from '@/lib/config'
import type { AlertMessage } from '@/features/alerts/api'
import type { Alert, AlertsPage } from '@/features/alerts/types'
import { hardwareSchema, isHardwareOffline } from '@/features/hardware/types'

import {
  fetchActiveNotifications,
  fetchHardwareNotifications,
  fetchRealtimeTicket,
  hardwareToNotification,
} from './api'
import type {
  AlertNotification,
  ConnectionStatus,
  HardwareNotification,
  NotificationFeed,
  RealtimeEvent,
} from './types'

type RealtimeContextValue = NotificationFeed & {
  hardware: HardwareNotification[]
  hardwareTotal: number
  status: ConnectionStatus
  refresh: () => Promise<unknown>
}

const RealtimeContext = createContext<RealtimeContextValue | null>(null)

function isRealtimeEvent(value: unknown): value is RealtimeEvent {
  if (!value || typeof value !== 'object') return false
  const event = value as Partial<RealtimeEvent>
  return (
    typeof event.eventId === 'string' &&
    typeof event.type === 'string' &&
    event.version === 1 &&
    !!event.payload &&
    typeof event.payload === 'object'
  )
}

function alertFrom(event: RealtimeEvent): AlertNotification | null {
  const alert = event.payload.alert
  return alert && typeof alert === 'object' ? (alert as AlertNotification) : null
}

function realtimeUrl(ticket: string) {
  const url = new URL(clientEnv.NEXT_PUBLIC_WEBSOCKET_URL)
  url.pathname = `${url.pathname.replace(/\/$/, '')}/realtime`
  url.search = ''
  url.searchParams.set('ticket', ticket)
  return url.toString()
}

export function RealtimeProvider({
  children,
  empresaId,
}: {
  children: ReactNode
  empresaId?: string
}) {
  const queryClient = useQueryClient()
  const [status, setStatus] = useState<ConnectionStatus>('connecting')
  const seenEvents = useRef(new Set<string>())
  const notificationsKey = useMemo(
    () => ['notifications', empresaId ?? 'global', 'active'] as const,
    [empresaId],
  )
  const query = useQuery({
    queryKey: notificationsKey,
    queryFn: fetchActiveNotifications,
    staleTime: 60_000,
    refetchOnWindowFocus: true,
  })
  const hardwareKey = useMemo(
    () => ['hardware-notifications', empresaId ?? 'global'] as const,
    [empresaId],
  )
  const hardwareQuery = useQuery({
    queryKey: hardwareKey,
    queryFn: () => fetchHardwareNotifications(empresaId),
    // Empresa: acotado a su empresaId. Admin (sin empresaId): todo el hardware.
    staleTime: 60_000,
    refetchOnWindowFocus: true,
  })

  useEffect(() => {
    let stopped = false
    let socket: WebSocket | null = null
    let reconnectTimer: ReturnType<typeof setTimeout> | null = null
    let openTimer: ReturnType<typeof setTimeout> | null = null
    let attempts = 0
    let connecting = false
    let generation = 0

    function clearReconnectTimer() {
      if (!reconnectTimer) return
      clearTimeout(reconnectTimer)
      reconnectTimer = null
    }

    function clearOpenTimer() {
      if (!openTimer) return
      clearTimeout(openTimer)
      openTimer = null
    }

    function applyEvent(event: RealtimeEvent) {
      if (seenEvents.current.has(event.eventId)) return
      seenEvents.current.add(event.eventId)
      if (seenEvents.current.size > 200) {
        seenEvents.current.delete(seenEvents.current.values().next().value as string)
      }
      const alert = alertFrom(event)

      function patchAlertQueries(nextAlert: AlertNotification) {
        if (!event.empresaId) return
        const id = String(nextAlert._id ?? event.entityId ?? '')
        if (!id) return
        queryClient.setQueriesData<AlertsPage>(
          { queryKey: ['empresa', event.empresaId, 'alerts'] },
          (current) => {
            if (!current) return current
            let changed = false
            const data = current.data.map((item) => {
              if (String(item._id) !== id) return item
              changed = true
              return { ...item, ...(nextAlert as Partial<Alert>) }
            })
            return changed ? { ...current, data } : current
          },
        )
      }

      if (event.type === 'alert.created' && alert) {
        queryClient.setQueryData<NotificationFeed>(notificationsKey, (current) => {
          const previous = current ?? { notifications: [], total: 0 }
          const id = String(alert._id ?? event.entityId ?? '')
          const withoutDuplicate = previous.notifications.filter((item) => String(item._id) !== id)
          return {
            notifications: [alert, ...withoutDuplicate].slice(0, 10),
            total:
              withoutDuplicate.length === previous.notifications.length
                ? previous.total + 1
                : previous.total,
          }
        })
        toast.error(alert.nombre_alerta || alert.tipo_alerta || 'Nueva alerta', {
          description: [alert.empresa_nombre, alert.sede].filter(Boolean).join(' · '),
        })
        if (event.empresaId) {
          void queryClient.invalidateQueries({ queryKey: ['empresa', event.empresaId, 'alerts'] })
        }
      } else if (event.type === 'alert.deactivated') {
        const id = String(event.entityId ?? alert?._id ?? '')
        queryClient.setQueryData<NotificationFeed>(notificationsKey, (current) => {
          if (!current) return current
          const next = current.notifications.filter((item) => String(item._id) !== id)
          return {
            notifications: next,
            total: Math.max(
              0,
              current.total - (next.length < current.notifications.length ? 1 : 0),
            ),
          }
        })
        if (event.empresaId) {
          void queryClient.invalidateQueries({ queryKey: ['empresa', event.empresaId, 'alerts'] })
        }
      } else if (
        (event.type === 'alert.participant.status.changed' || event.type === 'alert.updated') &&
        alert
      ) {
        patchAlertQueries(alert)
        if (event.empresaId) {
          void queryClient.invalidateQueries({ queryKey: ['empresa', event.empresaId, 'alerts'] })
        }
      } else if (event.type === 'alert.message.created') {
        const message = event.payload.message
        const alertId = String(event.payload.alertId ?? event.entityId ?? '')
        if (alertId && message && typeof message === 'object') {
          const update = message as AlertMessage
          // El historial viene en orden cronológico ascendente; los mensajes nuevos
          // van al final (abajo, como un chat). Se deduplica por _id. No se invalida
          // la query: el cache ya queda correcto y evitamos un refetch innecesario.
          queryClient.setQueryData<AlertMessage[]>(['alert', alertId, 'messages'], (current) => {
            if (!current) return current
            const withoutDuplicate = current.filter((item) => item._id !== update._id)
            return [...withoutDuplicate, update]
          })
        }
      } else if (event.type === 'alert.message.reaction') {
        const alertId = String(event.payload.alertId ?? event.entityId ?? '')
        const messageId = String(event.payload.messageId ?? '')
        const reactions = event.payload.reactions
        if (alertId && messageId && reactions && typeof reactions === 'object') {
          queryClient.setQueryData<AlertMessage[]>(['alert', alertId, 'messages'], (current) => {
            if (!current) return current
            return current.map((item) =>
              item._id === messageId
                ? { ...item, reactions: reactions as AlertMessage['reactions'] }
                : item,
            )
          })
        }
      } else if (event.type === 'hardware.status.changed') {
        const hardware = event.payload.hardware
        if (hardware && typeof hardware === 'object') {
          const update = hardware as { _id?: string }
          queryClient.setQueriesData<Array<{ _id?: string }>>(
            { queryKey: ['hardware'] },
            (current) =>
              current?.map((item) => (item._id === update._id ? { ...item, ...update } : item)),
          )

          // Feed de notificaciones de hardware: solo equipos registrados (activa)
          // que quedan inactivos (offline). Al volver online se retiran del feed.
          const parsed = hardwareSchema.safeParse(hardware)
          if (parsed.success) {
            const offline = parsed.data.activa && isHardwareOffline(parsed.data)
            const notif = hardwareToNotification(parsed.data)
            const current = queryClient.getQueryData<HardwareNotification[]>(hardwareKey) ?? []
            const wasPresent = current.some((item) => item._id === notif._id)
            queryClient.setQueryData<HardwareNotification[]>(hardwareKey, () => {
              const without = current.filter((item) => item._id !== notif._id)
              return offline ? [notif, ...without].slice(0, 20) : without
            })
            if (offline && !wasPresent) {
              toast.warning(`Equipo inactivo: ${notif.nombre}`, {
                description: [notif.empresa_nombre, notif.sede].filter(Boolean).join(' · '),
              })
            }
          }
        } else {
          void queryClient.invalidateQueries({ queryKey: ['hardware'] })
          void queryClient.invalidateQueries({ queryKey: hardwareKey })
        }
      }
    }

    function scheduleReconnect() {
      if (stopped || reconnectTimer) return
      const base = Math.min(30_000, 1_000 * 2 ** attempts)
      const delay = base + Math.floor(Math.random() * Math.max(250, base * 0.2))
      attempts += 1
      reconnectTimer = setTimeout(() => {
        reconnectTimer = null
        void connect()
      }, delay)
    }

    async function connect() {
      if (stopped || connecting) return
      if (
        socket &&
        (socket.readyState === WebSocket.OPEN || socket.readyState === WebSocket.CONNECTING)
      ) {
        return
      }
      if (!navigator.onLine) {
        setStatus('disconnected')
        scheduleReconnect()
        return
      }

      connecting = true
      const currentGeneration = ++generation
      setStatus('connecting')
      try {
        const ticket = await fetchRealtimeTicket()
        if (stopped || currentGeneration !== generation) return

        const candidate = new WebSocket(realtimeUrl(ticket))
        socket = candidate
        openTimer = setTimeout(() => {
          if (socket !== candidate || candidate.readyState === WebSocket.OPEN) return
          socket = null
          candidate.close()
          setStatus('disconnected')
          scheduleReconnect()
        }, 12_000)

        candidate.onopen = () => {
          if (stopped || socket !== candidate) {
            candidate.close()
            return
          }
          clearOpenTimer()
          clearReconnectTimer()
          attempts = 0
          setStatus('connected')
          void queryClient.invalidateQueries({ queryKey: notificationsKey })
          void queryClient.invalidateQueries({ queryKey: ['hardware'] })
          void queryClient.invalidateQueries({ queryKey: ['alert'] })
          if (empresaId) {
            void queryClient.invalidateQueries({ queryKey: ['empresa', empresaId, 'alerts'] })
          }
        }
        candidate.onmessage = (message) => {
          try {
            const event: unknown = JSON.parse(String(message.data))
            if (isRealtimeEvent(event)) applyEvent(event)
          } catch {
            // Un mensaje malformado no debe cerrar el canal completo.
          }
        }
        candidate.onerror = () => candidate.close()
        candidate.onclose = () => {
          if (socket !== candidate) return
          clearOpenTimer()
          socket = null
          if (!stopped) {
            setStatus('disconnected')
            scheduleReconnect()
          }
        }
      } catch {
        if (!stopped && currentGeneration === generation) {
          setStatus('disconnected')
          scheduleReconnect()
        }
      } finally {
        if (currentGeneration === generation) connecting = false
      }
    }

    function reconnectNow() {
      if (stopped || !navigator.onLine) return
      if (
        socket &&
        (socket.readyState === WebSocket.OPEN || socket.readyState === WebSocket.CONNECTING)
      ) {
        return
      }
      socket = null
      attempts = 0
      clearReconnectTimer()
      void connect()
    }

    function handleOnline() {
      reconnectNow()
    }
    function handleOffline() {
      setStatus('disconnected')
      socket?.close()
    }
    window.addEventListener('online', handleOnline)
    window.addEventListener('offline', handleOffline)
    window.addEventListener('focus', reconnectNow)
    void connect()
    return () => {
      stopped = true
      generation += 1
      window.removeEventListener('online', handleOnline)
      window.removeEventListener('offline', handleOffline)
      window.removeEventListener('focus', reconnectNow)
      clearReconnectTimer()
      clearOpenTimer()
      socket?.close()
    }
  }, [empresaId, notificationsKey, hardwareKey, queryClient])

  const refetchAlerts = query.refetch
  const refetchHardware = hardwareQuery.refetch
  const value = useMemo<RealtimeContextValue>(
    () => ({
      notifications: query.data?.notifications ?? [],
      total: query.data?.total ?? 0,
      hardware: hardwareQuery.data ?? [],
      hardwareTotal: hardwareQuery.data?.length ?? 0,
      status,
      refresh: async () => {
        await Promise.all([refetchAlerts(), refetchHardware()])
      },
    }),
    [query.data, hardwareQuery.data, refetchAlerts, refetchHardware, status],
  )

  return <RealtimeContext.Provider value={value}>{children}</RealtimeContext.Provider>
}

export function useRealtime() {
  const value = useContext(RealtimeContext)
  if (!value) throw new Error('useRealtime debe usarse dentro de RealtimeProvider')
  return value
}
