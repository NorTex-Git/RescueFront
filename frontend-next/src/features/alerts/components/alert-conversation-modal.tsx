'use client'

import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { useEffect, useRef, useState } from 'react'
import { toast } from 'sonner'

import { Icon } from '@/components/ui/icon'
import { Modal } from '@/components/ui/modal'
import { useRealtime } from '@/features/realtime/realtime-provider'
import { formatTimestamp } from '@/features/stats/format'

import { listAlertMessages, sendAlertMessage, type AlertMessage } from '../api'
import { alertContacts, type Alert } from '../types'

/** Punto de estado de la conexión en vivo, tomado del RealtimeProvider global. */
function LiveIndicator() {
  const { status } = useRealtime()
  const connected = status === 'connected'
  return (
    <span className="inline-flex items-center gap-1.5 text-xs font-medium">
      <span
        className={`size-2 rounded-full ${connected ? 'animate-pulse bg-emerald-500' : 'bg-gray-400'}`}
      />
      <span className={connected ? 'text-emerald-600 dark:text-emerald-300' : 'text-gray-500'}>
        {connected ? 'En vivo' : 'Reconectando…'}
      </span>
    </span>
  )
}

function MessageBubble({ message }: { message: AlertMessage }) {
  const outgoing = message.direction === 'out'
  return (
    <div className={`flex ${outgoing ? 'justify-end' : 'justify-start'}`}>
      <div
        className={`max-w-[80%] rounded-2xl border px-3 py-2 ${
          outgoing
            ? 'rounded-br-sm border-[var(--shell-accent)]/25 bg-[var(--shell-accent-soft)]'
            : 'rounded-bl-sm border-[var(--shell-border)] bg-[var(--shell-surface-muted)]'
        }`}
      >
        <div className="flex items-center justify-between gap-3 text-xs text-[var(--shell-text-muted)]">
          <span className="truncate">
            {message.user_name || message.phone || (outgoing ? 'Empresa' : 'Contacto')}
          </span>
          <span className="shrink-0">
            {formatTimestamp(message.fecha ?? message.fecha_creacion ?? message.created_at ?? null)}
          </span>
        </div>
        <p className="mt-1 whitespace-pre-wrap text-sm text-[var(--shell-text-strong)]">
          {message.body || `[${message.type || 'mensaje'}]`}
        </p>
      </div>
    </div>
  )
}

