'use client'

import { Icon } from '@/components/ui/icon'
import { CrudView, type CrudResource } from '@/components/crud/crud-view'
import { StatusBadge } from '@/components/ui/badge'
import type { FieldOption } from '@/components/ui/form-field'
import { PrimaryCell } from '@/components/ui/primary-cell'
import { MediaAudioPlayer } from '@/features/media/components/media-audio-player'
import type { MediaCatalog } from '@/features/media/normalize'
import { formatDate } from '@/features/stats/format'
import type { LoadResult } from '@/load-result'

import {
  createAlertType,
  deleteAlertType,
  listAlertTypes,
  toggleAlertTypeStatus,
  updateAlertType,
} from '../api'
import {
  ALERT_TYPE_DEFAULTS,
  alertTypeFields,
  alertTypeFormSchema,
  type AlertTypeFormValues,
} from '../schema'
import type { AlertType } from '../types'

/** Lista de textos como burbujas; se repite en recomendaciones e implementos. */
function chips(items: string[], vacio: string) {
  if (items.length === 0) return <p className="text-gray-500 dark:text-white/40">{vacio}</p>

  return (
    <ul className="flex flex-wrap gap-2">
      {items.map((item) => (
        <li
          key={item}
          className="rounded-full border border-blue-500/25 bg-blue-500/10 px-3.5 py-1.5 text-sm font-medium text-blue-700 dark:border-blue-400/30 dark:bg-blue-400/15 dark:text-blue-100"
        >
          {item}
        </li>
      ))}
    </ul>
  )
}

/** Muestra del color junto a su hex, para leerlo de un vistazo en la tabla. */
function ColorSwatch({ color }: { color: string | null | undefined }) {
  if (!color) return <>—</>

  return (
    <span className="inline-flex items-center gap-2">
      <span
        aria-hidden
        className="size-4 shrink-0 rounded-full border border-black/15 dark:border-white/20"
        style={{ backgroundColor: color }}
      />
      <span className="font-mono text-xs">{color}</span>
    </span>
  )
}

/**
 * Tipos de alerta del portal admin.
 *
 * **No lleva selector de empresa arriba**, a diferencia de usuarios: aquí el listado
 * es global sobre todas las empresas y la empresa se elige dentro del formulario, con
 * la opción "Global" para las que valen para todas. Es como funcionaba el original
 * (`static/js/admin/spa/views/alert-types-main.js:996`).
 *
 * Y por lo mismo el único filtro es Estado, igual que en
 * `templates/admin/spa/views/alert_types.html:63`.
 */
function AlertMediaDetails({ item }: { item: AlertType }) {
  const image = item.imagen_base64
  const sound = item.sonido_link

  return (
    <div className="grid gap-4 lg:grid-cols-2">
      <article className="overflow-hidden rounded-2xl border border-black/10 bg-white/55 p-3 dark:border-white/10 dark:bg-white/5">
        <div className="mb-3 flex items-center gap-2 text-sm font-semibold">
          <Icon name="image" className="text-sky-500" />
          Imagen de la alerta
        </div>
        {image ? (
          <>
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src={image}
              alt={`Imagen de ${item.nombre}`}
              className="h-64 w-full rounded-xl bg-slate-100/75 p-3 object-contain dark:bg-black/20"
            />
            <p className="mt-2 truncate text-xs text-gray-500 dark:text-white/50" title={image}>
              {image}
            </p>
          </>
        ) : (
          <p className="rounded-xl bg-gray-500/5 p-6 text-center text-sm text-gray-500">
            Sin imagen configurada
          </p>
        )}
      </article>

      <article className="rounded-2xl border border-black/10 bg-white/55 p-3 dark:border-white/10 dark:bg-white/5">
        <div className="mb-3 flex items-center gap-2 text-sm font-semibold">
          <Icon name="volume-high" className="text-indigo-500" />
          Sonido de la alerta
        </div>
        {sound ? (
          <>
            <MediaAudioPlayer src={sound} />
            <p className="mt-2 truncate text-xs text-gray-500 dark:text-white/50" title={sound}>
              {sound}
            </p>
          </>
        ) : (
          <p className="rounded-xl bg-gray-500/5 p-6 text-center text-sm text-gray-500">
            Sin sonido configurado
          </p>
        )}
      </article>
    </div>
  )
}

