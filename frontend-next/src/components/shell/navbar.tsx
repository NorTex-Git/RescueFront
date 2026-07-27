'use client'

import { useTheme } from '@/components/theme-provider'

export function Navbar({
  title,
  subtitle,
  icon,
  menuOpen,
  onToggleMenu,
}: {
  title: string
  subtitle: string
  icon: string
  menuOpen: boolean
  onToggleMenu: () => void
}) {
  const { theme, toggleTheme } = useTheme()

  return (
    <nav className="navbar">
      <div className="navbar__container">
        <div className="navbar__left">
          <button
            className="navbar__menu-toggle"
            aria-label="Alternar menú"
            aria-expanded={menuOpen}
            onClick={onToggleMenu}
          >
            <i className="fas fa-bars" />
          </button>

          <div className="navbar__logo">
            <div className="navbar__logo-icon">
              <i className={icon} />
            </div>
            <div className="navbar__logo-text">
              <h1 className="navbar__logo-title">{title}</h1>
              <p className="navbar__logo-subtitle">{subtitle}</p>
            </div>
          </div>
        </div>

        <div className="navbar__center" />

        <div className="navbar__right">
          <div className="navbar__right-actions">
            {/*
              Falta el botón de notificaciones del navbar original: abría el panel de
              alertas vía `window.openEmpresaAlertsPanel`. Se añade en la Fase 3.5,
              junto con `AlertsProvider`. Se omite en vez de dejarlo muerto.
            */}
            <button
              className="navbar__action navbar__theme-toggle"
              type="button"
              aria-label="Cambiar tema"
              title="Cambiar tema"
              onClick={toggleTheme}
            >
              <i className={theme === 'dark' ? 'fas fa-sun' : 'fas fa-moon'} />
            </button>
          </div>
        </div>
      </div>
    </nav>
  )
}
