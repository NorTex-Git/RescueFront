'use client'

import Link from 'next/link'
import { useEffect, useRef, useState } from 'react'

import { Icon } from '@/components/ui/icon'
import { useRealtime } from '@/features/realtime/realtime-provider'
import type { AlertNotification, HardwareNotification } from '@/features/realtime/types'

function dateOf(value?: string) {
  if (!value) return ''
  const date = new Date(value)
  if (Number.isNaN(date.getTime())) return ''
  return new Intl.DateTimeFormat('es-CO', {
    day: '2-digit', month: 'short', hour: '2-digit', minute: '2-digit',
  }).format(date)
}

function priorityClass(priority?: string) {
  const value = priority?.toLowerCase()
  if (value === 'alta' || value === 'high' || value === 'critica') return 'bg-red-500'
  if (value === 'media' || value === 'medium') return 'bg-amber-500'
  return 'bg-blue-500'
}

type Tab = 'alertas' | 'hardware'

function TabButton({
  active,
  label,
  count,
  onClick,
}: {
  active: boolean
  label: string
  count: number
  onClick: () => void
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={`flex flex-1 items-center justify-center gap-1.5 border-b-2 px-3 py-2.5 text-xs font-semibold transition-colors ${
        active
          ? 'border-[var(--shell-accent)] text-[var(--shell-text-strong)]'
          : 'border-transparent text-[var(--shell-text-muted)] hover:text-[var(--shell-text-strong)]'
      }`}
    >
      {label}
      {count > 0 && (
        <span
          className={`min-w-4 rounded-full px-1 text-center text-[10px] leading-4 ${
            active ? 'bg-[var(--shell-accent)] text-white' : 'bg-[var(--shell-border)] text-[var(--shell-text)]'
          }`}
        >
          {count > 99 ? '99+' : count}
        </span>
      )}
    </button>
  )
}

function EmptyState({ icon, title }: { icon: string; title: string }) {
  return (
    <div className="px-6 py-10 text-center">
      <Icon name={icon} className="mb-3 text-3xl text-[var(--shell-text-muted)]" />
      <p className="text-sm font-medium text-[var(--shell-text-strong)]">{title}</p>
      <p className="mt-1 text-xs text-[var(--shell-text-muted)]">Los cambios aparecerán aquí automáticamente.</p>
    </div>
  )
}

function AlertRow({ item }: { item: AlertNotification }) {
  return (
    <article className="flex gap-3 border-b border-[var(--shell-border)] px-4 py-3 last:border-0">
      <span className={`mt-1.5 size-2 shrink-0 rounded-full ${priorityClass(item.prioridad)}`} />
      <div className="min-w-0 flex-1">
        <p className="truncate text-sm font-semibold text-[var(--shell-text-strong)]">
          {item.nombre_alerta || item.tipo_alerta || 'Alerta'}
        </p>
        <p className="mt-0.5 truncate text-xs text-[var(--shell-text-muted)]">
          {[item.empresa_nombre, item.sede].filter(Boolean).join(' · ') || item.descripcion || 'Sin ubicación'}
        </p>
        {dateOf(item.fecha_actualizacion || item.fecha_creacion) && (
          <time className="mt-1 block text-[10px] text-[var(--shell-text-muted)]">
            {dateOf(item.fecha_actualizacion || item.fecha_creacion)}
          </time>
        )}
      </div>
    </article>
  )
}

function HardwareRow({ item }: { item: HardwareNotification }) {
  return (
    <article className="flex gap-3 border-b border-[var(--shell-border)] px-4 py-3 last:border-0">
      <span className="mt-0.5 flex size-7 shrink-0 items-center justify-center rounded-lg bg-red-500/10 text-red-600 dark:text-red-300">
        <Icon name="microchip" className="text-sm" />
      </span>
      <div className="min-w-0 flex-1">
        <p className="truncate text-sm font-semibold text-[var(--shell-text-strong)]">
          {item.nombre || 'Equipo'}
        </p>
        <p className="mt-0.5 truncate text-xs text-[var(--shell-text-muted)]">
          Inactivo · {[item.tipo, item.sede].filter(Boolean).join(' · ') || 'Sin sede'}
        </p>
        {dateOf(item.fecha) && (
          <time className="mt-1 block text-[10px] text-[var(--shell-text-muted)]">{dateOf(item.fecha)}</time>
        )}
      </div>
    </article>
  )
}

