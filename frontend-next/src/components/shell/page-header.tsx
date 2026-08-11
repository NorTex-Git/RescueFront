import { Icon } from '@/components/ui/icon'
import type { ReactNode } from 'react'

import { cn } from '@/lib/utils'

/**
 * Cabecera de cualquier vista de portal (diseño `admin-shell-v2.pen` → "Page Header").
 *
 * Va plano sobre el fondo del contenido (`--shell-bg`), sin el banner heredado
 * `ios-header-container/backdrop`: el mockup no tiene tarjeta de cabecera, solo el
 * tile de icono + textos a la izquierda y las pills/acciones a la derecha.
 *
 * El icono conserva el degradado por recurso vía `iconGradient` (clases from-* / to-*),
 * que cada `CrudResource` define — así el naranja de tipos de alerta, etc., sí aplica
 * (antes lo pisaba un degradado fijo por `!important`).
 */
export function PageHeader({
  icon,
  iconGradient = 'from-[#667eea] to-[#764ba2]',
  title,
  titleBadge,
  subtitle,
  stats,
  actions,
}: {
  icon: string
  /** Clases `from-*`/`via-*`/`to-*` de Tailwind para el degradado del icono. */
  iconGradient?: string
  title: string
  /** Pill pequeña junto al título — el conteo de la vista (ej. "12 empresas"). */
  titleBadge?: ReactNode
  subtitle?: ReactNode
  /** Chips de contexto entre el título y las acciones (ver `HeaderStatPill`). */
  stats?: ReactNode
  actions?: ReactNode
}) {
  return (
    <div className="mb-6 flex flex-wrap items-center gap-4">
      <div className="flex min-w-0 items-center gap-3.5">
        <div
          className={cn(
            'flex size-12 shrink-0 items-center justify-center rounded-2xl bg-gradient-to-br text-xl text-white shadow-sm',
            iconGradient,
          )}
        >
          <Icon className={icon} />
        </div>
        <div className="min-w-0">
          <h1 className="flex flex-wrap items-center gap-2 text-xl font-bold text-[var(--shell-text-strong)]">
            {title}
            {titleBadge && (
              <span className="rounded-full bg-[var(--shell-accent-soft)] px-2.5 py-0.5 text-sm font-medium text-[var(--shell-role)]">
                {titleBadge}
              </span>
            )}
          </h1>
          {subtitle && (
            <p className="mt-0.5 text-sm text-[var(--shell-text-muted)]">{subtitle}</p>
          )}
        </div>
      </div>

      {(stats || actions) && (
        <div className="flex flex-1 flex-wrap items-center justify-end gap-2">
          {stats}
          {actions}
        </div>
      )}
    </div>
  )
}
