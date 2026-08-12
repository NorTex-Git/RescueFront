import type { ReactNode } from 'react'

import { cn } from '@/lib/utils'

type Tone = 'neutral' | 'success' | 'danger' | 'warning' | 'info'

const TONES: Record<Tone, string> = {
  neutral: 'bg-gray-100 text-gray-700 dark:bg-gray-700 dark:text-gray-200',
  success: 'bg-green-100 text-green-800 dark:bg-green-900/40 dark:text-green-300',
  danger: 'bg-red-100 text-red-800 dark:bg-red-900/40 dark:text-red-300',
  warning: 'bg-amber-100 text-amber-800 dark:bg-amber-900/40 dark:text-amber-300',
  info: 'bg-blue-100 text-blue-800 dark:bg-blue-900/40 dark:text-blue-300',
}

export function Badge({
  tone = 'neutral',
  className,
  children,
}: {
  tone?: Tone
  className?: string
  children: ReactNode
}) {
  return (
    <span
      className={cn(
        'inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium',
        TONES[tone],
        className,
      )}
    >
      {children}
    </span>
  )
}

/** Atajo para el par activo/inactivo, que se repite en todas las tablas. */
export function StatusBadge({ active }: { active: boolean }) {
  return <Badge tone={active ? 'success' : 'neutral'}>{active ? 'Activo' : 'Inactivo'}</Badge>
}
