'use client'

import { useActionState } from 'react'

import { login, type LoginState } from '../actions'

const INITIAL_STATE: LoginState = { error: null }

export function LoginForm({ next, initialError }: { next?: string; initialError?: string }) {
  const [state, formAction, pending] = useActionState(login, INITIAL_STATE)
  const error = state.error ?? initialError

  return (
    <form action={formAction} className="space-y-3 sm:space-y-4" autoComplete="off">
      {next && <input type="hidden" name="next" value={next} />}

      {error && (
        <p role="alert" className="text-center text-sm text-red-400">
          {error}
        </p>
      )}

      <div className="form-group fade-in-up">
        <label
          htmlFor="usuario"
          className="mb-1.5 block text-xs font-semibold tracking-wide text-white/90 sm:text-sm"
        >
          Usuario
        </label>
        <input
          type="text"
          id="usuario"
          name="usuario"
          className="input-glass w-full rounded-lg px-3 py-2.5 text-sm font-medium sm:py-3"
          placeholder="Ingresa tu usuario"
          required
          autoComplete="username"
        />
      </div>

      <div className="form-group fade-in-up">
        <label
          htmlFor="password"
          className="mb-1.5 block text-xs font-semibold tracking-wide text-white/90 sm:text-sm"
        >
          Contraseña
        </label>
        <input
          type="password"
          id="password"
          name="password"
          className="input-glass w-full rounded-lg px-3 py-2.5 text-sm font-medium sm:py-3"
          placeholder="Ingresa tu contraseña"
          required
          autoComplete="current-password"
        />
      </div>

      <button
        type="submit"
        disabled={pending}
        className="btn-gradient fade-in-up mt-4 flex min-h-[40px] w-full items-center justify-center gap-2 rounded-lg px-4 py-2.5 text-sm font-semibold tracking-wide disabled:cursor-not-allowed disabled:opacity-70 sm:min-h-[44px] sm:py-3"
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
