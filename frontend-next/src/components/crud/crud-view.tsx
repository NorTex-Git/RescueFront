'use client'

import { Icon } from '@/components/ui/icon'
import { useQuery, useQueryClient } from '@tanstack/react-query'
import { useRouter } from 'next/navigation'
import { useState, type ReactNode } from 'react'
import type { DefaultValues, FieldValues, Path } from 'react-hook-form'
import { toast } from 'sonner'
import type { ZodType } from 'zod'

import { PageHeader } from '@/components/shell/page-header'
import { Button } from '@/components/ui/button'
import { ConfirmDialog } from '@/components/ui/confirm-dialog'
import { DetailModal, type DetailRow, type DetailSection } from '@/components/ui/detail-modal'
import { FilterBar } from '@/components/ui/filter-bar'
import type { FormField } from '@/components/ui/form-field'
import { FormModal } from '@/components/ui/form-modal'
import { HeaderStatPill, type HeaderStatTone } from '@/components/ui/header-stat-pill'
import { LoadErrorState } from '@/components/ui/load-error-state'
import type { ModalSize } from '@/components/ui/modal'
import { Pagination } from '@/components/ui/pagination'
import { Table, type Column } from '@/components/ui/table'
import { useCrudModals } from '@/hooks/use-crud-modals'
import { useFilters, type FilterDef } from '@/hooks/use-filters'
import { initialDataOf, toLoadError, type LoadResult } from '@/load-result'
import { cn } from '@/lib/utils'

/**
 * Pantalla CRUD completa: barra con contador y botón de alta, tabla, y los modales
 * de crear, editar y detalle, más los opcionales de activar/desactivar y eliminar.
 *
 * Cada recurso aporta solo datos —columnas, campos, funciones de API— y ni una línea
 * de markup. Esta capa nació porque `usuarios` y `company-types`, ya escritas sobre
 * los modales genéricos, seguían compartiendo ~80% de estructura entre sí.
 */
export type CrudResource<TItem, TValues extends FieldValues> = {
  /** Clave de caché de TanStack Query. */
  queryKey: readonly unknown[]
  queryFn: () => Promise<TItem[]>
  getId: (item: TItem) => string

  /** Textos. `singular` en minúscula, se usa dentro de frases. */
  singular: string
  plural: string
  emptyMessage: string

  /**
   * Cabecera de la página. La pinta `CrudView` y no la página, porque el contador y
   * el botón "Nuevo" van dentro de ella y dependen de estado de cliente: la barra
   * aparte que ocupaban antes era una franja entera para dos elementos.
   */
  header: { icon: string; title: string; subtitle?: React.ReactNode }

  /**
   * Chips de contexto junto al contador y el botón "Nuevo" — p. ej. "Activas 9",
   * "Sedes totales 27". Se derivan de los `items` ya cargados, sin pedir nada nuevo al
   * backend: cada recurso decide qué le importa mostrar de un vistazo.
   */
  headerStats?: (
    items: TItem[],
  ) => { label: string; value: React.ReactNode; tone?: HeaderStatTone }[]

  columns: Column<TItem>[]
  rowClassName?: (item: TItem) => string | undefined
  /** Sincronización periódica para recursos actualizados por sistemas externos. */
  refetchInterval?: number
  /** Oculta mutaciones pero conserva filtros, detalle y la misma vista del admin. */
  readOnly?: boolean
  /** Opcional: sin filtros no se pinta la barra. */
  filters?: FilterDef<TItem>[]
  /**
   * Estado vacío enriquecido (icono + textos + acciones), como el de Hardware en el
   * mockup. Render-prop para poder disparar el alta desde su botón.
   */
  emptyState?: (ctx: { openCreate: () => void }) => ReactNode
  /** Badge de índice por fila. Por defecto activo (así lo muestra el mockup). */
  showIndex?: boolean
  /** Filas por página. Por defecto 8. */
  pageSize?: number
  detailRows: DetailRow<TItem>[]
  /** Nombre y descripción destacados dentro del modal de detalle. */
  detailHeading?: {
    title: (item: TItem) => React.ReactNode
    subtitle?: (item: TItem) => React.ReactNode
  }
  /** Bloques largos del detalle (listas, etc.). */
  detailSections?: DetailSection<TItem>[]
  /** Título del modal de detalle. Por defecto, `Detalle · <singular>`. */
  detailTitle?: string
  detailDescription?: string
  /** Texto de apoyo para los formularios de alta y edicion. */
  formDescription?: string

  /**
   * Anchos de cada modal. Se ajustan al contenido del recurso: un formulario de tres
   * campos no necesita el mismo panel que uno de diez.
   */
  formSize?: ModalSize
  detailSize?: ModalSize
  confirmSize?: ModalSize

  fields: FormField<Path<TValues> & string>[]
  schema: ZodType<TValues, TValues>
  /**
   * Schema del alta, si difiere del de edición. Caso típico: la contraseña, que es
   * obligatoria al crear pero al editar en blanco significa "conservar la actual".
   */
  createSchema?: ZodType<TValues, TValues>
  emptyValues: DefaultValues<TValues>
  /** Cómo se rellena el formulario al editar. */
  toFormValues: (item: TItem) => DefaultValues<TValues>

  create: (values: TValues) => Promise<void>
  update: (item: TItem, values: TValues) => Promise<void>
  /**
   * Opcional, y **solo para borrado real**: si falta, no se muestra la acción.
   *
   * Varios `DELETE` del backend son soft deletes que se limitan a poner
   * `activo: false` —idéntico a `toggle`—, y encima filtran por `activo: True`,
   * así que sobre un registro ya inactivo devuelven 404. En esos recursos ofrecer
   * "Eliminar" es mentirle al usuario: se omite y queda solo `toggle`.
   */
  remove?: (item: TItem) => Promise<void>
  /** Opcional: si falta, no se muestra la acción de activar/desactivar. */
  toggle?: { isActive: (item: TItem) => boolean; run: (item: TItem) => Promise<void> }

  /** Etiqueta para las filas en modales y avisos, p. ej. el nombre. */
  labelOf: (item: TItem) => string

  /** Nombre semántico del icono Flowbite de encabezados y modales. */
  icon?: string
  /** Icono propio del modal de detalle; si falta se usa `icon`. */
  detailIcon?: string
}

