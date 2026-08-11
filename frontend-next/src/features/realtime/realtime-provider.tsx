'use client'

import { useQuery, useQueryClient } from '@tanstack/react-query'
import { createContext, useContext, useEffect, useMemo, useRef, useState, type ReactNode } from 'react'
import { toast } from 'sonner'

import { clientEnv } from '@/lib/config'

import { fetchActiveNotifications, fetchRealtimeTicket } from './api'
import type { AlertNotification, ConnectionStatus, NotificationFeed, RealtimeEvent } from './types'

const NOTIFICATIONS_KEY = ['notifications', 'active'] as const

type RealtimeContextValue = NotificationFeed & {
  status: ConnectionStatus
  refresh: () => Promise<unknown>
}

const RealtimeContext = createContext<RealtimeContextValue | null>(null)

function isRealtimeEvent(value: unknown): value is RealtimeEvent {
  if (!value || typeof value !== 'object') return false
  const event = value as Partial<RealtimeEvent>
  return typeof event.eventId === 'string' && typeof event.type === 'string' &&
    event.version === 1 && !!event.payload && typeof event.payload === 'object'
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

export function RealtimeProvider({ children }: { children: ReactNode }) {
  const queryClient = useQueryClient()
  const [status, setStatus] = useState<ConnectionStatus>('connecting')
  const seenEvents = useRef(new Set<string>())
  const query = useQuery({
    queryKey: NOTIFICATIONS_KEY,
    queryFn: fetchActiveNotifications,
    staleTime: 60_000,
    refetchOnWindowFocus: true,
  })

  useEffect(() => {
    let stopped = false
    let socket: WebSocket | null = null
    let reconnectTimer: ReturnType<typeof setTimeout> | null = null
    let attempts = 0

    function applyEvent(event: RealtimeEvent) {
      if (seenEvents.current.has(event.eventId)) return
      seenEvents.current.add(event.eventId)
      if (seenEvents.current.size > 200) {
        seenEvents.current.delete(seenEvents.current.values().next().value as string)
      }
      const alert = alertFrom(event)
      if (event.type === 'alert.created' && alert) {
        queryClient.setQueryData<NotificationFeed>(NOTIFICATIONS_KEY, (current) => {
          const previous = current ?? { notifications: [], total: 0 }
          const id = String(alert._id ?? event.entityId ?? '')
          const withoutDuplicate = previous.notifications.filter((item) => String(item._id) !== id)
          return {
            notifications: [alert, ...withoutDuplicate].slice(0, 10),
            total: withoutDuplicate.length === previous.notifications.length
              ? previous.total + 1 : previous.total,
          }
        })
        toast.error(alert.nombre_alerta || alert.tipo_alerta || 'Nueva alerta', {
          description: [alert.empresa_nombre, alert.sede].filter(Boolean).join(' · '),
        })
        void queryClient.invalidateQueries({ queryKey: ['alerts'] })
        void queryClient.invalidateQueries({ queryKey: ['dashboard'] })
      } else if (event.type === 'alert.deactivated') {
        const id = String(event.entityId ?? alert?._id ?? '')
        queryClient.setQueryData<NotificationFeed>(NOTIFICATIONS_KEY, (current) => {
          if (!current) return current
          const next = current.notifications.filter((item) => String(item._id) !== id)
          return {
            notifications: next,
            total: Math.max(0, current.total - (next.length < current.notifications.length ? 1 : 0)),
          }
        })
        void queryClient.invalidateQueries({ queryKey: ['alerts'] })
        void queryClient.invalidateQueries({ queryKey: ['dashboard'] })
      } else if (event.type === 'hardware.status.changed') {
        const hardware = event.payload.hardware
        if (hardware && typeof hardware === 'object') {
          const update = hardware as { _id?: string }
          queryClient.setQueryData<Array<{ _id?: string }>>(['hardware'], (current) =>
            current?.map((item) => item._id === update._id ? { ...item, ...update } : item),
          )
        } else {
          void queryClient.invalidateQueries({ queryKey: ['hardware'] })
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
      if (stopped || !navigator.onLine) {
        setStatus('disconnected')
        return
      }
      setStatus('connecting')
      try {
        const ticket = await fetchRealtimeTicket()
        if (stopped) return
        socket = new WebSocket(realtimeUrl(ticket))
        socket.onopen = () => {
          attempts = 0
          setStatus('connected')
          void queryClient.invalidateQueries({ queryKey: NOTIFICATIONS_KEY })
        }
        socket.onmessage = (message) => {
          try {
            const event: unknown = JSON.parse(String(message.data))
            if (isRealtimeEvent(event)) applyEvent(event)
          } catch {
            // Un mensaje malformado no debe cerrar el canal completo.
          }
        }
        socket.onerror = () => socket?.close()
        socket.onclose = () => {
          socket = null
          if (!stopped) {
            setStatus('disconnected')
            scheduleReconnect()
          }
        }
      } catch {
        setStatus('disconnected')
        scheduleReconnect()
      }
    }

    function handleOnline() {
      attempts = 0
      if (!socket) void connect()
    }
    function handleOffline() {
      setStatus('disconnected')
      socket?.close()
    }

    window.addEventListener('online', handleOnline)
    window.addEventListener('offline', handleOffline)
    void connect()
    return () => {
      stopped = true
      window.removeEventListener('online', handleOnline)
      window.removeEventListener('offline', handleOffline)
      if (reconnectTimer) clearTimeout(reconnectTimer)
      socket?.close()
    }
  }, [queryClient])

  const value = useMemo<RealtimeContextValue>(() => ({
    notifications: query.data?.notifications ?? [],
    total: query.data?.total ?? 0,
    status,
    refresh: query.refetch,
  }), [query.data, query.refetch, status])

  return <RealtimeContext.Provider value={value}>{children}</RealtimeContext.Provider>
}

export function useRealtime() {
  const value = useContext(RealtimeContext)
  if (!value) throw new Error('useRealtime debe usarse dentro de RealtimeProvider')
  return value
}
