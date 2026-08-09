import type { Metadata } from 'next'

import { LoginForm } from '@/features/auth/components/login-form'
import { LoginReveal } from '@/features/auth/components/login-reveal'

import '@/styles/login.css'

export const metadata: Metadata = {
  title: 'Iniciar Sesión — RESCUE',
}

/**
 * Paridad visual con `templates/login.html`: se reutilizan tal cual las clases de
 * `static/css/login.css` (glass-card, input-glass, btn-gradient, particles…).
 */
export default async function LoginPage(props: PageProps<'/login'>) {
  const { next, error } = await props.searchParams

  return (
    <div className="login-background fixed inset-0 min-h-screen w-full overflow-hidden">
      <div className="particles">
        {Array.from({ length: 6 }, (_, index) => (
          <div key={index} className="particle" />
        ))}
      </div>

      <LoginReveal>
        <div className="relative z-10 flex min-h-screen items-center justify-center px-4 py-8 sm:px-6 md:px-8">
          <div className="mx-auto w-full max-w-5xl">
            <div className="grid grid-cols-1 items-center gap-10 md:grid-cols-2 md:gap-16">
              <div className="fade-in-up order-2 flex flex-col items-center space-y-4 text-center md:order-1 md:items-start md:space-y-6 md:text-left">
                <div className="max-w-lg space-y-4">
                  <h2 className="text-gradient text-3xl leading-tight font-bold md:text-4xl xl:text-5xl">
                    Bienvenido a <span className="text-secondary-gradient">Rescue</span>
                  </h2>
                  <p className="text-base leading-relaxed text-white/70 md:text-lg">
                    Accede para gestionar de forma segura tus recursos y empresas con la máxima
                    confiabilidad.
                  </p>
                </div>
              </div>

              <div className="order-1 mx-auto w-full max-w-sm md:order-2 md:max-w-md">
                <div className="glass-card fade-in-up rounded-2xl p-6 sm:p-8">
                  <div className="mb-6 text-center">
                    <h1 className="text-gradient fade-in-up mb-1 text-2xl font-bold">
                      Iniciar Sesión
                    </h1>
                    <p className="fade-in-up text-sm text-white/60">
                      Accede a tu cuenta
                    </p>
                  </div>

                  <LoginForm
                    next={typeof next === 'string' ? next : undefined}
                    initialError={typeof error === 'string' ? error : undefined}
                  />
                </div>

                <div className="fade-in-up mt-5 text-center">
                  <p className="text-xs text-white/50">
                    ¿No tienes cuenta?{' '}
                    <span className="font-semibold text-indigo-300 transition-colors hover:text-indigo-200">
                      Contacta al administrador
                    </span>
                  </p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </LoginReveal>
    </div>
  )
}
