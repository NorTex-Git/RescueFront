import Link from 'next/link'

export function LandingFooter({ year }: { year: number }) {
  return (
    <footer className="landing-footer">
      <strong>RESCUE</strong>
      <span>Sistema integral de respuesta a emergencias</span>
      <Link href="/login">Acceso a la plataforma</Link>
      <small>© {year} RESCUE</small>
    </footer>
  )
}
