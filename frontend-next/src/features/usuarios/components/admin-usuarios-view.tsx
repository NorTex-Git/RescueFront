'use client'

import { useQuery } from '@tanstack/react-query'
import { useRouter } from 'next/navigation'

import type { FieldOption } from '@/components/ui/form-field'
import { LoadErrorState } from '@/components/ui/load-error-state'
import { EmpresaScope } from '@/features/empresas/components/empresa-scope'
import {
  initialDataOf,
  toLoadError,
  type LoadResult,
} from '@/load-result'

import { fetchEmpresaRolesClient } from '../api'
import type { Usuario } from '../types'

import { UsuariosView } from './usuarios-view'

/**
 * Usuarios en el portal admin. **Es la misma vista que la del portal empresa**, con lo
 * único que cambia entre los dos: el admin elige de qué empresa está viendo la gente,
 * mientras que la empresa solo puede ver la suya.
 */
export function AdminUsuariosView({
  empresasLoad,
  initialEmpresaId,
  initialRolesLoad,
  initialLoad,
}: {
  empresasLoad: LoadResult<FieldOption[]>
  initialEmpresaId: string
  initialRolesLoad: LoadResult<string[]>
  initialLoad: LoadResult<Usuario[]>
}) {
  const router = useRouter()
  if (!empresasLoad.ok) {
    return <LoadErrorState error={empresasLoad.error} onRetry={() => router.refresh()} />
  }

  return (
    <EmpresaScope
      empresas={empresasLoad.data}
      initialEmpresaId={initialEmpresaId}
      emptyMessage="No hay empresas todavía. Crea una en Empresas para poder darle usuarios."
    >
      {({ empresaId, empresaNombre, isInitial, selector }) => (
        <UsuariosBridge
          empresaId={empresaId}
          empresaNombre={empresaNombre}
          selector={selector}
          initialRolesLoad={isInitial ? initialRolesLoad : undefined}
          initialLoad={isInitial ? initialLoad : undefined}
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
  initialRolesLoad,
  initialLoad,
}: {
  empresaId: string
  empresaNombre: string
  selector: React.ReactNode
  initialRolesLoad?: LoadResult<string[]>
  initialLoad?: LoadResult<Usuario[]>
}) {
  const rolesQuery = useQuery({
    queryKey: ['empresa-roles', empresaId],
    queryFn: () => fetchEmpresaRolesClient(empresaId),
    enabled: empresaId !== '',
    initialData: initialRolesLoad ? initialDataOf(initialRolesLoad) : undefined,
  })
  const rolesLoad: LoadResult<string[]> = rolesQuery.isError
    ? { ok: false, error: toLoadError(rolesQuery.error, 'roles de empresa') }
    : { ok: true, data: rolesQuery.data ?? [] }

  return (
    <UsuariosView
      // `key` fuerza a remontar al cambiar de empresa: si no, se arrastrarían los
      // filtros y el modal abierto de la empresa anterior.
      key={empresaId}
      empresaId={empresaId}
      empresaNombre={empresaNombre}
      rolesLoad={rolesLoad}
      initialLoad={initialLoad}
      onRetryRoles={() => void rolesQuery.refetch()}
      // Dentro de la barra de filtros, no en una franja propia.
      filterSlot={selector}
    />
  )
}
