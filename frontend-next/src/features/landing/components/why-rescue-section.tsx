import { ScrollExpand } from '@/components/ui/scroll-expand'

const reasons = [
  {
    number: '01',
    title: 'Una respuesta conectada',
    text: 'Personas, central y dispositivos físicos reaccionan como una sola red.',
  },
  {
    number: '02',
    title: 'Trazabilidad real',
    text: 'Cada activación, confirmación y cierre queda registrado en tiempo real.',
  },
  {
    number: '03',
    title: 'Tecnología que escala',
    text: 'La misma operación se adapta a una sede, una empresa o toda una ciudad.',
  },
]

export function WhyRescueSection() {
  return (
    <section className="why-rescue-section" aria-labelledby="why-rescue-heading">
      <ScrollExpand
        src="/landing/why-rescue-dashboard-v2.webp"
        alt="Dashboard RESCUE conectado con mapas, dispositivos y controles de una central de emergencias"
        title="¿Por qué trabajar con nosotros?"
        scrollHint="Desliza para descubrir"
        startWidth={42}
        startHeight={58}
        startRadius={24}
        endRadius={0}
        mediaZoom={1.25}
        scrollDistance={1.15}
        holdDistance={0.42}
        smoothing={0.12}
        overlayScrim={0.72}
        useWindowScroll
      >
        <div className="why-rescue-content">
          <p className="landing-eyebrow">Más que una plataforma</p>
          <h2 id="why-rescue-heading">La tecnología acompaña toda la respuesta.</h2>
          <div className="why-rescue-grid">
            {reasons.map((reason) => (
              <article key={reason.number} className="why-rescue-card">
                <span>{reason.number}</span>
                <h3>{reason.title}</h3>
                <p>{reason.text}</p>
              </article>
            ))}
          </div>
        </div>
      </ScrollExpand>
    </section>
  )
}