export function NotificationCenter({
  alertsHref,
  hardwareOnly = false,
}: {
  alertsHref?: string
  /** Admin: solo importan las notificaciones de hardware (sin pestaña de alertas). */
  hardwareOnly?: boolean
}) {
  const { notifications, total, hardware, hardwareTotal, status, refresh } = useRealtime()
  const [open, setOpen] = useState(false)
  const [tab, setTab] = useState<Tab>(hardwareOnly ? 'hardware' : 'alertas')
  const rootRef = useRef<HTMLDivElement>(null)
  const activeTab: Tab = hardwareOnly ? 'hardware' : tab
  const badge = hardwareOnly ? hardwareTotal : total + hardwareTotal

  useEffect(() => {
    function closeOnOutside(event: MouseEvent) {
      if (!rootRef.current?.contains(event.target as Node)) setOpen(false)
    }
    function closeOnEscape(event: KeyboardEvent) {
      if (event.key === 'Escape') setOpen(false)
    }
    document.addEventListener('mousedown', closeOnOutside)
    document.addEventListener('keydown', closeOnEscape)
    return () => {
      document.removeEventListener('mousedown', closeOnOutside)
      document.removeEventListener('keydown', closeOnEscape)
    }
  }, [])

  return (
    <div className="relative" ref={rootRef}>
      <button
        className="relative flex size-[38px] items-center justify-center rounded-full border border-[var(--shell-border)] bg-[var(--shell-bg)] text-[var(--shell-text)] transition-colors hover:bg-[var(--shell-accent-tile)]"
        type="button"
        aria-label={`Notificaciones: ${total} alertas, ${hardwareTotal} equipos inactivos`}
        aria-expanded={open}
        aria-haspopup="dialog"
        onClick={() => setOpen((value) => !value)}
      >
        <Icon name="bell" className="text-lg" />
        {badge > 0 && (
          <span className="absolute -right-1 -top-1 min-w-4 rounded-full bg-red-600 px-1 text-center text-[10px] font-bold leading-4 text-white">
            {badge > 99 ? '99+' : badge}
          </span>
        )}
      </button>

      {open && (
        <section
          className="absolute right-0 top-12 z-50 w-[min(24rem,calc(100vw-2rem))] overflow-hidden rounded-2xl border border-[var(--shell-border)] bg-[var(--shell-surface)] shadow-2xl"
          role="dialog"
          aria-label="Notificaciones"
        >
          <header className="flex items-center justify-between border-b border-[var(--shell-border)] px-4 py-3">
            <div>
              <h2 className="text-sm font-bold text-[var(--shell-text-strong)]">Notificaciones</h2>
              <p className="mt-0.5 flex items-center gap-1.5 text-[11px] text-[var(--shell-text-muted)]">
                <span className={`size-1.5 rounded-full ${status === 'connected' ? 'bg-emerald-500' : status === 'connecting' ? 'bg-amber-500' : 'bg-red-500'}`} />
                {status === 'connected' ? 'Actualización en tiempo real' : status === 'connecting' ? 'Conectando…' : 'Reconectando…'}
              </p>
            </div>
            <button
              type="button"
              className="rounded-lg p-2 text-[var(--shell-text-muted)] hover:bg-[var(--shell-bg)]"
              aria-label="Actualizar notificaciones"
              onClick={() => void refresh()}
            >
              <Icon name="rotate" />
            </button>
          </header>

          {!hardwareOnly && (
            <div className="flex border-b border-[var(--shell-border)]">
              <TabButton active={tab === 'alertas'} label="Alertas" count={total} onClick={() => setTab('alertas')} />
              <TabButton active={tab === 'hardware'} label="Hardware" count={hardwareTotal} onClick={() => setTab('hardware')} />
            </div>
          )}

          <div className="max-h-[26rem] overflow-y-auto">
            {activeTab === 'alertas' ? (
              notifications.length === 0 ? (
                <EmptyState icon="bell" title="Sin alertas activas" />
              ) : (
                notifications.map((item, index) => <AlertRow key={String(item._id ?? index)} item={item} />)
              )
            ) : hardware.length === 0 ? (
              <EmptyState icon="microchip" title="Todo el hardware activo" />
            ) : (
              hardware.map((item) => <HardwareRow key={item._id} item={item} />)
            )}
          </div>

          {alertsHref && activeTab === 'alertas' && (
            <Link
              href={alertsHref}
              className="block border-t border-[var(--shell-border)] px-4 py-3 text-center text-xs font-semibold text-[var(--shell-accent)] hover:bg-[var(--shell-bg)]"
              onClick={() => setOpen(false)}
            >
              Ver todas las alertas
            </Link>
          )}
        </section>
      )}
    </div>
  )
}
