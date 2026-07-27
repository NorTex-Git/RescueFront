'use client'

import { CrudView, type CrudResource } from '@/components/crud/crud-view'
import { StatusBadge } from '@/components/ui/badge'
import type { FieldOption } from '@/components/ui/form-field'
import { formatDate } from '@/features/stats/format'
import { matchesText } from '@/hooks/use-filters'

import { createEmpresa, listEmpresas, toggleEmpresaStatus, updateEmpresa } from '../api'
import {
  EMPRESA_FORM_DEFAULTS,
  empresaCreateSchema,
  empresaFields,
  empresaFormSchema,
  type EmpresaFormValues,
} from '../schema'
import type { Empresa } from '../types'

/**
 * Empresas. Es el recurso raíz del portal admin: al crear una queda registrada su
 * cuenta de acceso (`username` / `password`), que es la que entra al portal empresa.
 *
 * `tipos` son los tipos de empresa activos, para el select; los carga el Server
 * Component y no este cliente, que si no serían dos viajes en serie al abrir.
 */
function buildResource(tipos: FieldOption[]): CrudResource<Empresa, EmpresaFormValues> {
  const tipoNombre = new Map(tipos.map((tipo) => [tipo.value, tipo.label]))

  return {
    queryKey: ['empresas'],
    queryFn: listEmpresas,
    getId: (item) => item._id,
    labelOf: (item) => item.nombre,
    icon: 'fas fa-building',

    header: {
      icon: 'fas fa-building',
      title: 'Empresas',
      subtitle: 'Alta y acceso de las empresas del sistema',
    },

    singular: 'empresa',
    plural: 'empresas',
    emptyMessage: 'Aún no hay empresas. Crea la primera para dar acceso al portal.',

    columns: [
      { key: 'nombre', header: 'Nombre', cell: (row) => row.nombre || '—' },
      {
        key: 'tipo',
        header: 'Tipo',
        cell: (row) => (row.tipo_empresa_id && tipoNombre.get(row.tipo_empresa_id)) || '—',
      },
      { key: 'ubicacion', header: 'Ubicación', cell: (row) => row.ubicacion || '—' },
      { key: 'username', header: 'Usuario', cell: (row) => row.username || '—' },
      { key: 'sedes', header: 'Sedes', cell: (row) => row.sedes.length || '—' },
      // Ojo: `activa`, en femenino. El resto de recursos usa `activo`.
      { key: 'activa', header: 'Estado', cell: (row) => <StatusBadge active={row.activa} /> },
    ],

    filters: [
      {
        key: 'buscar',
        label: 'Buscar empresa',
        placeholder: 'Nombre, ubicación, usuario o correo',
        match: (item, query) =>
          matchesText(
            [item.nombre, item.descripcion, item.ubicacion, item.username, item.email],
            query,
          ),
      },
      {
        key: 'estado',
        label: 'Estado',
        initial: 'all',
        options: [
          { value: 'all', label: 'Todas' },
          { value: 'active', label: 'Solo activas' },
          { value: 'inactive', label: 'Solo inactivas' },
        ],
        match: (item, value) => (value === 'active' ? item.activa : !item.activa),
      },
      {
        key: 'tipo',
        label: 'Tipo de empresa',
        options: [{ value: '', label: 'Todos los tipos' }, ...tipos],
        match: (item, value) => item.tipo_empresa_id === value,
      },
    ],

    detailTitle: 'Detalle de la empresa',
    detailDescription: 'Datos de acceso y configuración',
    detailIcon: 'fas fa-eye',
    detailSize: 'md',
    detailHeading: {
      title: (item) => item.nombre,
      subtitle: (item) => item.descripcion || 'Sin descripción',
    },
    detailRows: [
      {
        icon: 'fas fa-circle-check',
        label: 'Estado',
        value: (item) => <StatusBadge active={item.activa} />,
      },
      {
        icon: 'fas fa-layer-group',
        label: 'Tipo',
        value: (item) => (item.tipo_empresa_id && tipoNombre.get(item.tipo_empresa_id)) || '—',
      },
      { icon: 'fas fa-location-dot', label: 'Ubicación', value: (item) => item.ubicacion || '—' },
      { icon: 'fas fa-user', label: 'Usuario', value: (item) => item.username || '—' },
      { icon: 'fas fa-envelope', label: 'Correo', value: (item) => item.email || '—' },
      {
        icon: 'fas fa-right-to-bracket',
        label: 'Último acceso',
        value: (item) => (item.last_login ? formatDate(item.last_login) : 'Nunca'),
      },
      {
        icon: 'fas fa-calendar',
        label: 'Creación',
        value: (item) => formatDate(item.fecha_creacion),
      },
    ],
    detailSections: [
      {
        icon: 'fas fa-location-dot',
        title: 'Sedes',
        content: (item) =>
          item.sedes.length ? (
            <ul className="flex flex-wrap gap-2">
              {item.sedes.map((sede) => (
                <li
                  key={sede}
                  className="rounded-full border border-blue-500/25 bg-blue-500/10 px-3.5 py-1.5 text-sm font-medium text-blue-700 dark:border-blue-400/30 dark:bg-blue-400/15 dark:text-blue-100"
                >
                  {sede}
                </li>
              ))}
            </ul>
          ) : (
            <p className="text-gray-500 dark:text-white/40">Sin sedes</p>
          ),
      },
      {
        icon: 'fas fa-user-tag',
        title: 'Roles',
        content: (item) =>
          item.roles.length ? (
            <ul className="flex flex-col gap-1.5">
              {item.roles.map((rol) => (
                <li key={rol.nombre} className="flex items-center gap-2">
                  <span className="font-medium">{rol.nombre}</span>
                  {rol.is_creator && (
                    <span className="text-xs opacity-60">· crea alertas</span>
                  )}
                  {rol.is_alert_manager && (
                    <span className="text-xs opacity-60">· gestiona alertas</span>
                  )}
                </li>
              ))}
            </ul>
          ) : (
            <p className="text-gray-500 dark:text-white/40">Sin roles</p>
          ),
      },
    ],

    fields: empresaFields(tipos),
    schema: empresaFormSchema,
    createSchema: empresaCreateSchema,
    emptyValues: EMPRESA_FORM_DEFAULTS,
    toFormValues: (item) => ({
      nombre: item.nombre,
      descripcion: item.descripcion ?? '',
      ubicacion: item.ubicacion ?? '',
      username: item.username ?? '',
      email: item.email ?? '',
      // Nunca se precarga: el backend no la devuelve, y en blanco significa
      // "conservar la actual".
      password: '',
      tipo_empresa_id: item.tipo_empresa_id ?? '',
      sedes: item.sedes,
      roles: item.roles,
    }),

    create: createEmpresa,
    update: (item, values) => updateEmpresa(item._id, values),
    /*
     * Sin `remove`: `DELETE /api/empresas/<id>` es `soft_delete()`, que solo pone
     * `activa: False` (`services/empresa_service.py:342`). Desactivar es la baja real.
     */
    toggle: {
      isActive: (item) => item.activa,
      run: (item) => toggleEmpresaStatus(item._id, !item.activa),
    },
  }
}

export function EmpresasView({
  initialData,
  tipos,
}: {
  initialData: Empresa[]
  /** Tipos de empresa activos, para el select y la columna de tipo. */
  tipos: FieldOption[]
}) {
  return <CrudView resource={buildResource(tipos)} initialData={initialData} />
}
