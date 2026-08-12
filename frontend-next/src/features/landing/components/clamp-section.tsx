'use client'

import { useRef } from 'react'
import { gsap, ScrollTrigger, useGSAP } from '@/lib/gsap/register'

const emergencies = [
  { label: 'Incendios', className: 'emergency-fire', src: '/landing/emergencies/incendio.jpg' },
  {
    label: 'Inundaciones',
    className: 'emergency-flood',
    src: '/landing/emergencies/inundacion.jpg',
  },
  { label: 'Sismos', className: 'emergency-quake', src: '/landing/emergencies/sismo.jpg' },
  { label: 'Seguridad', className: 'emergency-security', src: '/landing/emergencies/seguridad.jpg' },
]

export function ClampSection() {
  const root = useRef<HTMLElement>(null)
  useGSAP(
    () => {
      if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) return
      const titleEl = root.current!.querySelector<HTMLElement>('[data-clamp-title]')!
      const zoomEl = root.current!.querySelector<HTMLElement>('[data-clamp-zoom]')!
      const wordEl = zoomEl.closest<HTMLElement>('[data-clamp-word]')

      // Origen del zoom = centro exacto de la letra objetivo (en % del título), para
      // que la cámara se "meta" dentro de esa letra. Se resta el desplazamiento `y` que
      // la animación de entrada aplica a la palabra: si no, cuando esto se recalcula
      // (onRefresh / al crear ScrollSmoother) con el texto aún desplazado, el punto de
      // zoom se corre hacia abajo.
      const setOrigin = () => {
        const wy = wordEl ? Number(gsap.getProperty(wordEl, 'y')) || 0 : 0
        const t = titleEl.getBoundingClientRect()
        const z = zoomEl.getBoundingClientRect()
        const ox = ((z.left + z.width / 2 - t.left) / t.width) * 100
        const oy = ((z.top - wy + z.height / 2 - t.top) / t.height) * 100
        gsap.set(titleEl, { transformOrigin: `${ox}% ${oy}%` })
      }
      setOrigin()
      // Recalcular cuando la fuente termine de cargar (cambia el ancho de las letras).
      document.fonts?.ready?.then(() => {
        setOrigin()
        ScrollTrigger.refresh()
      })

      // El título está above-the-fold: se revela al montar, no atado al scroll.
      gsap.from('[data-clamp-word]', {
        y: 80,
        opacity: 0,
        duration: 0.9,
        stagger: 0.12,
        ease: 'power3.out',
        delay: 0.15,
      })

      // Transición al hacer scroll: la vista queda FIJA (pin) mientras la cámara entra
      // dentro de una letra (zoom fuerte con origen en esa letra) y el fondo funde a
      // blanco. pinType:'transform' es necesario para que el pin funcione dentro del
      // contenido transformado de ScrollSmoother. Al soltar el pin se cae al tope del hero.
      const header = document.querySelector('.landing-header-shell')

      const tl = gsap.timeline({
        scrollTrigger: {
          trigger: root.current,
          start: 'top top',
          end: '+=100%',
          pin: true,
          // pinSpacing:false → no reserva altura extra: el hero sube por detrás durante
          // el pin y al fundir el clamp ya está en su tope (sin hueco ni scroll de más).
          pinSpacing: false,
          pinType: 'transform',
          anticipatePin: 1,
          scrub: true,
          invalidateOnRefresh: true,
          onRefresh: setOrigin,
          // El header pasa a claro en cuanto el cristal blanco domina (no tan abajo).
          onUpdate: (self) => header?.classList.toggle('header-on-light', self.progress > 0.4),
        },
      })
      tl.to('[data-emergency-card]', { opacity: 0, scale: 1.12, stagger: 0.02, ease: 'power1.in' }, 0)
        .to(titleEl, { scale: 20, ease: 'power2.in' }, 0)
        .to(['.landing-eyebrow', '[data-clamp-sub]'], { opacity: 0, ease: 'power1.out' }, 0)
        // Blanco temprano: la cámara se mete en blanco, no en el hueco negro de la letra.
        .to('[data-clamp-whiteout]', { opacity: 1, ease: 'power1.in' }, 0.25)
        .to(titleEl, { opacity: 0, ease: 'power1.in' }, 0.55)
        // Al final se funde el clamp para revelar el hero que ya subió por detrás.
        .to(root.current, { opacity: 0, ease: 'power1.in', duration: 0.18 }, 0.82)
    },
    { scope: root },
  )
  return (
    <section ref={root} id="inicio" className="clamp-section" aria-labelledby="clamp-title">
      <div className="clamp-copy">
        <p className="landing-eyebrow">Sistema integral de emergencias</p>
        <h1 id="clamp-title" data-clamp-title>
          <span data-clamp-word>
            RE<span data-clamp-zoom>S</span>CUE
          </span>
          <span data-clamp-word>SYSTEM</span>
        </h1>
        <p data-clamp-sub>Una alerta. Todos los equipos coordinados.</p>
      </div>
      <div className="clamp-whiteout" data-clamp-whiteout aria-hidden="true" />
      <div className="emergency-grid" aria-label="Escenarios que integra RESCUE">
        {emergencies.map((item) => (
          <article
            key={item.label}
            data-emergency-card
            className={`emergency-card ${item.className}`}
          >
            {/* eslint-disable-next-line @next/next/no-img-element -- foto decorativa self-hosted */}
            <img src={item.src} alt="" loading="lazy" decoding="async" aria-hidden="true" />
            <span>{item.label}</span>
          </article>
        ))}
      </div>
    </section>
  )
}
