import Link from 'next/link'

import { PageHeader } from '@/components/shell/page-header'
import { requireSession } from '@/lib/auth/session'

/**
 * Índice del portal. El dashboard real es el punto 2 de la Fase 3; por ahora esta
 * página solo confirma la sesión y da entrada a lo ya migrado, en vez de fingir
 * un dashboard con datos vacíos.
 */
export default async function EmpresaDashboardPage() {
  const session = await requireSession()

  return (
    <div className="mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-8">
      <PageHeader
        icon="fas fa-tachometer-alt"
        title="Panel de Control"
        subtitle={<>Sesión iniciada como {session.displayName}</>}
      />

      <div className="ios-filters-container ios-blur-bg">
        <p className="text-sm text-gray-600 dark:text-white/70">
          El dashboard se migra en el siguiente paso de la Fase 3. Ya disponible:{' '}
          <Link href="/empresa/stats" className="font-semibold text-blue-500 hover:underline">
            Estadísticas
          </Link>
          .
        </p>
      </div>
    </div>
  )
}
