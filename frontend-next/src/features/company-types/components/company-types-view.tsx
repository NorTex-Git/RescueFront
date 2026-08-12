'use client'

import { CrudView, type CrudResource } from '@/components/crud/crud-view'
import { StatusBadge } from '@/components/ui/badge'
import { PrimaryCell } from '@/components/ui/primary-cell'
import { formatDate } from '@/features/stats/format'
import { matchesText } from '@/hooks/use-filters'
import type { LoadResult } from '@/load-result'

import {
  createCompanyType,
  listCompanyTypes,
  toggleCompanyTypeStatus,
  updateCompanyType,
} from '../api'
import {
  COMPANY_TYPE_DEFAULTS,
  companyTypeFields,
  companyTypeFormSchema,
  type CompanyTypeFormValues,
} from '../schema'
import type { CompanyType } from '../types'

/** Tipos de empresa. Solo describe el recurso; la pantalla la pone `CrudView`. */
const resource: CrudResource<CompanyType, CompanyTypeFormValues> = {
  queryKey: ['company-types'],
  queryFn: listCompanyTypes,
  getId: (item) => item._id,
  labelOf: (item) => item.nombre,
  icon: 'layer-group',

  header: {
    icon: 'layer-group',
    title: 'Tipos de Empresa',
    subtitle: 'Categorías para clasificar las empresas',
  },

  headerStats: (items) => [
    { label: 'Activos', value: items.filter((item) => item.activo).length, tone: 'success' },
    { label: 'Inactivos', value: items.filter((item) => !item.activo).length },
  ],

  singular: 'tipo de empresa',
  plural: 'tipos de empresa',
  emptyMessage: 'Aún no hay tipos de empresa. Crea el primero para poder registrar empresas.',

  columns: [
    {
      key: 'nombre',
      header: 'Nombre',
      cell: (row) => (
        <PrimaryCell icon="layer-group" title={row.nombre || '—'} />
      ),
    },
    { key: 'descripcion', header: 'Descripción', cell: (row) => row.descripcion || '—' },
    {
      key: 'caracteristicas',
      header: 'Características',
      cell: (row) => (row.caracteristicas.length ? row.caracteristicas.join(', ') : '—'),
    },
    { key: 'activo', header: 'Estado', cell: (row) => <StatusBadge active={row.activo} /> },
  ],

  /*
   * Los mismos filtros que el original (`admin/spa/views/company_types.html:74`), con
   * una diferencia: allí "Estado" arrancaba en "Solo activos". Aquí arranca en "Todos",
   * porque desactivar es ahora la baja normal y esconder los inactivos por defecto
   * dejaría sin manera de volver a activarlos.
   */
  filters: [
    {
      key: 'buscar',
      label: 'Buscar',
      placeholder: 'Nombre, descripción o característica',
      match: (item, query) =>
        matchesText([item.nombre, item.descripcion, ...item.caracteristicas], query),
    },
    {
      key: 'estado',
      label: 'Estado',
      initial: 'all',
      options: [
        { value: 'all', label: 'Todos' },
        { value: 'active', label: 'Solo activos' },
        { value: 'inactive', label: 'Solo inactivos' },
      ],
      match: (item, value) => (value === 'active' ? item.activo : !item.activo),
    },
  ],

  detailTitle: 'Detalle del tipo',
  detailDescription: 'Consulta la configuración completa',
  detailIcon: 'eye',
  detailHeading: {
    title: (item) => item.nombre,
    subtitle: (item) => item.descripcion || 'Sin descripción',
  },
  detailRows: [
    {
      icon: 'circle-check',
      label: 'Estado',
      value: (item) => <StatusBadge active={item.activo} />,
    },
    {
      icon: 'calendar',
      label: 'Creación',
      value: (item) => formatDate(item.fecha_creacion),
    },
  ],
  detailSections: [
    {
      icon: 'tags',
      title: 'Características',
      content: (item) =>
        item.caracteristicas.length ? (
          // Mismas burbujas que en el formulario, para que el registro se lea igual
          // se esté editando o consultando.
          <ul className="flex flex-wrap gap-2">
            {item.caracteristicas.map((caracteristica) => (
              <li
                key={caracteristica}
                className="rounded-full border border-blue-500/25 bg-blue-500/10 px-3.5 py-1.5 text-sm font-medium text-blue-700 dark:border-blue-400/30 dark:bg-blue-400/15 dark:text-blue-100"
              >
                {caracteristica}
              </li>
            ))}
          </ul>
        ) : (
          <p className="text-gray-500 dark:text-white/40">Sin características</p>
        ),
    },
  ],

  fields: companyTypeFields,
  schema: companyTypeFormSchema,
  emptyValues: COMPANY_TYPE_DEFAULTS,
  toFormValues: (item) => ({
    nombre: item.nombre,
    descripcion: item.descripcion ?? '',
    caracteristicas: item.caracteristicas,
  }),

  create: createCompanyType,
  update: (item, values) => updateCompanyType(item._id, values),
  /*
   * Sin `remove` a propósito: `DELETE /tipos_empresa/<id>` no borra nada. Es un soft
   * delete que hace `{"$set": {"activo": False}}` —lo mismo que `toggle-status`— y
   * además filtra por `activo: True`, así que sobre un tipo ya inactivo devuelve 404
   * (`repositories/tipo_empresa_repository.py:161`). Desactivar es la acción real.
   *
   * El listado usa `dashboard/all`, que incluye inactivos: por eso un tipo
   * desactivado sigue en la tabla y se puede volver a activar.
   */
  toggle: {
    isActive: (item) => item.activo,
    run: (item) => toggleCompanyTypeStatus(item._id),
  },
}

export function CompanyTypesView({ initialLoad }: { initialLoad: LoadResult<CompanyType[]> }) {
  return <CrudView resource={resource} initialLoad={initialLoad} />
}
