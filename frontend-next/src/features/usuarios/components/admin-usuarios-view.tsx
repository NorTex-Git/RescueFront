'use client'

import { useQuery } from '@tanstack/react-query'

import type { FieldOption } from '@/components/ui/form-field'
import { EmpresaScope } from '@/features/empresas/components/empresa-scope'

import { fetchEmpresaRolesClient } from '../api'
import type { Usuario } from '../types'

import { UsuariosView } from './usuarios-view'

/**
 * Usuarios en el portal admin. **Es la misma vista que la del portal empresa**, con lo
 * único que cambia entre los dos: el admin elige de qué empresa está viendo la gente,
 * mientras que la empresa solo puede ver la suya.
 */
export function AdminUsuariosView({
  empresas,
  initialEmpresaId,
  initialRoles,
  initialData,
}: {
  empresas: FieldOption[]
  initialEmpresaId: string
  initialRoles: string[]
  initialData: Usuario[]
}) {
  return (
    <EmpresaScope
      empresas={empresas}
      initialEmpresaId={initialEmpresaId}
      emptyMessage="No hay empresas todavía. Crea una en Empresas para poder darle usuarios."
    >
      {({ empresaId, empresaNombre, isInitial, selector }) => (
        <UsuariosBridge
          empresaId={empresaId}
          empresaNombre={empresaNombre}
          selector={selector}
          initialRoles={isInitial ? initialRoles : undefined}
          initialData={isInitial ? initialData : undefined}
        />
      )}
    </EmpresaScope>
  )
}

/**
 * Los roles no son una lista fija: viven en el documento de cada empresa, así que
 * cambian con el selector. Va en su propio componente porque `useQuery` no puede
 * llamarse dentro del render-prop de `EmpresaScope`.
 */
function UsuariosBridge({
  empresaId,
  empresaNombre,
  selector,
  initialRoles,
  initialData,
}: {
  empresaId: string
  empresaNombre: string
  selector: React.ReactNode
  initialRoles?: string[]
  initialData?: Usuario[]
}) {
  const { data: roles = [] } = useQuery({
    queryKey: ['empresa-roles', empresaId],
    queryFn: () => fetchEmpresaRolesClient(empresaId),
    enabled: empresaId !== '',
    initialData: initialRoles,
  })

  return (
    <UsuariosView
      // `key` fuerza a remontar al cambiar de empresa: si no, se arrastrarían los
      // filtros y el modal abierto de la empresa anterior.
      key={empresaId}
      empresaId={empresaId}
      empresaNombre={empresaNombre}
      roles={roles}
      initialData={initialData}
      // Dentro de la barra de filtros, no en una franja propia.
      filterSlot={selector}
    />
  )
}
