'use client'

import { CrudView, type CrudResource } from '@/components/crud/crud-view'
import { StatusBadge } from '@/components/ui/badge'
import { PrimaryCell } from '@/components/ui/primary-cell'
import { matchesText } from '@/hooks/use-filters'
import type { LoadResult } from '@/load-result'

import {
  createUsuario,
  deleteUsuario,
  listUsuarios,
  toggleUsuarioStatus,
  updateUsuario,
} from '../api'
import {
  USUARIO_FORM_DEFAULTS,
  usuarioFields,
  usuarioFormSchema,
  type UsuarioFormOptions,
  type UsuarioFormValues,
} from '../schema'
import type { Usuario } from '../types'

/**
 * Usuarios. Sirve igual al portal empresa y al de admin: es la misma feature, no dos.
 *
 * Comprobado que `usuarios-modals.js` estaba duplicado en ambos portales con 38 líneas
 * distintas de ~1520, y las diferencias eran solo nombres de variable.
 *
 * El recurso se construye con `empresaId` y `roles`, que dependen de la sesión.
 */
function buildResource(
  empresaId: string,
  roles: string[],
  sedes: string[],
  empresaNombre: string,
): CrudResource<Usuario, UsuarioFormValues> {
  return {
    header: {
      icon: 'fas fa-users',
      title: 'Usuarios',
      subtitle: `Gestión del personal de ${empresaNombre}`,
    },

    queryKey: ['usuarios', empresaId],
    // `including-inactive`: sin esto, desactivar a alguien lo sacaba de la tabla y
    // dejaba de haber manera de reactivarlo desde la interfaz.
    queryFn: () => listUsuarios(empresaId, true),
    getId: (item) => item._id,
    labelOf: (item) => item.nombre,
    icon: 'fas fa-users',

    headerStats: (items) => [
      { label: 'Activos', value: items.filter((item) => item.activo).length, tone: 'success' },
      { label: 'Inactivos', value: items.filter((item) => !item.activo).length },
      {
        label: 'Roles',
        value: new Set(items.map((item) => item.rol).filter(Boolean)).size,
        tone: 'info',
      },
      {
        label: 'Sedes',
        value: new Set(items.map((item) => item.sede).filter(Boolean)).size,
        tone: 'info',
      },
    ],

    singular: 'usuario',
    plural: 'usuarios',
    emptyMessage: 'Esta empresa aún no tiene usuarios.',

    columns: [
      {
        key: 'nombre',
        header: 'Nombre',
        cell: (row) => (
          <PrimaryCell
            icon="fas fa-user"
            tone="blue"
            title={row.nombre || '—'}
            subtitle={row.email || undefined}
          />
        ),
      },
      { key: 'cedula', header: 'Cédula', cell: (row) => row.cedula || '—' },
      { key: 'rol', header: 'Rol', cell: (row) => row.rol || '—' },
      { key: 'sede', header: 'Sede', cell: (row) => row.sede || '—' },
      { key: 'telefono', header: 'Teléfono', cell: (row) => row.telefono || '—' },
      { key: 'activo', header: 'Estado', cell: (row) => <StatusBadge active={row.activo} /> },
    ],

    /*
     * Espeja los filtros de `admin/spa/views/usuarios.html:75`. El de rol se construye
     * con los roles de la empresa, que no son una lista fija (ver `server.ts`).
     */
    filters: [
      {
        key: 'buscar',
        label: 'Buscar usuario',
        placeholder: 'Nombre, cédula, correo o sede',
        match: (item, query) =>
          matchesText([item.nombre, item.cedula, item.email, item.sede, item.telefono], query),
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
      {
        key: 'rol',
        label: 'Rol',
        options: [
          { value: '', label: 'Todos los roles' },
          ...roles.map((rol) => ({ value: rol, label: rol })),
        ],
        match: (item, value) => item.rol === value,
      },
    ],

    detailRows: [
      { label: 'Nombre', value: (item) => item.nombre || '—' },
      { label: 'Cédula', value: (item) => item.cedula || '—' },
      { label: 'Rol', value: (item) => item.rol || '—' },
      { label: 'Sede', value: (item) => item.sede || '—' },
      { label: 'Teléfono', value: (item) => item.telefono || '—' },
      { label: 'Correo', value: (item) => item.email || '—' },
      { label: 'Estado', value: (item) => <StatusBadge active={item.activo} /> },
    ],
    detailSize: 'md',

    fields: usuarioFields(roles, sedes),
    schema: usuarioFormSchema,
    emptyValues: USUARIO_FORM_DEFAULTS,
    toFormValues: (item) => ({
      nombre: item.nombre,
      cedula: item.cedula,
      rol: item.rol,
      sede: item.sede ?? '',
      telefono: item.telefono ?? '',
      email: item.email ?? '',
    }),

    create: (values) => createUsuario(empresaId, values),
    update: (item, values) => updateUsuario(empresaId, item._id, values),
    remove: (item) => deleteUsuario(empresaId, item._id),
    toggle: {
      isActive: (item) => item.activo,
      run: (item) => toggleUsuarioStatus(empresaId, item._id, !item.activo),
    },
  }
}

export function UsuariosView({
  empresaId,
  empresaNombre,
  formOptionsLoad,
  initialLoad,
  onRetryFormOptions,
  filterSlot,
}: {
  empresaId: string
  /** Para el subtítulo de la cabecera; viene de la sesión, que es cosa del servidor. */
  empresaNombre: string
  /** Roles y sedes de la empresa; alimentan los selects del formulario. */
  formOptionsLoad: LoadResult<UsuarioFormOptions>
  /** Ausente cuando el admin cambia de empresa: entonces los pide el cliente. */
  initialLoad?: LoadResult<Usuario[]>
  onRetryFormOptions?: () => void
  /** El portal admin mete aquí su selector de empresa; el de empresa no lo usa. */
  filterSlot?: React.ReactNode
}) {
  const roles = formOptionsLoad.ok ? formOptionsLoad.data.roles : []
  const sedes = formOptionsLoad.ok ? formOptionsLoad.data.sedes : []
  return (
    <CrudView
      resource={buildResource(empresaId, roles, sedes, empresaNombre)}
      initialLoad={initialLoad}
      dependencyLoads={[formOptionsLoad]}
      onRetryDependencies={onRetryFormOptions}
      filterSlot={filterSlot}
    />
  )
}
