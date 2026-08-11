import type { ReactNode } from 'react'

import { cn } from '@/lib/utils'

type IconTone = 'blue' | 'green' | 'red' | 'purple'

/**
 * Tarjeta de métrica del Dashboard (diseño `admin-shell-v2.pen` → nodo "StatCard").
 *
 * Distinta de `StatCard` (que sigue sobre el CSS heredado `ios-stat-card` y la usa el
 * portal empresa): riel de acento a la izquierda, label en versalitas, tile tintado
 * arriba-derecha, valor grande y meta con punto de color abajo. Todo Tailwind sobre
 * los tokens `--shell-*`.
 */
const METRIC_TONES = {
  blue: {
    rail: 'bg-blue-500',
    tile: 'bg-blue-50 text-blue-600 dark:bg-blue-500/15 dark:text-blue-300',
    dot: 'bg-blue-500',
  },
  green: {
    rail: 'bg-emerald-500',
    tile: 'bg-emerald-50 text-emerald-600 dark:bg-emerald-500/15 dark:text-emerald-300',
    dot: 'bg-emerald-500',
  },
  purple: {
    rail: 'bg-violet-500',
    tile: 'bg-violet-50 text-violet-600 dark:bg-violet-500/15 dark:text-violet-300',
    dot: 'bg-violet-500',
  },
  red: {
    rail: 'bg-red-500',
    tile: 'bg-red-50 text-red-600 dark:bg-red-500/15 dark:text-red-300',
    dot: 'bg-red-500',
  },
} as const

export function MetricCard({
  icon,
  tone,
  label,
  value,
  meta,
}: {
  icon: string
  tone: keyof typeof METRIC_TONES
  label: string
  value: ReactNode
  /** Texto corto bajo el valor (ej. "registradas"), con punto de color. */
  meta?: string
}) {
  const t = METRIC_TONES[tone]
  return (
    <div className="flex h-[132px] overflow-hidden rounded-2xl border border-[var(--shell-border)] bg-[var(--shell-surface)]">
      <div className={cn('w-1 shrink-0', t.rail)} />
      <div className="flex flex-1 flex-col justify-between py-5 pr-5 pl-[18px]">
        <div className="flex items-center justify-between">
          <span className="text-[10px] font-semibold tracking-[1.2px] text-[var(--shell-text-muted)] uppercase">
            {label}
          </span>
          <span
            className={cn(
              'flex size-8 items-center justify-center rounded-[10px] text-[15px]',
              t.tile,
            )}
          >
            <i className={icon} />
          </span>
        </div>
        <div className="flex items-end justify-between">
          <span className="text-[34px] leading-9 font-bold tracking-[-1px] text-[var(--shell-text-strong)]">
            {value}
          </span>
          {meta && (
            <span className="flex items-center gap-1.5 pb-1.5 text-[11px] text-[var(--shell-text-muted)]">
              <span className={cn('size-[5px] rounded-full', t.dot)} />
              {meta}
            </span>
          )}
        </div>
      </div>
    </div>
  )
}

/** Tarjeta `ios-stat-card` del CSS heredado, sin reescribir sus estilos. */
export function StatCard({
  icon,
  tone,
  label,
  children,
}: {
  icon: string
  tone: IconTone
  label: string
  children: ReactNode
}) {
  return (
    <div className="ios-stat-card" data-tone={tone}>
      <div className={`ios-stat-icon ios-stat-icon-${tone}`}>
        <i className={icon} />
      </div>
      <div className="ios-stat-content">
        <div className="ios-stat-label">{label}</div>
        {children}
      </div>
      <div className="ios-stat-shimmer" />
    </div>
  )
}

/** Fila etiqueta/valor de los desgloses (hardware por tipo, alertas por prioridad). */
export function BreakdownRow({
  label,
  value,
  valueClassName = 'text-black dark:text-white',
}: {
  label: string
  value: ReactNode
  valueClassName?: string
}) {
  return (
    <div className="flex justify-between text-sm">
      <span className="text-gray-600 dark:text-white/70">{label}</span>
      <span className={`font-semibold ${valueClassName}`}>{value}</span>
    </div>
  )
}
