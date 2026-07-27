'use client'

import { useQuery, useQueryClient } from '@tanstack/react-query'
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
import type { ModalSize } from '@/components/ui/modal'
import { Table, type Column } from '@/components/ui/table'
import { useCrudModals } from '@/hooks/use-crud-modals'
import { useFilters, type FilterDef } from '@/hooks/use-filters'

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

  columns: Column<TItem>[]
  /** Opcional: sin filtros no se pinta la barra. */
  filters?: FilterDef<TItem>[]
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

  /** Icono Font Awesome del encabezado de los modales, como en cada template. */
  icon?: string
  /** Degradado del recuadro del icono en formularios y confirmaciones. */
  iconGradient?: string
  /** Icono propio del modal de detalle; si falta se usa `icon`. */
  detailIcon?: string
  /** Degradado propio del modal de detalle; si falta se usa `iconGradient`. */
  detailIconGradient?: string
}

export function CrudView<TItem, TValues extends FieldValues>({
  resource,
  initialData,
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
  initialData?: TItem[]
}) {
  const queryClient = useQueryClient()
  const modals = useCrudModals<TItem>()

  const {
    data: items = [],
    isFetching,
    isPending,
  } = useQuery({
    queryKey: resource.queryKey,
    queryFn: resource.queryFn,
    // Si el Server Component ya los trajo, sin esto habría un doble fetch al montar.
    initialData,
  })

  const filters = useFilters(items, resource.filters)

  const invalidate = () => queryClient.invalidateQueries({ queryKey: resource.queryKey })
  const editing = modals.item

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
          <Button size="sm" variant="ghost" onClick={() => modals.openDetail(row)}>
            Ver
          </Button>
          <Button size="sm" variant="ghost" onClick={() => modals.openEdit(row)}>
            Editar
          </Button>
          {resource.toggle && (
            <Button
              size="sm"
              variant="ghost"
              className="text-amber-600 hover:bg-amber-500/10 dark:text-amber-400"
              onClick={() => modals.openToggle(row)}
            >
              <i className={resource.toggle.isActive(row) ? 'fas fa-ban' : 'fas fa-check'} />
              {resource.toggle.isActive(row) ? 'Desactivar' : 'Activar'}
            </Button>
          )}
          {resource.remove && (
            <Button
              size="sm"
              variant="ghost"
              className="text-red-600 hover:bg-red-500/10 dark:text-red-400"
              onClick={() => modals.openDelete(row)}
            >
              <i className="fas fa-trash" />
              Eliminar
            </Button>
          )}
        </div>
      ),
    },
  ]

  const isActive = editing && resource.toggle ? resource.toggle.isActive(editing) : false

  return (
    <>
      <PageHeader
        icon={resource.header.icon}
        title={resource.header.title}
        subtitle={resource.header.subtitle}
        actions={
          <>
            <span className="text-sm opacity-70">
              {/* Con filtros puestos importa cuántos se ven, no cuántos hay. */}
              {filters.isDirty
                ? `${filters.filtered.length} de ${items.length} ${resource.plural}`
                : `${items.length} ${items.length === 1 ? resource.singular : resource.plural}`}
              {isFetching && ' · actualizando…'}
            </span>
            <Button onClick={modals.openCreate}>
              <i className="fas fa-plus" />
              Nuevo
            </Button>
          </>
        }
      />

      <FilterBar filters={resource.filters ?? []} state={filters} leading={filterSlot} />

      <div className="ios-filters-container ios-blur-bg">
        <Table
          columns={columns}
          rows={filters.filtered}
          rowKey={resource.getId}
          emptyMessage={
            // Distinguir los tres casos: aún cargando, filtrado sin resultados, y
            // vacío de verdad. Si no, una carga en curso parece una tabla vacía.
            isPending
              ? 'Cargando…'
              : filters.isDirty
                ? 'Ningún registro coincide con los filtros.'
                : resource.emptyMessage
          }
        />
      </div>

      <FormModal
        open={modals.isOpen('create')}
        onClose={modals.close}
        title={`Nuevo ${resource.singular}`}
        description={resource.formDescription}
        icon={resource.icon}
        iconGradient={resource.iconGradient}
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

      <FormModal
        open={modals.isOpen('edit')}
        onClose={modals.close}
        title={`Editar ${resource.singular}`}
        icon={resource.icon}
        iconGradient={resource.iconGradient}
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

      <DetailModal
        open={modals.isOpen('detail')}
        onClose={modals.close}
        title={resource.detailTitle ?? `Detalle · ${resource.singular}`}
        description={resource.detailDescription}
        icon={resource.detailIcon ?? resource.icon}
        iconGradient={resource.detailIconGradient ?? resource.iconGradient}
        item={modals.isOpen('detail') ? editing : null}
        heading={resource.detailHeading}
        rows={resource.detailRows}
        sections={resource.detailSections}
        size={resource.detailSize}
      />

      {resource.toggle && (
        <ConfirmDialog
          open={modals.isOpen('toggle')}
          onClose={modals.close}
          title={isActive ? `Desactivar ${resource.singular}` : `Activar ${resource.singular}`}
          icon={isActive ? 'fas fa-ban' : 'fas fa-check'}
          headerIcon={isActive ? 'fas fa-ban' : 'fas fa-check'}
          iconGradient={isActive ? 'from-amber-500 to-orange-600' : 'from-emerald-500 to-green-600'}
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

      {resource.remove && (
        <ConfirmDialog
          open={modals.isOpen('delete')}
          onClose={modals.close}
          title={`Eliminar ${resource.singular}`}
          confirmLabel="Eliminar"
          confirmVariant="danger"
          icon="fas fa-trash"
          headerIcon="fas fa-triangle-exclamation"
          iconGradient="from-red-500 to-rose-700"
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
