import { Icon } from '@/components/ui/icon'
import type { ReactNode } from 'react'

import { GlassIcon } from './glass-icons'

/**
 * Celda principal de las tablas (diseño `admin-shell-v2.pen`): tile de icono tintado +
 * nombre en negrita + subtexto tenue. Unifica la primera columna de todas las vistas.
 */
export function PrimaryCell({
  icon,
  title,
  subtitle,
}: {
  icon: string
  title: ReactNode
  subtitle?: ReactNode
}) {
  return (
    <div className="flex items-center gap-3">
      <GlassIcon size="sm">
        <Icon name={icon} />
      </GlassIcon>
      <div className="min-w-0">
        <p className="truncate font-semibold text-[var(--shell-text-strong)]">{title}</p>
        {subtitle && <p className="truncate text-xs text-[var(--shell-text-muted)]">{subtitle}</p>}
      </div>
    </div>
  )
}
