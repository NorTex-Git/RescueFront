import type { Metadata } from 'next'

import { LoginForm } from '@/features/auth/components/login-form'
import { ThemeToggleButton } from '@/features/auth/components/theme-toggle-button'

import '@/styles/login.css'

export const metadata: Metadata = {
  title: 'Iniciar Sesión — RESCUE',
}

/**
 * Paridad visual con `templates/login.html`: se reutilizan tal cual las clases de
 * `static/css/login.css` (glass-card, input-glass, btn-gradient, particles…).
 *
 * Sin animación de entrada: el reveal por GSAP (`LoginReveal`) tardaba varios segundos
 * en producirse en desarrollo —doble invocación de efectos de React más un tween hacia
 * `.fade-in-scale`, una clase que ningún elemento tenía— y el login se veía roto en vez
 * de animado.
 *
 * Los colores de texto llevan `dark:` explícito: el resto de utilidades de esta vista
 * viene de `login.css` (vía variables que sí distinguen `.dark`), pero las clases
 * `text-white/*` de Tailwind no tienen contraparte automática y quedaban fijas en
 * blanco sin importar el tema.
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

      <ThemeToggleButton />

      <div className="relative z-10 flex min-h-screen items-center justify-center px-4 py-8 sm:px-6 md:px-8">
        <div className="mx-auto w-full max-w-5xl">
          <div className="grid grid-cols-1 items-center gap-10 md:grid-cols-2 md:gap-16">
            <div className="order-2 flex flex-col items-center space-y-5 text-center md:order-1 md:items-start md:space-y-7 md:text-left">
              <div className="flex items-center gap-2.5 text-xs font-semibold tracking-[0.2em] text-slate-600 uppercase dark:text-white/60">
                <span className="h-px w-8 bg-gradient-to-r from-transparent to-[#667eea]" />
                Acceso seguro
              </div>
              <div className="max-w-lg space-y-5">
                <h2 className="text-gradient text-4xl leading-[1.05] font-bold tracking-tight md:text-5xl xl:text-6xl">
                  Bienvenido a <span className="text-secondary-gradient">Rescue</span>
                </h2>
                <p className="text-base leading-relaxed text-slate-600 md:text-lg dark:text-white/70">
                  Accede para gestionar de forma segura tus recursos y empresas con la máxima
                  confiabilidad.
                </p>
              </div>
            </div>

            <div className="order-1 mx-auto w-full max-w-sm md:order-2 md:max-w-md">
              <div className="glass-card rounded-3xl p-7 sm:p-9">
                <div className="mb-7 text-center">
                  <h1 className="text-gradient mb-1.5 text-3xl font-bold">Iniciar Sesión</h1>
                  <p className="text-sm text-slate-600 dark:text-white/60">Accede a tu cuenta</p>
                </div>

                <LoginForm
                  next={typeof next === 'string' ? next : undefined}
                  initialError={typeof error === 'string' ? error : undefined}
                />
              </div>

              <div className="mt-5 text-center">
                <p className="text-xs text-slate-500 dark:text-white/50">
                  ¿No tienes cuenta?{' '}
                  <span className="font-semibold text-indigo-600 transition-colors hover:text-indigo-500 dark:text-indigo-300 dark:hover:text-indigo-200">
                    Contacta al administrador
                  </span>
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
