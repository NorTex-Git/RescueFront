import type { ReactNode } from 'react'

/**
 * Cabecera `ios-header-*` de cualquier vista de portal.
 *
 * Estaba copiada literal en cinco páginas antes de extraerla; el markup del CSS
 * heredado tiene cuatro divs anidados que no aportan nada al llamarlo.
 */
export function PageHeader({
  icon,
  title,
  subtitle,
  actions,
}: {
  icon: string
  title: string
  subtitle?: ReactNode
  actions?: ReactNode
}) {
  return (
    <div className="ios-header-container mb-8">
      <div className="ios-header-backdrop">
        <div className="ios-header-content">
          <div className="ios-header-text">
            <div className="ios-header-icon">
              <i className={icon} />
            </div>
            <div>
              <h1 className="ios-header-title">{title}</h1>
              {subtitle && <p className="ios-header-subtitle">{subtitle}</p>}
            </div>
          </div>
          {actions && <div className="ios-header-actions">{actions}</div>}
        </div>
      </div>
    </div>
  )
}
