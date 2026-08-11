'use client'

import { useRouter } from 'next/navigation'
import { useState, type ReactNode } from 'react'
import { toast } from 'sonner'

import { Modal, ModalButton } from '@/components/ui/modal'
import { API_PREFIX } from '@/lib/config'

import { Navbar } from './navbar'
import { Sidebar, type NavItem } from './sidebar'

/**
 * Shell compartido por los portales empresa y admin: navbar + sidebar persistentes
 * y solo el contenido cambia. Es lo que el grupo de rutas de App Router da gratis
 * y que `router.js` implementaba a mano.
 */
export function PortalShell({
  items,
  navbarTitle,
  navbarSubtitle,
  navbarIcon,
  sidebarTitle,
  sidebarSubtitle,
  initials,
  sidebarExtra,
  children,
}: {
  items: NavItem[]
  navbarTitle: string
  navbarSubtitle: string
  navbarIcon: string
  sidebarTitle: string
  sidebarSubtitle: string
  initials: string
  /** Bloque opcional entre la navegación y "Cerrar Sesión" del sidebar. */
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

  return (
    <>
      <Navbar
        title={navbarTitle}
        subtitle={navbarSubtitle}
        icon={navbarIcon}
        menuOpen={menuOpen}
        onToggleMenu={() => setMenuOpen((value) => !value)}
      />

      <div className="flex min-h-screen bg-[var(--shell-bg)] pt-[68px]">
        <Sidebar
          items={items}
          title={sidebarTitle}
          subtitle={sidebarSubtitle}
          initials={initials}
          open={menuOpen}
          onClose={() => setMenuOpen(false)}
          onLogout={() => setConfirmLogout(true)}
          extra={sidebarExtra}
        />

        <main className="min-w-0 flex-1">{children}</main>
      </div>

      <Modal
        open={confirmLogout}
        onClose={() => setConfirmLogout(false)}
        title="Cerrar sesión"
        icon="fas fa-sign-out-alt"
        description="¿Seguro que quieres salir?"
        size="sm"
        footer={
          <>
            <ModalButton icon="fas fa-times" onClick={() => setConfirmLogout(false)}>
              Cancelar
            </ModalButton>
            <ModalButton
              variant="primary"
              icon="fas fa-sign-out-alt"
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
    </>
  )
}
