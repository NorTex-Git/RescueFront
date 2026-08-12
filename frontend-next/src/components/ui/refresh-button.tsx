'use client'

import { Icon } from '@/components/ui/icon'
import { useRouter } from 'next/navigation'
import { useState } from 'react'

import { cn } from '@/lib/utils'

/** Botón circular que vuelve a pedir los datos del Server Component — acción real. */
export function RefreshButton() {
  const router = useRouter()
  const [spinning, setSpinning] = useState(false)

  return (
    <button
      type="button"
      onClick={() => {
        setSpinning(true)
        router.refresh()
        setTimeout(() => setSpinning(false), 500)
      }}
      aria-label="Actualizar"
      title="Actualizar"
      className="flex size-10 items-center justify-center rounded-full border border-gray-200 bg-white text-gray-500 transition-colors hover:bg-gray-50 dark:border-white/10 dark:bg-white/5 dark:text-white/60 dark:hover:bg-white/10"
    >
      <Icon name="rotate" className={cn(spinning && 'animate-spin')} />
    </button>
  )
}
