'use client'

import { useCallback, useState } from 'react'

/**
 * Estado de los modales de un CRUD. Cada `*-modals.js` llevaba este mismo control con
 * media docena de `window.*` y flags sueltos; aquí es un solo `useState`.
 *
 * Solo puede haber un modal abierto a la vez, que es como se comporta la UI actual.
 */
export type CrudModal = 'create' | 'edit' | 'detail' | 'delete' | 'toggle'

export function useCrudModals<T>() {
  const [state, setState] = useState<{ modal: CrudModal | null; item: T | null }>({
    modal: null,
    item: null,
  })

  const open = useCallback((modal: CrudModal, item: T | null = null) => {
    setState({ modal, item })
  }, [])

  const close = useCallback(() => {
    // Se conserva `item` para que el contenido no desaparezca durante la animación
    // de cierre; la siguiente apertura lo reemplaza.
    setState((current) => ({ modal: null, item: current.item }))
  }, [])

  return {
    /** Modal abierto, o `null`. */
    modal: state.modal,
    /** Registro sobre el que se opera. `null` al crear. */
    item: state.item,
    isOpen: (modal: CrudModal) => state.modal === modal,
    open,
    close,
    openCreate: () => open('create'),
    openEdit: (item: T) => open('edit', item),
    openDetail: (item: T) => open('detail', item),
    openDelete: (item: T) => open('delete', item),
    openToggle: (item: T) => open('toggle', item),
  }
}