export function CrudView<TItem, TValues extends FieldValues>({
  resource,
  initialLoad,
  dependencyLoads = [],
  onRetryDependencies,
  filterSlot,
}: {
  resource: CrudResource<TItem, TValues>
  /**
   * Control extra al principio de la barra de filtros, para lo que no es un filtro
   * sobre las filas sino sobre su origen: el selector de empresa del portal admin.
   */
  filterSlot?: React.ReactNode
  /**
   * Datos del Server Component. Opcional: cuando el usuario cambia de fuente —el
   * selector de empresa del portal admin— no hay nada precargado y toca pedirlos.
   */
  initialLoad?: LoadResult<TItem[]>
  /** Catálogos necesarios para crear o editar, sin confundir un fallo con cero opciones. */
  dependencyLoads?: LoadResult<unknown>[]
  onRetryDependencies?: () => void
}) {
  const router = useRouter()
  const queryClient = useQueryClient()
  const modals = useCrudModals<TItem>()

  const {
    data: items = [],
    error,
    isError,
    isFetching,
    isPending,
    refetch,
  } = useQuery({
    queryKey: resource.queryKey,
    queryFn: resource.queryFn,
    // Si el Server Component ya los trajo, sin esto habría un doble fetch al montar.
    initialData: initialLoad ? initialDataOf(initialLoad) : undefined,
    refetchInterval: resource.refetchInterval,
  })

  const loadError = isError ? toLoadError(error, resource.plural) : null
  const hardLoadError = loadError !== null && items.length === 0
  const dependencyError = dependencyLoads.find((load) => !load.ok)?.error ?? null

  const filters = useFilters(items, resource.filters)

  const invalidate = () => queryClient.invalidateQueries({ queryKey: resource.queryKey })
  const editing = modals.item

  // Paginación en cliente: los datos ya están filtrados en memoria (`useFilters`).
  const pageSize = resource.pageSize ?? 8
  const [pagination, setPagination] = useState({ page: 1, resultCount: filters.filtered.length })
  const page = pagination.resultCount === filters.filtered.length ? pagination.page : 1
  const pageCount = Math.max(1, Math.ceil(filters.filtered.length / pageSize))
  const safePage = Math.min(page, pageCount)
  const pageRows = filters.filtered.slice((safePage - 1) * pageSize, safePage * pageSize)

  /**
   * Las acciones por fila se añaden aquí para que ningún recurso las repita.
   *
   * Orden deliberado: desactivar antes que eliminar. Desactivar es reversible y es lo
   * que se quiere el 90% de las veces; eliminar va al final y en rojo, para que no se
   * pulse por inercia.
   */
  const columns: Column<TItem>[] = [
    ...resource.columns,
    {
      key: 'acciones',
      header: <span className="sr-only">Acciones</span>,
      className: 'text-right whitespace-nowrap',
      cell: (row) => (
        <div className="flex justify-end gap-1">
          <RowActionButton icon="eye" label="Ver" onClick={() => modals.openDetail(row)} />
          {!resource.readOnly && (
            <RowActionButton
              icon="pen"
              label="Editar"
              disabled={dependencyError !== null}
              onClick={() => modals.openEdit(row)}
            />
          )}
          {!resource.readOnly && resource.toggle && (
            <RowActionButton
              icon={resource.toggle.isActive(row) ? 'ban' : 'check'}
              label={resource.toggle.isActive(row) ? 'Desactivar' : 'Activar'}
              tone="warning"
              onClick={() => modals.openToggle(row)}
            />
          )}
          {!resource.readOnly && resource.remove && (
            <RowActionButton
              icon="trash"
              label="Eliminar"
              tone="danger"
              onClick={() => modals.openDelete(row)}
            />
          )}
        </div>
      ),
    },
  ]

  const isActive = editing && resource.toggle ? resource.toggle.isActive(editing) : false
  const headerStats = resource.headerStats?.(items) ?? []

  return (
    <>
      <PageHeader
        icon={resource.header.icon}
        title={resource.header.title}
        titleBadge={
          // Con filtros puestos importa cuántos se ven, no cuántos hay.
          filters.isDirty
            ? `${filters.filtered.length} de ${items.length} ${resource.plural}`
            : `${items.length} ${items.length === 1 ? resource.singular : resource.plural}`
        }
        subtitle={resource.header.subtitle}
        stats={
          headerStats.length > 0 &&
          headerStats.map((stat) => (
            <HeaderStatPill
              key={stat.label}
              label={stat.label}
              value={stat.value}
              tone={stat.tone}
            />
          ))
        }
        actions={
          <>
            {isFetching && <span className="text-xs opacity-60">Actualizando…</span>}
            {!resource.readOnly && (
              <Button
                onClick={modals.openCreate}
                disabled={hardLoadError || dependencyError !== null}
              >
                <Icon name="plus" />
                Nuevo
              </Button>
            )}
          </>
        }
      />

      {hardLoadError ? (
        <LoadErrorState error={loadError} onRetry={() => void refetch()} />
      ) : (
        <>
          {dependencyError && (
            <LoadErrorState
              compact
              error={dependencyError}
              message="No se pudieron cargar opciones necesarias para crear o editar. El listado sigue disponible."
              onRetry={onRetryDependencies ?? (() => router.refresh())}
            />
          )}
          {loadError && <LoadErrorState compact error={loadError} onRetry={() => void refetch()} />}
          <FilterBar filters={resource.filters ?? []} state={filters} leading={filterSlot} />

          <div className="overflow-hidden rounded-2xl border border-[var(--shell-border)] bg-[var(--shell-surface)]">
            <Table
              columns={columns}
              rows={pageRows}
              rowKey={resource.getId}
              rowClassName={resource.rowClassName}
              showIndex={resource.showIndex ?? true}
              indexOffset={(safePage - 1) * pageSize}
              // El estado vacío enriquecido solo en el vacío real; cargando y filtrado-sin-
              // resultados usan un mensaje, para no confundir una carga con una tabla vacía.
              emptyState={
                !isPending && !filters.isDirty
                  ? resource.emptyState?.({ openCreate: modals.openCreate })
                  : undefined
              }
              emptyMessage={
                isPending
                  ? 'Cargando…'
                  : filters.isDirty
                    ? 'Ningún registro coincide con los filtros.'
                    : resource.emptyMessage
              }
            />
            <Pagination
              page={safePage}
              pageCount={pageCount}
              total={filters.filtered.length}
              pageSize={pageSize}
              onPageChange={(nextPage) =>
                setPagination({ page: nextPage, resultCount: filters.filtered.length })
              }
            />
          </div>
        </>
      )}

      {!resource.readOnly && (
        <FormModal
          open={modals.isOpen('create')}
          onClose={modals.close}
          title={`Nuevo ${resource.singular}`}
          description={resource.formDescription}
          icon={resource.icon}
          fields={resource.fields}
          schema={resource.createSchema ?? resource.schema}
          defaultValues={resource.emptyValues}
          size={resource.formSize}
          submitLabel="Crear"
          onSubmit={async (values) => {
            await resource.create(values)
            invalidate()
            toast.success('Registro creado')
          }}
        />
      )}

      {!resource.readOnly && (
        <FormModal
          open={modals.isOpen('edit')}
          onClose={modals.close}
          title={`Editar ${resource.singular}`}
          icon={resource.icon}
          description={
            editing
              ? `${resource.labelOf(editing)}${resource.formDescription ? ` · ${resource.formDescription}` : ''}`
              : resource.formDescription
          }
          fields={resource.fields}
          schema={resource.schema}
          defaultValues={editing ? resource.toFormValues(editing) : resource.emptyValues}
          size={resource.formSize}
          onSubmit={async (values) => {
            if (!editing) return
            await resource.update(editing, values)
            invalidate()
            toast.success('Registro actualizado')
          }}
        />
      )}

      <DetailModal
        open={modals.isOpen('detail')}
        onClose={modals.close}
        title={resource.detailTitle ?? `Detalle · ${resource.singular}`}
        description={resource.detailDescription}
        icon={resource.detailIcon ?? resource.icon}
        item={modals.isOpen('detail') ? editing : null}
        heading={resource.detailHeading}
        rows={resource.detailRows}
        sections={resource.detailSections}
        size={resource.detailSize}
      />

      {!resource.readOnly && resource.toggle && (
        <ConfirmDialog
          open={modals.isOpen('toggle')}
          onClose={modals.close}
          title={isActive ? `Desactivar ${resource.singular}` : `Activar ${resource.singular}`}
          icon={isActive ? 'ban' : 'check'}
          headerIcon={isActive ? 'ban' : 'check'}
          size={resource.confirmSize}
          confirmLabel={isActive ? 'Desactivar' : 'Activar'}
          onConfirm={async () => {
            if (!editing || !resource.toggle) return
            await resource.toggle.run(editing)
            invalidate()
            toast.success(isActive ? 'Registro desactivado' : 'Registro activado')
          }}
        >
          <p className="text-sm text-gray-700 dark:text-white/80">
            <strong>{editing ? resource.labelOf(editing) : ''}</strong>{' '}
            {isActive ? 'quedará inactivo.' : 'volverá a estar activo.'}
          </p>
        </ConfirmDialog>
      )}

      {!resource.readOnly && resource.remove && (
        <ConfirmDialog
          open={modals.isOpen('delete')}
          onClose={modals.close}
          title={`Eliminar ${resource.singular}`}
          confirmLabel="Eliminar"
          confirmVariant="danger"
          icon="trash"
          headerIcon="triangle-exclamation"
          size={resource.confirmSize}
          onConfirm={async () => {
            if (!editing || !resource.remove) return
            await resource.remove(editing)
            invalidate()
            toast.success('Registro eliminado')
          }}
        >
          <p className="text-sm text-gray-700 dark:text-white/80">
            Se eliminará <strong>{editing ? resource.labelOf(editing) : ''}</strong>. Esta acción no
            se puede deshacer.
          </p>
          {/* Si el registro aún está activo, se ofrece la salida reversible antes que el borrado. */}
          {resource.toggle && isActive && (
            <button
              type="button"
              className="mt-3 text-sm font-semibold text-amber-600 underline-offset-2 hover:underline dark:text-amber-400"
              onClick={() => editing && modals.openToggle(editing)}
            >
              Mejor desactivarlo
            </button>
          )}
        </ConfirmDialog>
      )}
    </>
  )
}

const ROW_ACTION_TONES = {
  neutral: 'text-[var(--shell-text-muted)] hover:bg-[var(--shell-accent-tile)]',
  warning: 'text-amber-600 hover:bg-amber-50 dark:text-amber-400 dark:hover:bg-amber-500/10',
  danger: 'text-red-600 hover:bg-red-50 dark:text-red-400 dark:hover:bg-red-500/10',
} as const

/** Botón circular de icono para las acciones de fila — con tooltip y `aria-label`. */
function RowActionButton({
  icon,
  label,
  tone = 'neutral',
  onClick,
  disabled = false,
}: {
  icon: string
  label: string
  tone?: keyof typeof ROW_ACTION_TONES
  onClick: () => void
  disabled?: boolean
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      disabled={disabled}
      aria-label={label}
      title={label}
      className={cn(
        'flex size-8 items-center justify-center rounded-full transition-colors',
        ROW_ACTION_TONES[tone],
        disabled && 'cursor-not-allowed opacity-40',
      )}
    >
      <Icon name={icon} />
    </button>
  )
}
