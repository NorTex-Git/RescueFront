'use client'

import { Icon } from '@/components/ui/icon'
import { useRealtime } from '@/features/realtime/realtime-provider'

export default function AlertasPage() {
  const { notifications, total, status, refresh } = useRealtime()

  return (
    <div className="p-4 sm:p-7">
      <header className="mb-6 flex flex-wrap items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-[var(--shell-text-strong)]">Alertas activas</h1>
          <p className="mt-1 text-sm text-[var(--shell-text-muted)]">
            {total} alertas · {status === 'connected' ? 'actualización en tiempo real' : 'reconectando'}
          </p>
        </div>
        <button
          type="button"
          className="inline-flex items-center gap-2 rounded-xl border border-[var(--shell-border)] bg-[var(--shell-surface)] px-4 py-2 text-sm font-semibold text-[var(--shell-text)] hover:bg-[var(--shell-accent-tile)]"
          onClick={() => void refresh()}
        >
          <Icon className="fas fa-rotate" />
          Actualizar
        </button>
      </header>

      <section className="overflow-hidden rounded-2xl border border-[var(--shell-border)] bg-[var(--shell-surface)]">
        {notifications.length === 0 ? (
          <div className="px-6 py-16 text-center">
            <Icon className="fas fa-circle-check mb-4 text-4xl text-emerald-500" />
            <h2 className="font-semibold text-[var(--shell-text-strong)]">No hay alertas activas</h2>
            <p className="mt-1 text-sm text-[var(--shell-text-muted)]">Las nuevas alertas aparecerán automáticamente.</p>
          </div>
        ) : notifications.map((alert, index) => (
          <article
            key={String(alert._id ?? index)}
            className="flex items-start gap-4 border-b border-[var(--shell-border)] p-4 last:border-0 sm:p-5"
          >
            <span className="flex size-10 shrink-0 items-center justify-center rounded-xl bg-red-500/10 text-red-600 dark:text-red-300">
              <Icon className="fas fa-triangle-exclamation" />
            </span>
            <div className="min-w-0 flex-1">
              <div className="flex flex-wrap items-center justify-between gap-2">
                <h2 className="font-semibold text-[var(--shell-text-strong)]">
                  {alert.nombre_alerta || alert.tipo_alerta || 'Alerta'}
                </h2>
                {alert.prioridad && (
                  <span className="rounded-full bg-red-500/10 px-2.5 py-1 text-[10px] font-bold uppercase text-red-600 dark:text-red-300">
                    {alert.prioridad}
                  </span>
                )}
              </div>
              <p className="mt-1 text-sm text-[var(--shell-text-muted)]">
                {[alert.empresa_nombre, alert.sede].filter(Boolean).join(' · ') || 'Sin ubicación'}
              </p>
              {alert.descripcion && <p className="mt-2 text-sm text-[var(--shell-text)]">{alert.descripcion}</p>}
            </div>
          </article>
        ))}
      </section>
    </div>
  )
}
