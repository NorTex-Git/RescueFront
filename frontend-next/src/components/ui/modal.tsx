'use client'

import { Icon } from '@/components/ui/icon'
import { GlassIcon } from '@/components/ui/glass-icons'
import { useEffect, useId, useRef, type ButtonHTMLAttributes, type ReactNode } from 'react'
import { createPortal } from 'react-dom'

import { cn } from '@/lib/utils'

/**
 * Modal de vidrio esmerilado.
 *
 * Reproduce el aspecto de los modales del Flask (`templates/admin/spa/views/*.html`)
 * pero con utilidades de Tailwind en vez de las clases `ios-blur-*`. Motivo: al pasar
 * ese CSS por el pipeline de Next, el optimizador borra declaraciones enteras — de
 * `.ios-modal-backdrop` desaparecían `position`, `background`, `display` y
 * `backdrop-filter`, y el modal quedaba sin blur ni posicionamiento. Las utilidades de
 * Tailwind las genera el propio build, así que no se pierden.
 *
 * El panel se adapta al tema: vidrio claro sobre fondo claro, oscuro sobre oscuro.
 *
 * No se usa `<dialog>` nativo porque el Preflight de Tailwind le quita el
 * `margin: auto` y deja de centrarse. Se reponen a mano las tres cosas que daba
 * gratis: Escape, bloqueo del scroll de fondo y foco inicial dentro del panel.
 */
export type ModalSize = 'xs' | 'sm' | 'md' | 'lg' | 'xl'

/**
 * Escala de anchos del panel. Los valores viven en `globals.css`
 * (`.modal-panel[data-size]`), no en utilidades `max-w-*`: al elegirse el tamaño de
 * forma dinámica, Tailwind no generaba esas clases y el panel salía a pantalla
 * completa.
 *
 * Todos los modales aceptan `size`, así que una vista con más contenido de lo normal
 * sube un escalón sin tocar el componente:
 *
 * - `xs` confirmaciones cortas (eliminar, activar/desactivar)
 * - `sm` detalle breve
 * - `md` detalle con varias secciones
 * - `lg` formularios de una columna
 * - `xl` formularios a dos columnas
 */

