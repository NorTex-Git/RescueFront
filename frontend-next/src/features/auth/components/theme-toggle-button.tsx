'use client'

import { Icon } from '@/components/ui/icon'
import { useTheme } from '@/components/theme-provider'

/**
 * Mismo icono e interacción que el toggle del navbar (`components/shell/navbar.tsx`),
 * pero en un botón de vidrio propio: el login no tiene navbar y sus superficies vienen
 * de `login.css`, no de `portal.css`.
 */
export function ThemeToggleButton({ embedded = false }: { embedded?: boolean }) {
  const { theme, toggleTheme } = useTheme()

  return (
    <button
      type="button"
      onClick={toggleTheme}
      aria-label="Cambiar tema"
      title="Cambiar tema"
      className={`theme-toggle-btn${embedded ? ' theme-toggle-btn--embedded' : ''}`}
    >
      <Icon name={theme === 'dark' ? 'sun' : 'moon'} />
    </button>
  )
}
