import type { ReactNode } from 'react'

import { cn } from '@/lib/utils'

/**
 * Celda principal de las tablas (diseño `admin-shell-v2.pen`): tile de icono tintado +
 * nombre en negrita + subtexto tenue. Unifica la primera columna de todas las vistas.
 */
const TILE_TONES = {
  indigo: 'bg-[var(--shell-accent-soft)] text-[var(--shell-accent)]',
  blue: 'bg-blue-50 text-blue-600 dark:bg-blue-500/15 dark:text-blue-300',
  green: 'bg-emerald-50 text-emerald-600 dark:bg-emerald-500/15 dark:text-emerald-300',
  purple: 'bg-violet-50 text-violet-600 dark:bg-violet-500/15 dark:text-violet-300',
  orange: 'bg-orange-50 text-orange-600 dark:bg-orange-500/15 dark:text-orange-300',
  red: 'bg-red-50 text-red-600 dark:bg-red-500/15 dark:text-red-300',
} as const

export function PrimaryCell({
  icon,
  tone = 'indigo',
  title,
  subtitle,
}: {
  icon: string
  tone?: keyof typeof TILE_TONES
  title: ReactNode
  subtitle?: ReactNode
}) {
  return (
    <div className="flex items-center gap-3">
      <span
        className={cn(
          'flex size-9 shrink-0 items-center justify-center rounded-[10px] text-sm',
          TILE_TONES[tone],
        )}
      >
        <i className={icon} />
      </span>
      <div className="min-w-0">
        <p className="truncate font-semibold text-[var(--shell-text-strong)]">{title}</p>
        {subtitle && <p className="truncate text-xs text-[var(--shell-text-muted)]">{subtitle}</p>}
      </div>
    </div>
  )
}
