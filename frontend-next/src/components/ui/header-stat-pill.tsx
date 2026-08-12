import type { ReactNode } from 'react'

import { cn } from '@/lib/utils'

export type HeaderStatTone = 'neutral' | 'success' | 'danger' | 'warning' | 'info'

const DOT_TONES: Record<HeaderStatTone, string> = {
  neutral: 'bg-gray-400 dark:bg-white/40',
  success: 'bg-green-500',
  danger: 'bg-red-500',
  warning: 'bg-amber-500',
  info: 'bg-blue-500',
}

/**
 * Chip de contexto para el banner de cabecera (ej. "Activas 9"): borde + fondo blanco y
 * un punto de color, no un fondo sólido de color como `Badge`. `Badge` se queda para la
 * columna Estado de las tablas, que sí es sólida en el diseño de referencia — aquí el
 * acento vive solo en el punto.
 */
export function HeaderStatPill({
  label,
  value,
  tone = 'neutral',
}: {
  label: string
  value: ReactNode
  tone?: HeaderStatTone
}) {
  return (
    <span className="inline-flex items-center gap-1.5 rounded-full border border-gray-200 bg-white px-3 py-1 text-xs font-medium text-gray-600 shadow-xs dark:border-white/10 dark:bg-white/5 dark:text-white/70">
      <span aria-hidden className={cn('size-1.5 shrink-0 rounded-full', DOT_TONES[tone])} />
      {label}
      <strong className="font-semibold text-gray-900 dark:text-white">{value}</strong>
    </span>
  )
}
