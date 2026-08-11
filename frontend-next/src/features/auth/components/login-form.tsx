'use client'

import { Icon } from '@/components/ui/icon'
import { useActionState, useState } from 'react'

import { login, type LoginState } from '../actions'

const INITIAL_STATE: LoginState = { error: null }

export function LoginForm({ next, initialError }: { next?: string; initialError?: string }) {
  const [state, formAction, pending] = useActionState(login, INITIAL_STATE)
  const error = state.error ?? initialError
  const [showPassword, setShowPassword] = useState(false)

  return (
    <form action={formAction} className="space-y-4 sm:space-y-5" autoComplete="off">
      {next && <input type="hidden" name="next" value={next} />}

      {error && (
        <p role="alert" className="text-center text-sm text-red-600 dark:text-red-400">
          {error}
        </p>
      )}

      <div className="form-group">
        <label
          htmlFor="usuario"
          className="mb-2 block text-xs font-semibold tracking-[0.12em] text-slate-600 uppercase dark:text-white/60"
        >
          Usuario
        </label>
        <div className="relative">
          <Icon className="fas fa-user pointer-events-none absolute top-1/2 left-4 -translate-y-1/2 text-sm text-slate-400 dark:text-white/40" />
          <input
            type="text"
            id="usuario"
            name="usuario"
            className="input-glass w-full rounded-xl py-3.5 pr-3 pl-11 text-sm font-medium"
            placeholder="Ingresa tu usuario"
            required
            autoComplete="username"
          />
        </div>
      </div>

      <div className="form-group">
        <label
          htmlFor="password"
          className="mb-2 block text-xs font-semibold tracking-[0.12em] text-slate-600 uppercase dark:text-white/60"
        >
          Contraseña
        </label>
        <div className="relative">
          <Icon className="fas fa-lock pointer-events-none absolute top-1/2 left-4 -translate-y-1/2 text-sm text-slate-400 dark:text-white/40" />
          <input
            type={showPassword ? 'text' : 'password'}
            id="password"
            name="password"
            className="input-glass w-full rounded-xl py-3.5 pr-11 pl-11 text-sm font-medium"
            placeholder="Ingresa tu contraseña"
            required
            autoComplete="current-password"
          />
          <button
            type="button"
            onClick={() => setShowPassword((current) => !current)}
            aria-label={showPassword ? 'Ocultar contraseña' : 'Mostrar contraseña'}
            className="absolute top-1/2 right-4 -translate-y-1/2 text-sm text-slate-400 transition-colors hover:text-slate-600 dark:text-white/40 dark:hover:text-white/70"
          >
            <Icon className={showPassword ? 'fas fa-eye-slash' : 'fas fa-eye'} />
          </button>
        </div>
      </div>

      <button
        type="submit"
        disabled={pending}
        className="btn-gradient mt-5 flex min-h-[44px] w-full items-center justify-center gap-2 rounded-xl px-4 py-3 text-sm font-semibold tracking-wide disabled:cursor-not-allowed disabled:opacity-70 sm:min-h-[48px] sm:py-3.5"
      >
        {pending && (
          <span
            aria-hidden
            className="size-4 animate-spin rounded-full border-2 border-current border-t-transparent"
          />
        )}
        <span>{pending ? 'Ingresando…' : 'Iniciar Sesión'}</span>
      </button>
    </form>
  )
}
