import type { ReactNode } from 'react'

import { GlassIcon } from '@/components/ui/glass-icons'
import { Icon } from '@/components/ui/icon'

/** Cabecera compartida del portal con iconografía Flowbite sobre vidrio neutro. */
export function PageHeader({
  icon,
  title,
  titleBadge,
  subtitle,
  stats,
  actions,
}: {
  icon: string
  title: string
  titleBadge?: ReactNode
  subtitle?: ReactNode
  stats?: ReactNode
  actions?: ReactNode
}) {
  return (
    <div className="mb-6 flex flex-wrap items-center gap-4">
      <div className="flex min-w-0 items-center gap-3.5">
        <GlassIcon size="lg">
          <Icon name={icon} />
        </GlassIcon>
        <div className="min-w-0">
          <h1 className="flex flex-wrap items-center gap-2 text-xl font-bold text-[var(--shell-text-strong)]">
            {title}
            {titleBadge && <span className="rounded-full bg-[var(--shell-accent-soft)] px-2.5 py-0.5 text-sm font-medium text-[var(--shell-role)]">{titleBadge}</span>}
          </h1>
          {subtitle && <p className="mt-0.5 text-sm text-[var(--shell-text-muted)]">{subtitle}</p>}
        </div>
      </div>
      {(stats || actions) && <div className="flex flex-1 flex-wrap items-center justify-end gap-2">{stats}{actions}</div>}
    </div>
  )
}
