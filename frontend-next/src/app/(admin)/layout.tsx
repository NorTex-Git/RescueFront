import type { ReactNode } from 'react'

import { PortalShell } from '@/components/shell/portal-shell'
import type { NavItem } from '@/components/shell/sidebar'
import { requireSession } from '@/lib/auth/session'

import '@/styles/portal.css'

/** Mismo orden y mismos iconos que `templates/admin/spa/parts/sidebar.html`. */
const NAV_ITEMS: NavItem[] = [
  { href: '/admin', label: 'Dashboard', icon: 'fas fa-tachometer-alt' },
  { href: '/admin/empresas', label: 'Empresas', icon: 'fas fa-building' },
  { href: '/admin/usuarios', label: 'Usuarios', icon: 'fas fa-users' },
  { href: '/admin/hardware', label: 'Hardware', icon: 'fas fa-microchip' },
  { href: '/admin/alert-types', label: 'Tipos Alertas', icon: 'fas fa-bell' },
  { href: '/admin/company-types', label: 'Tipos Empresa', icon: 'fas fa-layer-group' },
  { href: '/admin/multimedia', label: 'Multimedia', icon: 'fas fa-photo-video' },
]

export default async function AdminLayout({ children }: { children: ReactNode }) {
  const session = await requireSession()

  return (
    <PortalShell
      items={NAV_ITEMS}
      navbarTitle="Panel Admin"
      navbarSubtitle="Control Operativo"
      navbarIcon="fas fa-shield-alt"
      sidebarTitle={session.displayName}
      sidebarSubtitle="Super Administrador"
      initials={session.displayName.slice(0, 2).toUpperCase()}
    >
      {children}
    </PortalShell>
  )
}
