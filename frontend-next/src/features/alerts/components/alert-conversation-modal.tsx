'use client'

import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { useEffect, useRef, useState } from 'react'
import { toast } from 'sonner'

import { Icon } from '@/components/ui/icon'
import { Modal } from '@/components/ui/modal'
import { useRealtime } from '@/features/realtime/realtime-provider'
import { formatTimestamp } from '@/features/stats/format'
import { API_PREFIX } from '@/lib/config'

import { listAlertMessages, sendAlertMessage, type AlertMessage } from '../api'
import { alertContacts, type Alert } from '../types'

/** Clasifica el mensaje por su tipo/mime para elegir cómo renderizar la media. */
function mediaKind(message: AlertMessage): 'image' | 'video' | 'audio' | 'file' {
  const type = message.type
  const mime = message.mime_type || ''
  if (type === 'image' || type === 'sticker' || mime.startsWith('image/')) return 'image'
  if (type === 'video' || mime.startsWith('video/')) return 'video'
  if (type === 'audio' || mime.startsWith('audio/')) return 'audio'
  return 'file'
}

/** Etiqueta para mensajes sin media renderizable (p. ej. documentos, excluidos). */
function placeholderFor(type?: string): string {
  if (type === 'document') return '📎 Documento recibido'
  return `[${type || 'mensaje'}]`
}

function MessageMedia({ message }: { message: AlertMessage }) {
  // El backend guarda una ruta relativa (/api/...); el BFF de Next añade el prefijo.
  const src = `${API_PREFIX}${message.media_url}`
  const kind = mediaKind(message)
  if (kind === 'image') {
    return (
      // eslint-disable-next-line @next/next/no-img-element
      <img
        src={src}
        alt={message.body || 'Imagen'}
        className="max-h-64 max-w-full rounded-xl object-contain"
      />
    )
  }
  if (kind === 'video') {
    return <video src={src} controls className="max-h-72 max-w-full rounded-xl" />
  }
  if (kind === 'audio') {
    return <audio src={src} controls className="w-full" />
  }
  return (
    <a
      href={src}
      target="_blank"
      rel="noreferrer"
      className="inline-flex items-center gap-1.5 text-sm font-medium text-[var(--shell-accent)] hover:underline"
    >
      <Icon name="external-link-alt" className="text-xs" />
      Abrir archivo
    </a>
  )
}

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

/** Bloque de cita del mensaje respondido, arriba de la burbuja. */
function ReplyQuote({ author, snippet }: { author?: string; snippet?: string }) {
  return (
    <div className="mb-1.5 rounded-lg border-l-2 border-[var(--shell-accent)] bg-black/5 px-2 py-1 dark:bg-white/10">
      {author && (
        <p className="truncate text-xs font-semibold text-[var(--shell-accent)]">{author}</p>
      )}
      <p className="truncate text-xs text-[var(--shell-text-muted)]">{snippet || 'Mensaje'}</p>
    </div>
  )
}

/** Texto resumido de un mensaje (para citas y la tira del composer). */
function messagePreview(message: AlertMessage): string {
  if (message.body) return message.body
  if (message.media_url) {
    const labels: Record<string, string> = {
      image: '📷 Imagen', audio: '🎵 Audio', video: '🎬 Video', sticker: 'Sticker',
    }
    return labels[message.type || ''] || 'Archivo'
  }
  return placeholderFor(message.type)
}

function MessageBubble({
  message,
  onReply,
}: {
  message: AlertMessage
  onReply: (message: AlertMessage) => void
}) {
  const outgoing = message.direction === 'out'
  const replyButton = (
    <button
      type="button"
      onClick={() => onReply(message)}
      className="shrink-0 self-center rounded-full px-2 py-1 text-xs font-medium text-[var(--shell-text-muted)] opacity-0 transition-opacity hover:text-[var(--shell-accent)] group-hover:opacity-100"
    >
      Responder
    </button>
  )
  return (
    <div className={`group flex items-center gap-1 ${outgoing ? 'justify-end' : 'justify-start'}`}>
      {outgoing && replyButton}
      <div
        className={`max-w-[80%] rounded-2xl border px-3 py-2 ${
          outgoing
            ? 'rounded-br-sm border-[var(--shell-accent)]/25 bg-[var(--shell-accent-soft)]'
            : 'rounded-bl-sm border-[var(--shell-border)] bg-[var(--shell-surface-muted)]'
        }`}
      >
        {message.reply_to && (
          <ReplyQuote author={message.reply_to.author} snippet={message.reply_to.snippet} />
        )}
        <div className="flex items-center justify-between gap-3 text-xs text-[var(--shell-text-muted)]">
          <span className="truncate">
            {message.user_name || message.phone || (outgoing ? 'Empresa' : 'Contacto')}
          </span>
          <span className="shrink-0">
            {formatTimestamp(message.fecha ?? message.fecha_creacion ?? message.created_at ?? null)}
          </span>
        </div>
        {message.media_url ? (
          <div className="mt-1.5 space-y-1.5">
            <MessageMedia message={message} />
            {message.body && (
              <p className="whitespace-pre-wrap text-sm text-[var(--shell-text-strong)]">
                {message.body}
              </p>
            )}
          </div>
        ) : (
          <p className="mt-1 whitespace-pre-wrap text-sm text-[var(--shell-text-strong)]">
            {message.body || placeholderFor(message.type)}
          </p>
        )}
      </div>
      {!outgoing && replyButton}
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
  const [replyingTo, setReplyingTo] = useState<AlertMessage | null>(null)
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
    mutationFn: (input: { text: string; replyToId?: string }) =>
      sendAlertMessage(alertId, input.text, input.replyToId),
    onSuccess: (created) => {
      setDraft('')
      setReplyingTo(null)
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
    sendMutation.mutate({ text, replyToId: replyingTo?._id })
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
      headerVisual={
        alert?.image_alert ? (
          <span className="flex size-12 shrink-0 items-center justify-center overflow-hidden rounded-2xl border border-black/10 bg-white dark:border-white/15">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src={alert.image_alert}
              alt={alert.nombre_alerta || alert.tipo_alerta || 'Alerta'}
              className="size-full object-cover"
            />
          </span>
        ) : undefined
      }
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
            messages.map((message) => (
              <MessageBubble key={message._id} message={message} onReply={setReplyingTo} />
            ))
          )}
        </div>

        {status === 'active' ? (
          <div className="shrink-0 border-t border-[var(--shell-border)] pt-3">
            {replyingTo && (
              <div className="mb-2 flex items-center justify-between gap-2 rounded-lg border-l-2 border-[var(--shell-accent)] bg-black/5 px-3 py-1.5 dark:bg-white/10">
                <div className="min-w-0">
                  <p className="truncate text-xs font-semibold text-[var(--shell-accent)]">
                    Respondiendo a {replyingTo.user_name || replyingTo.phone || 'mensaje'}
                  </p>
                  <p className="truncate text-xs text-[var(--shell-text-muted)]">
                    {messagePreview(replyingTo)}
                  </p>
                </div>
                <button
                  type="button"
                  onClick={() => setReplyingTo(null)}
                  aria-label="Cancelar respuesta"
                  className="shrink-0 rounded-lg p-1.5 text-[var(--shell-text-muted)] hover:text-[var(--shell-text-strong)]"
                >
                  <Icon name="times" />
                </button>
              </div>
            )}
            <div className="flex items-end gap-2">
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
