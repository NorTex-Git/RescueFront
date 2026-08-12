import Image from 'next/image'
import Link from 'next/link'
import type { ReactNode } from 'react'
import { Icon } from '@/components/ui/icon'
import { GlassSurface } from '@/components/ui/glass-surface'

export function LandingHeader({
  loginPage = false,
  action,
}: {
  loginPage?: boolean
  action?: ReactNode
}) {
  return (
    <header className="landing-header-shell">
      <GlassSurface
        width="100%"
        height="100%"
        borderRadius={18}
        displace={0.5}
        distortionScale={-150}
        redOffset={0}
        greenOffset={8}
        blueOffset={16}
        brightness={42}
        opacity={0.9}
        backgroundOpacity={0.08}
        saturation={1.35}
        mixBlendMode="screen"
        className="landing-header"
      >
        <Link className="landing-brand" href="/#inicio" aria-label="RESCUE, ir al inicio">
          {loginPage ? (
            <span className="landing-brand-logo-switch" aria-hidden="true">
              <Image
                src="/RESCUE_logo_transparent_darktext.png"
                alt=""
                width={497}
                height={164}
                priority
                className="landing-brand-logo landing-brand-logo--light"
              />
              <Image
                src="/RESCUE_logo_transparent.png"
                alt=""
                width={497}
                height={164}
                priority
                className="landing-brand-logo landing-brand-logo--dark"
              />
            </span>
          ) : (
            <span className="landing-brand-logo-switch" aria-hidden="false">
              <Image
                src="/RESCUE_logo_transparent.png"
                alt="RESCUE"
                width={497}
                height={164}
                priority
                className="landing-brand-logo landing-brand-logo--on-dark"
              />
              <Image
                src="/RESCUE_logo_transparent_darktext.png"
                alt=""
                width={497}
                height={164}
                priority
                className="landing-brand-logo landing-brand-logo--on-light"
              />
            </span>
          )}
        </Link>
        <nav className="landing-nav" aria-label="Navegación principal">
          <Link href="/#solucion">Solución</Link>
          <Link href="/#contacto">Contacto</Link>
          {action}
          {loginPage ? (
            <Link className="landing-login" href="/">
              Volver al inicio <Icon name="chevron-left" />
            </Link>
          ) : (
            <Link className="landing-login" href="/login">
              Ingresar <Icon name="right-to-bracket" />
            </Link>
          )}
        </nav>
      </GlassSurface>
    </header>
  )
}
