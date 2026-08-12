'use client'

import { useEffect, useState } from 'react'

export function RescuePreloader() {
  const [visible, setVisible] = useState(true)
  useEffect(() => {
    const reduced = window.matchMedia('(prefers-reduced-motion: reduce)').matches
    const timer = window.setTimeout(() => setVisible(false), reduced ? 80 : 850)
    return () => window.clearTimeout(timer)
  }, [])
  if (!visible) return null
  return (
    <div className="rescue-preloader" role="status" aria-live="polite">
      <div className="preloader-pulse">
        <span />
      </div>
      <strong>RESCUE</strong>
      <span>Conectando sistemas de respuesta</span>
    </div>
  )
}
