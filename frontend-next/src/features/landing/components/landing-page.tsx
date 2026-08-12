'use client'

import dynamic from 'next/dynamic'
import { useRef } from 'react'

import { GradualBlur } from '@/components/ui/gradual-blur'
import { ScrollSmoother, ScrollTrigger, useGSAP } from '@/lib/gsap/register'
import { ClampSection } from './clamp-section'
import { ContactSection } from './contact-section'
import { HeroSection } from './hero-section'
import { LandingFooter } from './landing-footer'
import { LandingHeader } from './landing-header'
import { RescuePreloader } from './rescue-preloader'

const EmergencyTunnel = dynamic(() => import('./emergency-tunnel'), {
  ssr: false,
  loading: () => (
    <section className="tunnel-section tunnel-loading">
      <span>Cargando experiencia RESCUE…</span>
    </section>
  ),
})

export function LandingPage({ year }: { year: number }) {
  const wrapper = useRef<HTMLDivElement>(null)

  useGSAP(
    () => {
      const reduce = window.matchMedia('(prefers-reduced-motion: reduce)').matches

      // Con reduced-motion no virtualizamos el scroll: se usa el scroll nativo.
      const smoother = reduce
        ? null
        : ScrollSmoother.create({
            wrapper: wrapper.current!,
            content: '#smooth-content',
            smooth: 1.4,
            effects: true, // habilita data-speed / data-lag (parallax de la clamp)
            normalizeScroll: true,
          })

      // El header pasa a claro durante la transición del clamp (lo controla su propio
      // onUpdate por progreso). Aquí solo lo devolvemos a oscuro al entrar al túnel y
      // lo reactivamos al volver al hero.
      const header = document.querySelector('.landing-header-shell')
      const headerTheme = ScrollTrigger.create({
        trigger: '.tunnel-section',
        start: 'top 12%',
        onEnter: () => header?.classList.remove('header-on-light'),
        onLeaveBack: () => header?.classList.add('header-on-light'),
      })

      // El túnel WebGL lee getBoundingClientRect; refrescamos tras el layout.
      ScrollTrigger.refresh()

      return () => {
        headerTheme.kill()
        smoother?.kill()
      }
    },
    { scope: wrapper },
  )

  return (
    <main className="rescue-landing">
      <RescuePreloader />
      <LandingHeader />
      <GradualBlur
        target="page"
        position="bottom"
        height="7rem"
        strength={1.7}
        divCount={5}
        curve="bezier"
        exponential
        opacity={0.9}
        zIndex={45}
      />
      <div id="smooth-wrapper" ref={wrapper}>
        <div id="smooth-content">
          <ClampSection />
          <HeroSection />
          <EmergencyTunnel />
          <ContactSection />
          <LandingFooter year={year} />
        </div>
      </div>
    </main>
  )
}
