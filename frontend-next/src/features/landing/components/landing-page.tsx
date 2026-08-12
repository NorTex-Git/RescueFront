'use client'

import { useRef } from 'react'

import { ScrollSmoother, ScrollTrigger, useGSAP } from '@/lib/gsap/register'
import { ClampSection } from './clamp-section'
import { ContactSection } from './contact-section'
import { HeroSection } from './hero-section'
import { LandingFooter } from './landing-footer'
import { LandingHeader } from './landing-header'
import { RescuePreloader } from './rescue-preloader'
import { WhyRescueSection } from './why-rescue-section'

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

      // La sección expansiva usa fondo oscuro; mantenemos el contraste del header al entrar.
      const header = document.querySelector('.landing-header-shell')
      const headerTheme = ScrollTrigger.create({
        trigger: '.why-rescue-section',
        start: 'top 12%',
        onEnter: () => header?.classList.remove('header-on-light'),
        onLeaveBack: () => header?.classList.add('header-on-light'),
      })

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
      <div id="smooth-wrapper" ref={wrapper}>
        <div id="smooth-content">
          <ClampSection />
          <HeroSection />
          <WhyRescueSection />
          <ContactSection />
          <LandingFooter year={year} />
        </div>
      </div>
    </main>
  )
}
