'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'

import { cn } from '@/lib/utils'

export type NavItem = { href: string; label: string; icon: string }

/**
 * Sidebar del portal. Vive en el layout del grupo de rutas, así que persiste entre
 * navegaciones sin re-render — lo que `static/js/portal-empresa/spa/router.js` hacía
 * a mano interceptando clicks y reemplazando `innerHTML`.
 *
 * El estado activo sale de `usePathname()`, no de una variable global.
 */
export function Sidebar({
  items,
  title,
  subtitle,
  initials,
  open,
  onClose,
  onLogout,
}: {
  items: NavItem[]
  title: string
  subtitle: string
  initials: string
  open: boolean
  onClose: () => void
  onLogout: () => void
}) {
  const pathname = usePathname()

  return (
    <>
      {/* `sidebar--closed` es el estado explícito que espera el CSS al cerrar en móvil. */}
      <aside className={cn('sidebar spa-sidebar', open ? 'sidebar--open' : 'sidebar--closed')}>
        <div className="sidebar__content">
          <div className="spa-sidebar__header">
            <div className="spa-sidebar__avatar">
              <span className="user-initials">{initials}</span>
            </div>
            <div className="spa-sidebar__meta">
              <p className="spa-sidebar__name">{title}</p>
              <p className="spa-sidebar__role">{subtitle}</p>
            </div>
          </div>

          <nav className="sidebar__nav">
            <div className="sidebar__nav-section">
              <div className="sidebar__nav-list">
                <div className="spa-sidebar__section-title">Navegación</div>
                {items.map((item) => (
                  <Link
                    key={item.href}
                    href={item.href}
                    onClick={onClose}
                    className={cn(
                      'sidebar__link',
                      pathname === item.href && 'sidebar__link--active',
                    )}
                  >
                    <div className="sidebar__link-icon">
                      <i className={item.icon} />
                    </div>
                    <span className="sidebar__link-text">{item.label}</span>
                  </Link>
                ))}
              </div>
            </div>
          </nav>

          <div className="sidebar__logout">
            <button className="sidebar__logout-btn" onClick={onLogout} aria-label="Cerrar sesión">
              <i className="fas fa-sign-out-alt" />
              <span>Cerrar Sesión</span>
            </button>
          </div>
        </div>
      </aside>

      <div
        className={cn('sidebar__overlay', open && 'sidebar__overlay--visible')}
        onClick={onClose}
      />
    </>
  )
}
