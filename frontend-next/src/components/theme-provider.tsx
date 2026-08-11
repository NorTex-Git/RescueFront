'use client'

import { createContext, use, useCallback, useEffect, useState, type ReactNode } from 'react'

/** Reemplaza `static/js/theme-toggle.js` y su estado en `window`. */

export type Theme = 'light' | 'dark'

const STORAGE_KEY = 'rescue-theme'

type ThemeContextValue = {
  theme: Theme
  setTheme: (theme: Theme) => void
  toggleTheme: () => void
}

const ThemeContext = createContext<ThemeContextValue | null>(null)

/**
 * Se inyecta en `<head>` para aplicar la clase antes del primer paint y evitar el
 * flash al recargar.
 *
 * **Sin preferencia guardada el tema es claro**, igual que el Flask; no se consulta
 * `prefers-color-scheme`. No es un capricho: el CSS heredado no implementa de verdad
 * el modo oscuro. Verificado en el original con `.dark` puesto en `html` y `body`, el
 * `body` sigue en blanco con texto `rgb(33,37,41)`. Arrancar en oscuro por preferencia
 * del sistema metía la app en un estado que ese CSS no cubre: página blanca con texto
 * claro, ilegible.
 */
export const themeInitScript = `(function(){try{var t=localStorage.getItem('${STORAGE_KEY}')==='dark'?'dark':'light';var d=t==='dark';document.documentElement.classList.toggle('dark',d);document.documentElement.dataset.theme=t;document.addEventListener('DOMContentLoaded',function(){document.body.classList.toggle('dark',d)})}catch(e){}})()`

/**
 * La clase va en `<html>` **y** en `<body>`, igual que hacía
 * `static/js/portal-empresa/spa/theme-toggle.js:10-15`.
 *
 * No es redundante: el CSS heredado mezcla las dos raíces. `light-theme.css:171` usa
 * `body:not(.dark)`, así que marcando solo `<html>` las tarjetas se quedaban claras
 * mientras `global-text-theme.css` (que sí mira `html.dark`) ponía el texto blanco
 * — texto blanco sobre tarjeta blanca.
 */
function applyTheme(theme: Theme) {
  const dark = theme === 'dark'
  document.documentElement.classList.toggle('dark', dark)
  document.documentElement.dataset.theme = theme
  document.body.classList.toggle('dark', dark)
}

export function ThemeProvider({ children }: { children: ReactNode }) {
  // El script de arriba ya dejó el DOM en el tema correcto; aquí solo lo leemos.
  const [theme, setThemeState] = useState<Theme>(() =>
    typeof document !== 'undefined' && document.documentElement.classList.contains('dark')
      ? 'dark'
      : 'light',
  )

  useEffect(() => {
    const current = document.documentElement.classList.contains('dark') ? 'dark' : 'light'
    // Reaplica por si el `<body>` aún no existía cuando corrió el script del head.
    applyTheme(current)
  }, [])

  const setTheme = useCallback((next: Theme) => {
    setThemeState(next)
    applyTheme(next)
    try {
      localStorage.setItem(STORAGE_KEY, next)
    } catch {
      // Modo privado / almacenamiento bloqueado: el tema simplemente no persiste.
    }
  }, [])

  const toggleTheme = useCallback(
    () => setTheme(theme === 'dark' ? 'light' : 'dark'),
    [theme, setTheme],
  )

  return <ThemeContext value={{ theme, setTheme, toggleTheme }}>{children}</ThemeContext>
}

export function useTheme(): ThemeContextValue {
  const context = use(ThemeContext)
  if (!context) throw new Error('useTheme debe usarse dentro de <ThemeProvider>')
  return context
}
