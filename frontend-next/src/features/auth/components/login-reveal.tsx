'use client'

import { useRef, type ReactNode } from 'react'

import { gsap, useGSAP } from '@/lib/gsap/register'

/**
 * Porta el reveal de `static/js/login_visuals.js`.
 *
 * `login.css` deja `.fade-in-up` en `opacity: 0` y solo las reglas `:nth-child(1..4)`
 * lo animan; el resto depende de este JS. Sin él los campos quedan invisibles.
 *
 * `useGSAP` envuelve todo en un `gsap.context` con `scope`, así que al desmontar hace
 * `revert()` y no quedan timelines vivos tras navegar (sección 6.2 del plan).
 */
export function LoginReveal({ children }: { children: ReactNode }) {
  const container = useRef<HTMLDivElement>(null)

  useGSAP(
    () => {
      gsap.set('.fade-in-up', { opacity: 0, y: 30 })
      gsap.set('.fade-in-scale', { opacity: 0, scale: 0.8 })

      gsap
        .timeline({ delay: 0.3 })
        .to('.fade-in-scale', { opacity: 1, scale: 1, duration: 0.6, ease: 'back.out(1.2)' })
        .to(
          '.fade-in-up',
          { opacity: 1, y: 0, duration: 0.5, stagger: 0.1, ease: 'power2.out' },
          '-=0.3',
        )
    },
    { scope: container },
  )

  return <div ref={container}>{children}</div>
}
