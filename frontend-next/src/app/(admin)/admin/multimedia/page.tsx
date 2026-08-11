import type { Metadata } from 'next'

import { AdminMultimediaView } from '@/features/media/components/admin-multimedia-view'
import { fetchMediaFolders } from '@/features/media/server'
import { preload } from '@/preload'

export const metadata: Metadata = { title: 'Multimedia — RESCUE' }

export default async function MultimediaPage() {
  const foldersLoad = await preload('carpetas multimedia', fetchMediaFolders)
  return (
    <div className="mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-8">
      <AdminMultimediaView initialFoldersLoad={foldersLoad} />
    </div>
  )
}