export function Modal({
  open,
  onClose,
  title,
  description,
  icon,
  size = 'md',
  mobileFullscreen = false,
  footer,
  children,
}: {
  open: boolean
  onClose: () => void
  title: ReactNode
  description?: ReactNode
  /** Nombre semántico del icono Flowbite del encabezado. */
  icon?: string
  size?: ModalSize
  /** Usa casi todo el alto disponible en móvil; ideal para formularios crear/editar. */
  mobileFullscreen?: boolean
  footer?: ReactNode
  children: ReactNode
}) {
  const panelRef = useRef<HTMLDivElement>(null)
  const onCloseRef = useRef(onClose)
  const titleId = useId()
  const descriptionId = useId()

  useEffect(() => {
    onCloseRef.current = onClose
  }, [onClose])

  useEffect(() => {
    if (!open) return

    const previouslyFocused =
      document.activeElement instanceof HTMLElement ? document.activeElement : null

    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape') {
        event.preventDefault()
        onCloseRef.current()
        return
      }

      if (event.key !== 'Tab' || !panelRef.current) return

      const focusable = Array.from(
        panelRef.current.querySelectorAll<HTMLElement>(
          'a[href], button:not(:disabled), input:not(:disabled), select:not(:disabled), textarea:not(:disabled), [tabindex]',
        ),
      ).filter((element) => element.tabIndex >= 0 && element.getClientRects().length > 0)

      if (focusable.length === 0) {
        event.preventDefault()
        panelRef.current.focus()
        return
      }

      const first = focusable[0]
      const last = focusable[focusable.length - 1]
      if (event.shiftKey && document.activeElement === first) {
        event.preventDefault()
        last.focus()
      } else if (!event.shiftKey && document.activeElement === last) {
        event.preventDefault()
        first.focus()
      }
    }
    document.addEventListener('keydown', onKeyDown)

    // Bloquea el scroll de fondo sin que el contenido salte al desaparecer la barra.
    const { overflow, paddingRight } = document.body.style
    const scrollbar = window.innerWidth - document.documentElement.clientWidth
    document.body.style.overflow = 'hidden'
    if (scrollbar > 0) document.body.style.paddingRight = `${scrollbar}px`

    const initialFocus =
      panelRef.current?.querySelector<HTMLElement>(
        'input:not(:disabled), select:not(:disabled), textarea:not(:disabled)',
      ) ?? panelRef.current?.querySelector<HTMLElement>('button:not(:disabled), [href]')
    ;(initialFocus ?? panelRef.current)?.focus({ preventScroll: true })

    return () => {
      document.removeEventListener('keydown', onKeyDown)
      document.body.style.overflow = overflow
      document.body.style.paddingRight = paddingRight
      previouslyFocused?.focus({ preventScroll: true })
    }
  }, [open])

  if (!open) return null

  return createPortal(
    <div
      className={cn(
        'fixed inset-0 z-[10000] flex items-start justify-center overflow-y-auto sm:items-center',
        'bg-black/25 backdrop-blur-[20px] backdrop-saturate-150 dark:bg-black/45',
        'overscroll-contain p-2 sm:px-4 sm:py-[max(4dvh,1.5rem)]',
        'animate-in fade-in duration-200',
      )}
      onMouseDown={(event) => {
        // `mouseDown` y no `click`: soltar el ratón fuera tras seleccionar texto
        // dentro del panel lo cerraría.
        if (event.target === event.currentTarget) onClose()
      }}
      aria-labelledby={titleId}
      aria-describedby={description ? descriptionId : undefined}
      role="dialog"
      aria-modal="true"
    >
      <div
        ref={panelRef}
        tabIndex={-1}
        data-size={size}
        className={cn(
          'modal-panel relative min-w-0 flex flex-col overflow-hidden',
          'max-h-[calc(100dvh-1rem)] rounded-[20px] sm:max-h-[92dvh] sm:rounded-[28px]',
          mobileFullscreen && 'h-[calc(100dvh-1rem)] sm:h-auto',
          // El vidrio: muy translúcido, lo de detrás se intuye desenfocado.
          'backdrop-blur-2xl backdrop-saturate-150',
          'border border-black/10 bg-white/55 text-gray-900',
          'dark:border-white/15 dark:bg-slate-900/45 dark:text-white',
          'shadow-[0_20px_60px_rgba(0,0,0,0.25),inset_0_1px_0_rgba(255,255,255,0.5)]',
          'dark:shadow-[0_20px_60px_rgba(0,0,0,0.5),inset_0_1px_0_rgba(255,255,255,0.12)]',
          'animate-in zoom-in-95 slide-in-from-bottom-2 duration-200',
        )}
      >
        <header className="flex shrink-0 items-start gap-2.5 border-b border-black/10 bg-white/25 px-4 py-4 sm:gap-3 sm:px-6 sm:py-5 dark:border-white/10 dark:bg-white/5">
          {icon && (
            <GlassIcon size="lg">
              <Icon name={icon} />
            </GlassIcon>
          )}
          <div className="min-w-0 flex-1">
            {/* Envuelve en varias líneas en vez de cortarse: los títulos largos caben. */}
            <h2 className="text-xl leading-tight font-bold text-balance break-words sm:text-2xl">
              <span id={titleId}>{title}</span>
            </h2>
            {description && (
              <p className="mt-0.5 text-sm break-words text-gray-600 dark:text-white/60">
                <span id={descriptionId}>{description}</span>
              </p>
            )}
          </div>
          <button
            type="button"
            onClick={onClose}
            aria-label="Cerrar"
            className={cn(
              'flex size-10 shrink-0 items-center justify-center rounded-xl',
              'border border-red-500/30 bg-red-500/15 text-red-600',
              'dark:border-red-400/30 dark:text-red-300',
              'transition-colors hover:bg-red-500/30 hover:text-red-700 dark:hover:text-red-100',
              'focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-red-400',
            )}
          >
            <Icon name="times" className="text-lg" />
          </button>
        </header>

        <div className="min-h-0 min-w-0 flex-1 touch-pan-y overflow-x-hidden overflow-y-auto px-4 py-4 overscroll-contain sm:px-6 sm:py-6">
          {children}
        </div>

        {footer && (
          <footer className="flex shrink-0 flex-col gap-2.5 border-t border-black/10 bg-black/5 px-4 py-3 sm:flex-row sm:justify-end sm:gap-3 sm:px-6 sm:py-4 dark:border-white/10 dark:bg-black/20">
            {footer}
          </footer>
        )}
      </div>
    </div>,
    document.body,
  )
}

const BUTTON_VARIANTS = {
  primary:
    'bg-gradient-to-br from-blue-500 to-indigo-600 text-white shadow-lg shadow-blue-900/40 hover:from-blue-400 hover:to-indigo-500',
  secondary:
    'border border-black/15 bg-white/60 text-gray-700 hover:bg-white/90 ' +
    'dark:border-white/15 dark:bg-white/10 dark:text-white/90 dark:hover:bg-white/20',
  danger:
    'bg-gradient-to-br from-red-500 to-rose-600 text-white shadow-lg shadow-red-900/40 hover:from-red-400 hover:to-rose-500',
} as const

/** Botón del pie del modal, con el mismo aspecto que los `ios-blur-btn` originales. */
export function ModalButton({
  variant = 'secondary',
  icon,
  loading = false,
  className,
  children,
  ...props
}: ButtonHTMLAttributes<HTMLButtonElement> & {
  variant?: keyof typeof BUTTON_VARIANTS
  icon?: string
  loading?: boolean
}) {
  return (
    <button
      className={cn(
        'inline-flex w-full min-w-0 items-center justify-center gap-2 rounded-full px-5 py-3 sm:w-auto sm:px-6',
        'text-sm font-semibold transition-all',
        'focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-blue-500/60',
        'disabled:cursor-not-allowed disabled:opacity-60',
        BUTTON_VARIANTS[variant],
        className,
      )}
      disabled={loading || props.disabled}
      {...props}
    >
      {loading ? (
        <span
          aria-hidden
          className="size-4 animate-spin rounded-full border-2 border-current border-t-transparent"
        />
      ) : (
        icon && <Icon name={icon} />
      )}
      {children}
    </button>
  )
}
