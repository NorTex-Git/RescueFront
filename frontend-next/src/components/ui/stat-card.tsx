import { Icon } from '@/components/ui/icon'
import type { ReactNode } from 'react'

import { GlassIcon } from './glass-icons'

/**
 * Tarjeta de métrica del Dashboard (diseño `admin-shell-v2.pen` → nodo "StatCard").
 *
 * Label en versalitas, icono de vidrio neutro, valor grande y meta.
 * El tratamiento responde a los tokens `--shell-*` y evita colores decorativos que
 * competirían con los estados semánticos reales.
 */
export function MetricCard({
  icon,
  label,
  value,
  meta,
}: {
  icon: string
  label: string
  value: ReactNode
  /** Texto corto bajo el valor (ej. "registradas"), con punto de color. */
  meta?: string
}) {
  return (
    <div className="flex h-[132px] overflow-visible rounded-2xl border border-[var(--shell-border)] bg-[var(--shell-surface)] shadow-[0_12px_35px_rgba(15,23,42,0.035)]">
      <div className="flex flex-1 flex-col justify-between px-5 py-5">
        <div className="flex items-center justify-between">
          <span className="text-[10px] font-semibold tracking-[1.2px] text-[var(--shell-text-muted)] uppercase">
            {label}
          </span>
          <GlassIcon size="sm">
            <Icon name={icon} />
          </GlassIcon>
        </div>
        <div className="flex items-end justify-between">
          <span className="text-[34px] leading-9 font-bold tracking-[-1px] text-[var(--shell-text-strong)]">
            {value}
          </span>
          {meta && (
            <span className="flex items-center gap-1.5 pb-1.5 text-[11px] text-[var(--shell-text-muted)]">
              <span className="size-[5px] rounded-full bg-[var(--shell-text-muted)]" />
              {meta}
            </span>
          )}
        </div>
      </div>
    </div>
  )
}
