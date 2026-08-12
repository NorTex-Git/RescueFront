import type { Metadata } from 'next'

import { GlassSurface } from '@/components/ui/glass-surface'
import { Icon } from '@/components/ui/icon'
import { LoginForm } from '@/features/auth/components/login-form'
import { ThemeToggleButton } from '@/features/auth/components/theme-toggle-button'
import { LandingHeader } from '@/features/landing/components/landing-header'

import '@/features/landing/landing.css'
import '@/styles/login.css'

export const metadata: Metadata = {
  // Mantiene la continuidad visual con la landing: solo se ve el favicon en la pestaña.
  title: '\u200B',
  description: 'Acceso seguro a la plataforma RESCUE.',
}

export default async function LoginPage(props: PageProps<'/login'>) {
  const { next, error } = await props.searchParams

  return (
    <main className="rescue-login">
      <div className="login-grid" aria-hidden="true" />
      <div className="login-orbit login-orbit-one" aria-hidden="true" />
      <div className="login-orbit login-orbit-two" aria-hidden="true" />
      <div className="login-signal" aria-hidden="true">
        <span />
        <span />
        <span />
      </div>

      <LandingHeader loginPage action={<ThemeToggleButton embedded />} />

      <section className="login-stage" aria-labelledby="login-title">
        <div className="login-intro">
          <h1>
            Coordina.
            <br />
            <em>Responde.</em>
            <br />
            Protege.
          </h1>
          <p>
            Accede al centro de control que conecta alertas, equipos y canales de respuesta en
            tiempo real.
          </p>
          <div className="login-capabilities" aria-label="Capacidades de la plataforma">
            <span>
              <Icon name="tower-broadcast" /> Alertas en vivo
            </span>
            <span>
              <Icon name="users" /> Equipos coordinados
            </span>
          </div>
        </div>

        <GlassSurface
          width="100%"
          height="auto"
          borderRadius={28}
          displace={0.35}
          distortionScale={-120}
          redOffset={0}
          greenOffset={7}
          blueOffset={14}
          brightness={44}
          opacity={0.9}
          backgroundOpacity={0.08}
          saturation={1.3}
          mixBlendMode="screen"
          className="login-surface"
        >
          <div className="login-card-content">
            <div className="login-card-heading">
              <span className="login-card-icon">
                <Icon name="fingerprint" />
              </span>
              <div>
                <p>Acceso seguro</p>
                <h2 id="login-title">Iniciar sesión</h2>
              </div>
            </div>
            <p className="login-card-description">
              Ingresa tus credenciales para continuar al centro de control.
            </p>
            <LoginForm
              next={typeof next === 'string' ? next : undefined}
              initialError={typeof error === 'string' ? error : undefined}
            />
            <p className="login-help">
              ¿No tienes acceso? <span>Contacta al administrador de tu organización.</span>
            </p>
          </div>
        </GlassSurface>
      </section>
    </main>
  )
}
