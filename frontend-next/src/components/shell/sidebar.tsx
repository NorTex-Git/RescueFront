'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import type { ReactNode } from 'react'

import { cn } from '@/lib/utils'

export type NavItem = { href: string; label: string; icon: string }

/**
 * Sidebar del portal (diseño `admin-shell-v2.pen` → nodo "Sidebar").
 *
 * Vive en el layout del grupo de rutas, así que persiste entre navegaciones sin
 * re-render — lo que `router.js` hacía a mano. El estado activo sale de `usePathname()`.
 *
 * Reescrito en Tailwind sobre los tokens `--shell-*` (con espejo en `.dark`), dejando
 * atrás las clases heredadas `sidebar__*`/`spa-sidebar__*` con glass-morphism que no
 * calzaban con el blanco limpio del mockup.
 */
export function Sidebar({
  items,
  title,
  subtitle,
  initials,
  open,
  onClose,
  onLogout,
  extra,
}: {
  items: NavItem[]
  title: string
  subtitle: string
  initials: string
  open: boolean
  onClose: () => void
  onLogout: () => void
  /** Bloque opcional entre la navegación y "Cerrar Sesión" — solo lo usa el admin hoy. */
  extra?: ReactNode
}) {
  const pathname = usePathname()

  return (
    <>
      <aside
        className={cn(
          'fixed top-[68px] bottom-0 left-0 z-40 flex w-[280px] max-w-[85vw] flex-col border-r border-[var(--shell-border)] bg-[var(--shell-surface)] px-4 py-5 transition-transform duration-300',
          'lg:sticky lg:top-[68px] lg:z-auto lg:h-[calc(100vh-68px)] lg:w-[264px] lg:max-w-none lg:translate-x-0',
          open ? 'translate-x-0' : '-translate-x-full',
        )}
      >
        <div className="flex min-h-0 flex-1 flex-col overflow-y-auto">
          {/* Perfil */}
          <div className="flex items-center gap-[11px] rounded-[14px] bg-[var(--shell-accent-soft)] p-2.5">
            <div className="flex size-[38px] shrink-0 items-center justify-center rounded-full bg-[image:var(--shell-accent-grad)] text-[13px] font-bold tracking-[0.3px] text-white">
              {initials}
            </div>
            <div className="min-w-0 leading-tight">
              <p className="truncate text-[13.5px] font-semibold text-[var(--shell-text-strong)]">
                {title}
              </p>
              <p className="truncate text-[11px] text-[var(--shell-role)]">{subtitle}</p>
            </div>
          </div>

          {/* Navegación */}
          <nav className="mt-[22px]">
            <p className="px-2 text-[10px] font-semibold tracking-[1.4px] text-[var(--shell-text-muted)] uppercase">
              Navegación
            </p>
            <div className="mt-2.5 flex flex-col gap-2">
              {items.map((item) => {
                const active = pathname === item.href
                return (
                  <Link
                    key={item.href}
                    href={item.href}
                    onClick={onClose}
                    aria-current={active ? 'page' : undefined}
                    className={cn(
                      'flex h-[52px] items-center gap-3 rounded-xl px-2.5 transition-colors',
                      active
                        ? 'bg-[var(--shell-accent-soft)]'
                        : 'hover:bg-[var(--shell-accent-tile)]',
                    )}
                  >
                    <span
                      className={cn(
                        'flex size-8 shrink-0 items-center justify-center rounded-[10px] text-[15px] transition-colors',
                        active
                          ? 'bg-[image:var(--shell-accent-grad)] text-white'
                          : 'bg-[var(--shell-accent-tile)] text-[var(--shell-text-muted)]',
                      )}
                    >
                      <i className={item.icon} />
                    </span>
                    <span
                      className={cn(
                        'truncate text-sm',
                        active
                          ? 'font-semibold text-[var(--shell-text-strong)]'
                          : 'font-medium text-[var(--shell-text)]',
                      )}
                    >
                      {item.label}
                    </span>
                  </Link>
                )
              })}
            </div>
          </nav>

          {extra && <div className="mt-auto pt-4">{extra}</div>}
        </div>

        {/* Cerrar sesión */}
        <div className="mt-4 border-t border-[var(--shell-border-soft)] pt-4">
          <button
            className="flex w-full items-center justify-center gap-2 rounded-xl border border-[var(--shell-danger-border)] bg-[var(--shell-danger-bg)] px-3 py-3 text-sm font-semibold text-[var(--shell-danger)] transition-colors hover:brightness-95"
            onClick={onLogout}
            aria-label="Cerrar sesión"
          >
            <i className="fas fa-sign-out-alt" />
            <span>Cerrar Sesión</span>
          </button>
        </div>
      </aside>

      {/* Overlay móvil */}
      <div
        className={cn(
          'fixed inset-0 top-[68px] z-30 bg-black/40 backdrop-blur-sm transition-opacity lg:hidden',
          open ? 'opacity-100' : 'pointer-events-none opacity-0',
        )}
        onClick={onClose}
      />
    </>
  )
}
