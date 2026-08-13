'use client'

import { Icon } from '@/components/ui/icon'
import { useTheme } from '@/components/theme-provider'
import { NotificationCenter } from './notification-center'

/**
 * Barra superior del shell (diseño `admin-shell-v2.pen` → nodo "Navbar").
 *
 * Fija arriba, 68px, blanca con borde inferior. A la izquierda: hamburguesa (solo
 * móvil) + marca con tile en degradado; a la derecha: pill de estado + divisor +
 * toggle de tema. Estilos en Tailwind sobre los tokens `--shell-*` (ver globals.css),
 * que ya traen su espejo en `.dark` — por eso casi no hacen falta variantes `dark:`.
 */
export function Navbar({
  title,
  subtitle,
  initials,
  menuOpen,
  onToggleMenu,
  alertsHref,
  hardwareOnly,
}: {
  title: string
  subtitle: string
  initials: string
  menuOpen: boolean
  onToggleMenu: () => void
  alertsHref?: string
  hardwareOnly?: boolean
}) {
  const { theme, toggleTheme } = useTheme()

  return (
    <nav className="fixed inset-x-0 top-0 z-40 h-[68px] border-b border-[var(--shell-border)] bg-[var(--shell-surface)]">
      <div className="flex h-full items-center justify-between px-4 sm:px-7">
        <div className="flex items-center gap-3">
          <button
            className="flex size-9 items-center justify-center rounded-lg text-[var(--shell-text)] hover:bg-[var(--shell-accent-tile)] lg:hidden"
            aria-label="Alternar menú"
            aria-expanded={menuOpen}
            onClick={onToggleMenu}
          >
            <Icon name="bars" />
          </button>

          <div className="flex items-center gap-3">
            <div className="flex size-[38px] shrink-0 items-center justify-center rounded-full bg-[image:var(--shell-accent-grad)] text-[12px] font-bold tracking-[0.3px] text-white shadow-sm">
              {initials}
            </div>
            <div className="leading-tight">
              <h1 className="text-base font-bold tracking-[-0.2px] text-[var(--shell-text-strong)]">
                {title}
              </h1>
              <p className="text-[11px] text-[var(--shell-text-muted)]">{subtitle}</p>
            </div>
          </div>
        </div>

        <div className="flex items-center gap-3.5">
          {/*
           * Estático a propósito: no hay healthcheck conectado, así que no afirma nada
           * medido en vivo — solo indica que la app corre, como el resto del chrome fijo.
           */}
          <span className="hidden items-center gap-[7px] rounded-full bg-[var(--shell-ok-bg)] px-3 py-1.5 text-[11px] font-medium text-[var(--shell-ok-text)] sm:inline-flex">
            <span className="size-1.5 rounded-full bg-[var(--shell-ok)]" />
            Sistema operativo
          </span>

          <span className="hidden h-6 w-px bg-[var(--shell-border)] sm:block" />

          <NotificationCenter alertsHref={alertsHref} hardwareOnly={hardwareOnly} />

          <button
            className="flex size-[38px] items-center justify-center rounded-full border border-[var(--shell-border)] bg-[var(--shell-bg)] text-[var(--shell-text)] transition-colors hover:bg-[var(--shell-accent-tile)]"
            type="button"
            aria-label="Cambiar tema"
            title="Cambiar tema"
            onClick={toggleTheme}
          >
            <Icon name={theme === 'dark' ? 'sun' : 'moon'} />
          </button>
        </div>
      </div>
    </nav>
  )
}