function buildResource(
  niveles: FieldOption[],
  empresas: FieldOption[],
  mediaCatalog: MediaCatalog,
): CrudResource<AlertType, AlertTypeFormValues> {
  const empresaNombre = new Map(empresas.map((empresa) => [empresa.value, empresa.label]))
  // El backend guarda `ROJO`; en pantalla se lee "Rojo (Crítica)", igual que en el
  // select. Sin esto la tabla mostraría el valor crudo y el formulario otra cosa.
  const nivelLabel = new Map(niveles.map((nivel) => [nivel.value, nivel.label]))

  return {
    queryKey: ['alert-types'],
    queryFn: listAlertTypes,
    getId: (item) => item._id,
    labelOf: (item) => item.nombre,
    icon: 'bell',
    formDescription: 'Define los atributos, recursos y recomendaciones de la alerta',

    header: {
      icon: 'bell',
      title: 'Tipos de Alerta',
      subtitle: 'Alarmas disponibles en el sistema',
    },

    headerStats: (items) => [
      { label: 'Activos', value: items.filter((item) => item.activo).length, tone: 'success' },
      { label: 'Inactivos', value: items.filter((item) => !item.activo).length },
      {
        label: 'Críticas',
        value: items.filter((item) => item.tipo_alerta === 'ROJO').length,
        tone: 'danger',
      },
      {
        label: 'Globales',
        value: items.filter((item) => !item.empresa_id).length,
        tone: 'info',
      },
    ],

    singular: 'tipo de alerta',
    plural: 'tipos de alerta',
    emptyMessage: 'Aún no hay tipos de alerta. Crea el primero para definir prioridades.',

    columns: [
      {
        key: 'nombre',
        header: 'Nombre',
        cell: (row) => (
          <PrimaryCell
            icon="bell"
            title={row.nombre || '—'}
            subtitle={nivelLabel.get(row.tipo_alerta) ?? undefined}
          />
        ),
      },
      {
        key: 'tipo_alerta',
        header: 'Nivel',
        cell: (row) => nivelLabel.get(row.tipo_alerta) ?? row.tipo_alerta ?? '—',
      },
      {
        key: 'empresa',
        header: 'Empresa',
        // Sin `empresa_id` es una alerta global, no un dato que falte.
        cell: (row) =>
          row.empresa_id ? (
            (empresaNombre.get(row.empresa_id) ?? '—')
          ) : (
            <span className="opacity-60">Global</span>
          ),
      },
      {
        key: 'color_alerta',
        header: 'Color',
        cell: (row) => <ColorSwatch color={row.color_alerta} />,
      },
      { key: 'activo', header: 'Estado', cell: (row) => <StatusBadge active={row.activo} /> },
    ],

    // Solo Estado, como el original. Ni buscador ni filtro por nivel: esta pantalla
    // maneja pocas filas y el original no los tenía.
    filters: [
      {
        key: 'estado',
        label: 'Estado',
        initial: 'all',
        options: [
          { value: 'all', label: 'Mostrar todos' },
          { value: 'active', label: 'Mostrar activos' },
          { value: 'inactive', label: 'Mostrar inactivos' },
        ],
        match: (item, value) => (value === 'active' ? item.activo : !item.activo),
      },
    ],

    detailTitle: 'Detalle de la alerta',
    detailIcon: 'bell',
    detailSize: 'xl',
    detailHeading: {
      title: (item) => item.nombre,
      subtitle: (item) => item.descripcion || 'Sin descripción',
    },
    detailRows: [
      {
        icon: 'fingerprint',
        label: 'Identificador',
        value: (item) => <span className="font-mono text-xs break-all">{item._id}</span>,
      },
      {
        icon: 'circle-check',
        label: 'Estado',
        value: (item) => <StatusBadge active={item.activo} />,
      },
      {
        icon: 'layer-group',
        label: 'Nivel',
        value: (item) => nivelLabel.get(item.tipo_alerta) ?? item.tipo_alerta ?? '—',
      },
      {
        icon: 'building',
        label: 'Empresa',
        value: (item) => (item.empresa_id ? (empresaNombre.get(item.empresa_id) ?? '—') : 'Global'),
      },
      {
        icon: 'palette',
        label: 'Color',
        value: (item) => <ColorSwatch color={item.color_alerta} />,
      },
      {
        icon: 'calendar',
        label: 'Creación',
        value: (item) => formatDate(item.fecha_creacion),
      },
    ],
    detailSections: [
      {
        icon: 'align-left',
        title: 'Descripcion',
        content: (item) => (
          <p className="leading-relaxed whitespace-pre-wrap text-gray-700 dark:text-white/75">
            {item.descripcion || 'Sin descripcion'}
          </p>
        ),
      },
      {
        icon: 'photo-film',
        title: 'Recursos multimedia',
        content: (item) => <AlertMediaDetails item={item} />,
      },
      {
        icon: 'list-check',
        title: 'Recomendaciones',
        content: (item) => chips(item.recomendaciones, 'Sin recomendaciones'),
      },
      {
        icon: 'toolbox',
        title: 'Implementos necesarios',
        content: (item) => chips(item.implementos_necesarios, 'Sin implementos'),
      },
    ],

    fields: alertTypeFields(niveles, empresas, mediaCatalog),
    // `xl`: es el formulario más cargado —dos selectores en cascada para los archivos,
    // color, y dos listas de burbujas—, y en `lg` los pares carpeta/archivo se apilan.
    formSize: 'xl',
    schema: alertTypeFormSchema,
    emptyValues: ALERT_TYPE_DEFAULTS,
    toFormValues: (item) => ({
      nombre: item.nombre,
      descripcion: item.descripcion ?? '',
      tipo_alerta: item.tipo_alerta,
      color_alerta: item.color_alerta ?? '#ef4444',
      imagen_base64: item.imagen_base64 ?? '',
      sonido_link: item.sonido_link ?? '',
      recomendaciones: item.recomendaciones,
      implementos_necesarios: item.implementos_necesarios,
      empresa_id: item.empresa_id ?? '',
    }),

    create: createAlertType,
    update: (item, values) => updateAlertType(item._id, values),
    // Aquí el `DELETE` **sí** borra de verdad (`delete_one`), a diferencia de empresas
    // y tipos de empresa. Por eso se ofrecen las dos acciones.
    remove: (item) => deleteAlertType(item._id),
    toggle: {
      isActive: (item) => item.activo,
      run: (item) => toggleAlertTypeStatus(item._id),
    },
  }
}

export function AlertTypesView({
  nivelesLoad,
  empresasLoad,
  initialLoad,
  mediaCatalogLoad,
}: {
  /** Valores de `TIPOS_ALERTA`, servidos por el backend. */
  nivelesLoad: LoadResult<FieldOption[]>
  /** Para el select del formulario y para nombrar la empresa en la tabla. */
  empresasLoad: LoadResult<FieldOption[]>
  initialLoad: LoadResult<AlertType[]>
  mediaCatalogLoad: LoadResult<MediaCatalog>
}) {
  const niveles = nivelesLoad.ok ? nivelesLoad.data : []
  const empresas = empresasLoad.ok ? empresasLoad.data : []
  const mediaCatalog = mediaCatalogLoad.ok
    ? mediaCatalogLoad.data
    : { folders: [], filesByFolder: {} }
  return (
    <CrudView
      resource={buildResource(niveles, empresas, mediaCatalog)}
      initialLoad={initialLoad}
      dependencyLoads={[nivelesLoad, empresasLoad, mediaCatalogLoad]}
    />
  )
}
