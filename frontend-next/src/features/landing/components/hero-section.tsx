'use client'

import { useRef } from 'react'
import { gsap, useGSAP } from '@/lib/gsap/register'

const steps = [
  {
    img: '/landing/hero/activacion-rescue.webp',
    alt: 'Activación inmediata de una alerta mediante un botón físico conectado a la central',
    eyebrow: '01 · Activación',
    title: 'La alerta se dispara en menos de 100 ms',
    text: 'Un botón físico, WhatsApp o la central activan la emergencia con identidad y ubicación desde el primer segundo.',
  },
  {
    img: '/landing/hero/coordinacion-rescue.webp',
    alt: 'Equipo de respuesta coordinando la emergencia desde el teléfono móvil',
    eyebrow: '02 · Coordinación por WhatsApp',
    title: 'Todo el equipo, coordinado por WhatsApp',
    text: 'El equipo recibe la ubicación, confirma disponibilidad y marca “en camino”. Cada respuesta queda trazada.',
  },
  {
    img: '/landing/hero/dispositivos-rescue.webp',
    alt: 'Red de postes y pantallas LED emitiendo una alerta pública sincronizada',
    eyebrow: '03 · Central + dispositivos',
    title: 'Postes y pantallas LED se activan en menos de 1 s',
    text: 'La central activa por MQTT postes, pantallas y alertas audiovisuales en menos de un segundo.',
  },
  {
    img: '/landing/hero/central-trazabilidad-ai.webp?v=20260812-2',
    alt: 'Operadora supervisando controles RESCUE y la ubicación de un equipo durante una alerta',
    eyebrow: '04 · Notificación y cierre',
    title: 'Trazabilidad completa, en tiempo real',
    text: 'WhatsApp y WebApp registran la atención en vivo. Un usuario autorizado cierra la alerta desde la central.',
  },
]

export function HeroSection() {
  const root = useRef<HTMLElement>(null)

  useGSAP(
    () => {
      const el = root.current
      if (!el) return
      if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) return

      const mobile = window.matchMedia('(max-width: 860px)').matches
      const travel = mobile ? 12 : 22

      const media = gsap.utils.toArray<HTMLElement>('[data-hero-img]', el)
      const panels = gsap.utils.toArray<HTMLElement>('[data-hero-panel]', el)
      const bars = gsap.utils.toArray<HTMLElement>('[data-hero-bar]', el)

      // Estado inicial: primer paso visible, el resto oculto.
      gsap.set(media, { autoAlpha: 0, scale: 1.035 })
      gsap.set(media[0], { autoAlpha: 1, scale: 1 })
      gsap.set(panels, { autoAlpha: 0, y: travel })
      gsap.set(panels[0], { autoAlpha: 1, y: 0 })
      gsap.set(bars, { scaleX: 0 })
      gsap.set(bars[0], { scaleX: 1 })

      // Se fija la vista (pin) y el scroll alimenta el cambio de pasos. pinType:'transform'
      // es necesario para que el pin funcione dentro del contenido de ScrollSmoother.
      const tl = gsap.timeline({
        defaults: { ease: 'power1.inOut' },
        scrollTrigger: {
          trigger: el,
          start: 'top top',
          end: `+=${(steps.length - 1) * (mobile ? 82 : 95)}%`,
          pin: true,
          pinType: 'transform',
          anticipatePin: 1,
          scrub: mobile ? 0.45 : 0.7,
          invalidateOnRefresh: true,
        },
      })

      for (let i = 1; i < steps.length; i += 1) {
        const at = `s${i}`
        tl.addLabel(at)
          // Crossfade solapado y zoom corto: funciona igual de suave al avanzar o volver.
          .to(media[i - 1], { autoAlpha: 0, scale: 0.985, duration: 0.65 }, at)
          .fromTo(
            media[i],
            { autoAlpha: 0, scale: 1.035 },
            { autoAlpha: 1, scale: 1, duration: 0.8 },
            at,
          )
          // El texto recorre pocos píxeles para evitar saltos en pantallas pequeñas.
          .to(panels[i - 1], { autoAlpha: 0, y: -travel, duration: 0.45 }, at)
          .fromTo(
            panels[i],
            { autoAlpha: 0, y: travel },
            { autoAlpha: 1, y: 0, duration: 0.58 },
            `${at}+=0.08`,
          )
          // Progreso.
          .to(bars[i - 1], { scaleX: 0, transformOrigin: 'right', duration: 0.5 }, at)
          .to(bars[i], { scaleX: 1, transformOrigin: 'left', duration: 0.5 }, at)
          // Pausa antes del siguiente paso.
          .to({}, { duration: 0.4 })
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
            <img key={step.title} data-hero-img src={step.img} alt={step.alt} decoding="async" />
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