export function AlertConversationModal({
  open,
  onClose,
  alert,
  status,
}: {
  open: boolean
  onClose: () => void
  /** `null` cuando no hay alerta seleccionada; el modal no se abre. */
  alert: Alert | null
  status: 'active' | 'inactive'
}) {
  const queryClient = useQueryClient()
  const alertId = alert?._id ?? ''
  const [draft, setDraft] = useState('')
  const scrollRef = useRef<HTMLDivElement>(null)

  // Lazy: sólo se consulta el historial mientras el modal está abierto. El WS global
  // (RealtimeProvider) actualiza este mismo cache en vivo al llegar mensajes nuevos.
  const query = useQuery({
    queryKey: ['alert', alertId, 'messages'],
    queryFn: () => listAlertMessages(alertId),
    enabled: open && Boolean(alertId),
    staleTime: 15_000,
  })

  const messages = query.data ?? []
  const contactCount = alert ? alertContacts(alert).length : 0

  const sendMutation = useMutation({
    mutationFn: (text: string) => sendAlertMessage(alertId, text),
    onSuccess: (created) => {
      setDraft('')
      // Refleja el mensaje al instante; el WS lo deduplica por _id si vuelve.
      queryClient.setQueryData<AlertMessage[]>(['alert', alertId, 'messages'], (current) => {
        if (!current) return current
        if (current.some((item) => item._id === created._id)) return current
        return [...current, created]
      })
    },
    onError: (error) => {
      toast.error(error instanceof Error ? error.message : 'No se pudo enviar el mensaje.')
    },
  })

  // Autoscroll al fondo cuando cambia la cantidad de mensajes o al abrir.
  useEffect(() => {
    if (!open) return
    const node = scrollRef.current
    if (node) node.scrollTop = node.scrollHeight
  }, [open, messages.length])

  function submit() {
    const text = draft.trim()
    if (!text || sendMutation.isPending) return
    sendMutation.mutate(text)
  }

  const primaryContact = alert ? alertContacts(alert)[0] : null
  const headerSubtitle =
    contactCount > 1
      ? `Grupo de la alerta · ${contactCount} contactos`
      : primaryContact?.numero || 'Sin contactos'

  return (
    <Modal
      open={open && alert !== null}
      onClose={onClose}
      title="Mensajes de la alerta"
      description={alert?.nombre_alerta || alert?.tipo_alerta || 'Conversación'}
      icon="message"
      size="lg"
      mobileFullscreen
    >
      <div className="flex h-[60dvh] min-h-0 flex-col sm:h-[65vh]">
        <div className="flex shrink-0 items-center justify-between gap-3 border-b border-[var(--shell-border)] pb-3">
          <div className="flex min-w-0 items-center gap-2.5">
            <span className="flex size-9 shrink-0 items-center justify-center rounded-xl bg-[var(--shell-accent-soft)] text-[var(--shell-accent)]">
              <Icon name="message" />
            </span>
            <div className="min-w-0">
              <p className="truncate text-sm font-semibold text-[var(--shell-text-strong)]">
                {alert?.empresa_nombre || 'Contactos'}
              </p>
              <p className="truncate text-xs text-[var(--shell-text-muted)]">{headerSubtitle}</p>
            </div>
          </div>
          <LiveIndicator />
        </div>

        <div ref={scrollRef} className="min-h-0 flex-1 space-y-2 overflow-y-auto py-3">
          {query.isPending ? (
            <p className="text-[var(--shell-text-muted)]">Cargando conversación…</p>
          ) : query.isError ? (
            <p className="text-red-600 dark:text-red-300">No se pudo cargar la conversación.</p>
          ) : messages.length === 0 ? (
            <p className="text-[var(--shell-text-muted)]">Aún no hay mensajes registrados.</p>
          ) : (
            messages.map((message) => <MessageBubble key={message._id} message={message} />)
          )}
        </div>

        {status === 'active' ? (
          <div className="flex shrink-0 items-end gap-2 border-t border-[var(--shell-border)] pt-3">
            <textarea
              value={draft}
              onChange={(event) => setDraft(event.target.value)}
              onKeyDown={(event) => {
                if (event.key === 'Enter' && !event.shiftKey) {
                  event.preventDefault()
                  submit()
                }
              }}
              rows={1}
              placeholder="Escribe un mensaje al grupo…"
              aria-label="Mensaje"
              className="max-h-32 min-h-[2.75rem] flex-1 resize-none rounded-2xl border border-[var(--shell-border)] bg-[var(--shell-surface)] px-4 py-3 text-sm text-[var(--shell-text-strong)] focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[var(--shell-accent)]"
            />
            <button
              type="button"
              onClick={submit}
              disabled={!draft.trim() || sendMutation.isPending}
              aria-label="Enviar mensaje"
              className="flex size-11 shrink-0 items-center justify-center rounded-full bg-gradient-to-br from-blue-500 to-indigo-600 text-white shadow-lg shadow-blue-900/40 transition-all hover:from-blue-400 hover:to-indigo-500 disabled:cursor-not-allowed disabled:opacity-60"
            >
              {sendMutation.isPending ? (
                <span className="size-4 animate-spin rounded-full border-2 border-current border-t-transparent" />
              ) : (
                <Icon name="paper-plane" />
              )}
            </button>
          </div>
        ) : (
          <p className="shrink-0 border-t border-[var(--shell-border)] pt-3 text-center text-xs text-[var(--shell-text-muted)]">
            La alerta está desactivada. La conversación es de solo lectura.
          </p>
        )}
      </div>
    </Modal>
  )
}
