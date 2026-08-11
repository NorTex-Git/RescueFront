import type { ReactNode } from 'react'

import { PortalShell } from '@/components/shell/portal-shell'
import type { NavItem } from '@/components/shell/sidebar'
import { SidebarActivity } from '@/components/shell/sidebar-activity'
import { fetchCoverageStats, fetchDashboardStats } from '@/features/dashboard/server'
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
  const [stats, coverage] = await Promise.all([fetchDashboardStats(), fetchCoverageStats()])

  // Solo métricas ya verificadas contra el resto de la app; sin datos inventados. El
  // mockup también tenía "Última sincronía", que no tiene fuente real — queda fuera.
  const activityItems = [
    ...(typeof stats.total_alertas === 'number'
      ? [{ label: 'Alertas activas', value: stats.total_alertas, tone: 'danger' as const }]
      : []),
    { label: 'Equipos activos', value: coverage.equiposActivos, tone: 'success' as const },
  ]

  return (
    <PortalShell
      items={NAV_ITEMS}
      userName={session.displayName}
      userRole="Super Administrador"
      initials={session.displayName.slice(0, 2).toUpperCase()}
      sidebarExtra={<SidebarActivity items={activityItems} />}
    >
      {children}
    </PortalShell>
  )
}
