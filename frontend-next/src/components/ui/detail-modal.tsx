'use client'

import { Icon } from '@/components/ui/icon'
import type { ReactNode } from 'react'

import { Modal, ModalButton, type ModalSize } from './modal'

/**
 * Modal de solo lectura, con la estructura de los templates originales:
 *
 * 1. Nombre y descripción destacados arriba.
 * 2. Rejilla compacta de metadatos, cada uno con su icono, a dos columnas.
 * 3. Secciones con título e icono para el contenido largo (listas, etc.).
 *
 * Reemplaza los `viewUser` / `viewEmpresa` / `viewCompanyType` de los `*-modals.js`.
 */
export type DetailRow<T> = {
  label: string
  value: (item: T) => ReactNode
  /** Icono Font Awesome junto a la etiqueta. */
  icon?: string
  /** Ocupa las dos columnas de la rejilla. */
  full?: boolean
}

export type DetailSection<T> = {
  title: string
  icon?: string
  content: (item: T) => ReactNode
}

export function DetailModal<T>({
  open,
  onClose,
  title,
  description,
  icon,
  iconGradient,
  item,
  heading,
  rows,
  sections,
  footer,
  size = 'sm',
}: {
  open: boolean
  onClose: () => void
  /** Título del encabezado del modal, p. ej. "Detalle del tipo". */
  title: string
  description?: string
  icon?: string
  iconGradient?: string
  /** `null` cuando no hay nada seleccionado; el modal no se abre. */
  item: T | null
  /** Nombre y descripción del registro, destacados dentro del cuerpo. */
  heading?: { title: (item: T) => ReactNode; subtitle?: (item: T) => ReactNode }
  rows: DetailRow<T>[]
  sections?: DetailSection<T>[]
  footer?: ReactNode
  /** Sube un escalón si el registro tiene muchos campos. */
  size?: ModalSize
}) {
  return (
    <Modal
      open={open && item !== null}
      onClose={onClose}
      title={title}
      description={description}
      icon={icon}
      iconGradient={iconGradient}
      size={size}
      footer={
        footer ?? (
          <ModalButton icon="fas fa-times" onClick={onClose}>
            Cerrar
          </ModalButton>
        )
      }
    >
      {item && (
        <div className="flex flex-col gap-5">
          {heading && (
            <div>
              <h3 className="text-xl font-bold text-gray-900 dark:text-white">
                {heading.title(item)}
              </h3>
              {heading.subtitle && (
                <p className="mt-0.5 text-sm text-gray-600 dark:text-white/60">
                  {heading.subtitle(item)}
                </p>
              )}
            </div>
          )}

          {rows.length > 0 && (
            <dl className="grid grid-cols-1 gap-x-6 gap-y-2.5 sm:grid-cols-2">
              {rows.map((row) => (
                <div
                  key={row.label}
                  className={`flex items-center justify-between gap-3 ${
                    row.full ? 'sm:col-span-2' : ''
                  }`}
                >
                  <dt className="flex items-center gap-2 text-sm text-gray-500 dark:text-white/50">
                    {row.icon && <Icon className={`${row.icon} text-xs`} />}
                    {row.label}
                  </dt>
                  <dd className="text-sm font-semibold text-gray-900 dark:text-white">
                    {row.value(item)}
                  </dd>
                </div>
              ))}
            </dl>
          )}

          {sections?.map((section) => (
            <section
              key={section.title}
              className="border-t border-black/10 pt-4 dark:border-white/10"
            >
              <h4 className="mb-2 flex items-center gap-2 text-sm font-bold text-gray-900 dark:text-white">
                {section.icon && (
                  <Icon className={`${section.icon} text-gray-400 dark:text-white/40`} />
                )}
                {section.title}
              </h4>
              <div className="text-sm text-gray-700 dark:text-white/75">
                {section.content(item)}
              </div>
            </section>
          ))}
        </div>
      )}
    </Modal>
  )
}
