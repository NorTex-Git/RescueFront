'use client'

import { useRef } from 'react'
import { gsap, useGSAP } from '@/lib/gsap/register'

const steps = [
  {
    img: '/landing/emergencies/incendio.jpg',
    eyebrow: 'Tipo de alerta 01',
    title: 'Incendios',
    text: 'Sensores térmicos y de humo disparan la alerta a la central y a los equipos en menos de 100 ms.',
  },
  {
    img: '/landing/emergencies/inundacion.jpg',
    eyebrow: 'Tipo de alerta 02',
    title: 'Inundaciones',
    text: 'Nivel de agua y lluvia monitoreados en tiempo real para coordinar la evacuación antes del desborde.',
  },
  {
    img: '/landing/emergencies/sismo.jpg',
    eyebrow: 'Tipo de alerta 03',
    title: 'Sismos',
    text: 'La detección temprana activa los protocolos y notifica a toda la red de respuesta en segundos.',
  },
  {
    img: '/landing/emergencies/seguridad.jpg',
    eyebrow: 'Tipo de alerta 04',
    title: 'Seguridad',
    text: 'Intrusión y pánico: la señal se propaga por múltiples canales de visualización al instante.',
  },
]

export function HeroSection() {
  const root = useRef<HTMLElement>(null)

  useGSAP(
    () => {
      const el = root.current
      if (!el) return
      if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) return

      const media = gsap.utils.toArray<HTMLElement>('[data-hero-img]', el)
      const panels = gsap.utils.toArray<HTMLElement>('[data-hero-panel]', el)
      const bars = gsap.utils.toArray<HTMLElement>('[data-hero-bar]', el)

      // Estado inicial: primer paso visible, el resto oculto.
      gsap.set(media, { autoAlpha: 0, scale: 1.08 })
      gsap.set(media[0], { autoAlpha: 1, scale: 1 })
      gsap.set(panels, { autoAlpha: 0, yPercent: 14 })
      gsap.set(panels[0], { autoAlpha: 1, yPercent: 0 })
      gsap.set(bars, { scaleX: 0 })
      gsap.set(bars[0], { scaleX: 1 })

      // Se fija la vista (pin) y el scroll alimenta el cambio de pasos. pinType:'transform'
      // es necesario para que el pin funcione dentro del contenido de ScrollSmoother.
      const tl = gsap.timeline({
        defaults: { ease: 'power2.inOut' },
        scrollTrigger: {
          trigger: el,
          start: 'top top',
          end: `+=${(steps.length - 1) * 100}%`,
          pin: true,
          pinType: 'transform',
          anticipatePin: 1,
          scrub: true,
        },
      })

      for (let i = 1; i < steps.length; i += 1) {
        const at = `s${i}`
        tl.addLabel(at)
          // Imagen: la anterior sale, la nueva entra con un leve zoom (Ken Burns).
          .to(media[i - 1], { autoAlpha: 0, scale: 1.08, duration: 0.5 }, at)
          .fromTo(
            media[i],
            { autoAlpha: 0, scale: 1.08 },
            { autoAlpha: 1, scale: 1, duration: 0.6 },
            at,
          )
          // Texto: el anterior sube y se va, el nuevo entra desde abajo (lado opuesto).
          .to(panels[i - 1], { autoAlpha: 0, yPercent: -14, duration: 0.4 }, at)
          .fromTo(
            panels[i],
            { autoAlpha: 0, yPercent: 14 },
            { autoAlpha: 1, yPercent: 0, duration: 0.5 },
            `${at}+=0.1`,
          )
          // Progreso.
          .to(bars[i - 1], { scaleX: 0, transformOrigin: 'right', duration: 0.4 }, at)
          .to(bars[i], { scaleX: 1, transformOrigin: 'left', duration: 0.4 }, at)
          // Pausa antes del siguiente paso.
          .to({}, { duration: 0.5 })
      }
    },
    { scope: root },
  )

  return (
    <section ref={root} id="solucion" className="hero2" aria-label="Escenarios que resuelve RESCUE">
      <div className="hero2-inner">
        <div className="hero2-text">
          {steps.map((step) => (
            <div key={step.title} data-hero-panel className="hero2-panel">
              <p className="hero2-eyebrow">{step.eyebrow}</p>
              <h2>{step.title}</h2>
              <p>{step.text}</p>
            </div>
          ))}
        </div>
        <div className="hero2-media">
          {steps.map((step) => (
            // eslint-disable-next-line @next/next/no-img-element -- foto self-hosted, sin optimizador
            <img key={step.title} data-hero-img src={step.img} alt={step.title} decoding="async" />
          ))}
        </div>
        <div className="hero2-progress" aria-hidden="true">
          {steps.map((step) => (
            <span key={step.title} className="hero2-dot">
              <i data-hero-bar />
            </span>
          ))}
        </div>
      </div>
    </section>
  )
}
