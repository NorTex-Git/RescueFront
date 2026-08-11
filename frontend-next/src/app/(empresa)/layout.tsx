import type { ReactNode } from 'react'

import { PortalShell } from '@/components/shell/portal-shell'
import type { NavItem } from '@/components/shell/sidebar'
import { requireSession } from '@/lib/auth/session'

import '@/styles/portal.css'

const NAV_ITEMS: NavItem[] = [
  { href: '/empresa', label: 'Dashboard', icon: 'fas fa-tachometer-alt' },
  { href: '/empresa/usuarios', label: 'Usuarios', icon: 'fas fa-users' },
  { href: '/empresa/hardware', label: 'Hardware', icon: 'fas fa-microchip' },
  { href: '/empresa/stats', label: 'Estadísticas', icon: 'fas fa-chart-line' },
  { href: '/empresa/alertas', label: 'Alertas', icon: 'fas fa-exclamation-triangle' },
  {
    href: '/empresa/alertas-inactivas',
    label: 'Alertas Inactivas',
    icon: 'fas fa-bell-slash',
  },
]

export default async function EmpresaLayout({ children }: { children: ReactNode }) {
  const session = await requireSession()
  const nombre = session.displayName

  return (
    <PortalShell
      items={NAV_ITEMS}
      userName={nombre}
      userRole="Empresa"
      initials={nombre.slice(0, 2).toUpperCase()}
    >
      {children}
    </PortalShell>
  )
}
