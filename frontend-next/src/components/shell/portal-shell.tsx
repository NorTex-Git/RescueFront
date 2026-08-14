'use client'

import { useRouter } from 'next/navigation'
import { useState, type ReactNode } from 'react'

import { Modal, ModalButton } from '@/components/ui/modal'
import { API_PREFIX } from '@/lib/config'
import { AlertSoundNotifier } from '@/features/alerts/components/alert-sound-notifier'
import { RealtimeProvider } from '@/features/realtime/realtime-provider'

import { Navbar } from './navbar'
import { Sidebar, type NavItem } from './sidebar'

/**
 * Shell compartido por los portales empresa y admin: navbar + sidebar persistentes
 * y solo el contenido cambia. Es lo que el grupo de rutas de App Router da gratis
 * y que `router.js` implementaba a mano.
 */
export function PortalShell({
  items,
  userName,
  userRole,
  initials,
  realtimeEmpresaId,
  sidebarExtra,
  children,
}: {
  items: NavItem[]
  userName: string
  userRole: string
  initials: string
  /** Acota snapshots y cachés en tiempo real al tenant autenticado. */
  realtimeEmpresaId?: string
  /** Bloque persistente sobre "Cerrar Sesión" del sidebar. */
  sidebarExtra?: ReactNode
  children: ReactNode
}) {
  const router = useRouter()
  const [menuOpen, setMenuOpen] = useState(false)
  const [confirmLogout, setConfirmLogout] = useState(false)
  const [loggingOut, setLoggingOut] = useState(false)

  async function handleLogout() {
    setLoggingOut(true)
    try {
      await fetch(`${API_PREFIX}/auth/logout`, { method: 'POST', credentials: 'same-origin' })
    } catch {
      // Aunque falle la llamada, las cookies locales se limpian del lado del servidor.
    }
    // `refresh()` invalida el árbol renderizado en servidor antes de salir, para que
    // no quede en caché una página con datos de la sesión anterior.
    router.refresh()
    router.replace('/login')
  }

  const isEmpresa = userRole === 'Empresa'

  return (
    <RealtimeProvider empresaId={realtimeEmpresaId}>
      {/* Solo la vista empresa reproduce el sonido/popup al llegar una alerta. */}
      {isEmpresa && <AlertSoundNotifier />}
      <Navbar
        title={userName}
        subtitle={userRole}
        initials={initials}
        menuOpen={menuOpen}
        onToggleMenu={() => setMenuOpen((value) => !value)}
        alertsHref={isEmpresa ? '/empresa/alertas' : undefined}
        hardwareHref={isEmpresa ? '/empresa/hardware' : '/admin/hardware'}
        hardwareOnly={!isEmpresa}
      />

      <div className="flex min-h-screen max-w-full overflow-x-clip bg-[var(--shell-bg)] pt-[68px]">
        <Sidebar
          items={items}
          open={menuOpen}
          onClose={() => setMenuOpen(false)}
          onLogout={() => setConfirmLogout(true)}
          extra={sidebarExtra}
        />

        <main className="min-w-0 flex-1 overflow-x-clip">{children}</main>
      </div>

      <Modal
        open={confirmLogout}
        onClose={() => setConfirmLogout(false)}
        title="Cerrar sesión"
        icon="sign-out-alt"
        description="¿Seguro que quieres salir?"
        size="sm"
        footer={
          <>
            <ModalButton icon="times" onClick={() => setConfirmLogout(false)}>
              Cancelar
            </ModalButton>
            <ModalButton
              variant="primary"
              icon="sign-out-alt"
              loading={loggingOut}
              onClick={handleLogout}
            >
              Salir
            </ModalButton>
          </>
        }
      >
        <p className="text-sm text-gray-700 dark:text-white/80">
          Tu sesión actual se cerrará y volverás al inicio de sesión.
        </p>
      </Modal>
    </RealtimeProvider>
  )
}
