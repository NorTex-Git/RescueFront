'use client'

import { useState, type ReactNode } from 'react'

import { Modal, ModalButton, type ModalSize } from './modal'

/**
 * Confirmación genérica. Cubre los dos casos que cada `*-modals.js` reimplementaba:
 * borrar un registro y activar/desactivar (`toggle-status`).
 *
 * Reemplaza también los `Swal.fire` de SweetAlert2.
 */
export function ConfirmDialog({
  open,
  onClose,
  onConfirm,
  title,
  description,
  confirmLabel = 'Confirmar',
  confirmVariant = 'primary',
  icon = 'check',
  headerIcon,
  size = 'xs',
  children,
}: {
  open: boolean
  onClose: () => void
  /** Debe lanzar para señalar error; el mensaje se muestra dentro del diálogo. */
  onConfirm: () => Promise<void>
  title: string
  description?: string
  confirmLabel?: string
  /** `danger` para lo irreversible (eliminar); `primary` para el resto. */
  confirmVariant?: 'primary' | 'danger'
  /** Icono del botón de confirmar. */
  icon?: string
  /** Icono del encabezado. */
  headerIcon?: string
  size?: ModalSize
  children?: ReactNode
}) {
  const [pending, setPending] = useState(false)
  const [error, setError] = useState<string | null>(null)

  async function confirm() {
    setPending(true)
    setError(null)
    try {
      await onConfirm()
      onClose()
    } catch (caught) {
      setError(caught instanceof Error ? caught.message : 'No se pudo completar la operación.')
    } finally {
      setPending(false)
    }
  }

  function close() {
    if (pending) return
    // El error no debe sobrevivir al cierre: reabrir mostraría un fallo ya resuelto.
    setError(null)
    onClose()
  }

  return (
    <Modal
      open={open}
      onClose={close}
      title={title}
      description={description}
      size={size}
      icon={headerIcon}
      footer={
        <>
          <ModalButton icon="times" onClick={close} disabled={pending}>
            Cancelar
          </ModalButton>
          <ModalButton variant={confirmVariant} icon={icon} loading={pending} onClick={confirm}>
            {confirmLabel}
          </ModalButton>
        </>
      }
    >
      {children}
      {error && (
        <p role="alert" className="mt-3 text-sm text-red-300">
          {error}
        </p>
      )}
    </Modal>
  )
}
