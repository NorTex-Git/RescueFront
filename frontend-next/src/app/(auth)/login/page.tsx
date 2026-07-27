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
        <div className="relative z-10 flex min-h-screen items-center justify-center px-4 pt-8 pb-8 sm:px-6 sm:pt-10 sm:pb-16 lg:px-8 lg:pt-16">
          <div className="mx-auto w-full max-w-6xl">
            <div className="grid grid-cols-1 items-center gap-8 lg:grid-cols-2 lg:gap-12">
              <div className="fade-in-up order-2 flex flex-col items-center space-y-4 text-center lg:order-1 lg:items-start lg:space-y-6 lg:text-left">
                <div className="max-w-lg space-y-4 lg:max-w-2xl">
                  <h2 className="text-gradient text-3xl leading-tight font-bold lg:text-4xl xl:text-5xl">
                    Bienvenido a <span className="text-secondary-gradient">Rescue</span>
                  </h2>
                  <p className="text-base leading-relaxed text-white/80 lg:text-lg xl:text-xl">
                    Accede para gestionar de forma segura tus recursos y empresas con la máxima
                    confiabilidad.
                  </p>
                </div>
              </div>

              <div className="order-1 mx-auto w-full max-w-sm lg:order-2 lg:max-w-md">
                <div className="glass-card fade-in-up rounded-xl p-4 sm:p-6 lg:rounded-2xl lg:p-7">
                  <div className="mb-4 text-center sm:mb-6">
                    <h1 className="text-gradient fade-in-up mb-1 text-xl font-bold sm:text-2xl">
                      Bienvenido
                    </h1>
                    <p className="fade-in-up text-xs text-white/80 sm:text-sm">
                      Accede a tu cuenta
                    </p>
                  </div>

                  <LoginForm
                    next={typeof next === 'string' ? next : undefined}
                    initialError={typeof error === 'string' ? error : undefined}
                  />
                </div>

                <div className="fade-in-up mt-4 text-center sm:mt-6">
                  <p className="text-xs text-white/70">
                    ¿No tienes cuenta?{' '}
                    <span className="font-semibold text-blue-300">Contacta al administrador</span>
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
