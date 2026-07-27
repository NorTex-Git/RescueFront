'use client'

import { useState, type ReactNode } from 'react'

import type { FieldOption } from '@/components/ui/form-field'
import { Select } from '@/components/ui/select'

/**
 * Elegir sobre qué empresa se trabaja, para los recursos multi-tenant del portal admin.
 *
 * Nació al necesitarlo la segunda vez —usuarios y tipos de alerta—, que es cuando se
 * ve que no es casualidad. Espeja el bloque `{% if user_role != 'empresa' %}` de
 * `templates/admin/spa/views/usuarios.html:34`: en el portal empresa no existe, porque
 * allí solo hay una empresa posible.
 *
 * Entrega el `<Select>` ya montado en vez de pintarlo él: así cada vista lo coloca
 * donde le encaje —normalmente dentro de la barra de filtros, para no gastar una
 * franja entera en un solo control—.
 */
export function EmpresaScope({
  empresas,
  initialEmpresaId,
  emptyMessage = 'No hay empresas todavía. Crea una en Empresas para poder continuar.',
  children,
}: {
  empresas: FieldOption[]
  /** Empresa que el servidor precargó; vacío si no hay ninguna. */
  initialEmpresaId: string
  emptyMessage?: string
  children: (scope: {
    empresaId: string
    empresaNombre: string
    /** `true` si es la que trae datos del servidor; con las demás hay que pedirlos. */
    isInitial: boolean
    selector: ReactNode
  }) => ReactNode
}) {
  const [empresaId, setEmpresaId] = useState(initialEmpresaId)

  if (empresas.length === 0) {
    return <p className="ios-filters-container ios-blur-bg text-sm opacity-70">{emptyMessage}</p>
  }

  return (
    <>
      {children({
        empresaId,
        empresaNombre: empresas.find((empresa) => empresa.value === empresaId)?.label ?? '',
        isInitial: empresaId === initialEmpresaId,
        selector: (
          <Select
            label="Empresa"
            value={empresaId}
            onChange={setEmpresaId}
            options={empresas}
            // Siempre hay una seleccionada; una opción vacía no tendría sentido.
            placeholder={null}
          />
        ),
      })}
    </>
  )
}
