'use client'

import { Icon } from '@/components/ui/icon'
import { useTheme } from '@/components/theme-provider'

/**
 * Mismo icono e interacción que el toggle del navbar (`components/shell/navbar.tsx`),
 * pero en un botón de vidrio propio: el login no tiene navbar y sus superficies vienen
 * de `login.css`, no de `portal.css`.
 */
export function ThemeToggleButton() {
  const { theme, toggleTheme } = useTheme()

  return (
    <button
      type="button"
      onClick={toggleTheme}
      aria-label="Cambiar tema"
      title="Cambiar tema"
      className="theme-toggle-btn fixed top-4 right-4 z-20 flex size-11 items-center justify-center rounded-full sm:top-6 sm:right-6"
    >
      <Icon className={theme === 'dark' ? 'fas fa-sun' : 'fas fa-moon'} />
    </button>
  )
}
