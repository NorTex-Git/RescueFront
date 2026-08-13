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
  /** Nombre semántico del icono Flowbite junto a la etiqueta. */
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
      size={size}
      footer={
        footer ?? (
          <ModalButton icon="times" onClick={onClose}>
            Cerrar
          </ModalButton>
        )
      }
    >
      {item && (
        <div className="min-w-0 flex flex-col gap-5">
          {heading && (
            <div>
              <h3 className="break-words text-xl font-bold text-gray-900 dark:text-white">
                {heading.title(item)}
              </h3>
              {heading.subtitle && (
                <p className="mt-0.5 break-words text-sm text-gray-600 dark:text-white/60">
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
                  className={`min-w-0 flex flex-col items-start gap-1 sm:flex-row sm:items-center sm:justify-between sm:gap-3 ${
                    row.full ? 'sm:col-span-2' : ''
                  }`}
                >
                  <dt className="flex shrink-0 items-center gap-2 text-sm text-gray-500 dark:text-white/50">
                    {row.icon && <Icon name={row.icon} className="text-xs" />}
                    {row.label}
                  </dt>
                  <dd className="min-w-0 max-w-full break-words text-left text-sm font-semibold text-gray-900 sm:text-right dark:text-white">
                    {row.value(item)}
                  </dd>
                </div>
              ))}
            </dl>
          )}

          {sections?.map((section) => {
            // Una sección cuyo `content` devuelve null/false se omite por completo:
            // así el modal no muestra apartados vacíos (p. ej. imagen inexistente).
            const content = section.content(item)
            if (content == null || content === false) return null
            return (
              <section
                key={section.title}
                className="border-t border-black/10 pt-4 dark:border-white/10"
              >
                <h4 className="mb-2 flex items-center gap-2 text-sm font-bold text-gray-900 dark:text-white">
                  {section.icon && (
                    <Icon name={section.icon} className="text-gray-400 dark:text-white/40" />
                  )}
                  {section.title}
                </h4>
                <div className="min-w-0 max-w-full break-words text-sm text-gray-700 dark:text-white/75">
                  {content}
                </div>
              </section>
            )
          })}
        </div>
      )}
    </Modal>
  )
}
