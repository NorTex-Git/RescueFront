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
    <form action={formAction} className="login-form" autoComplete="off">
      {next && <input type="hidden" name="next" value={next} />}

      {error && (
        <p role="alert" className="login-error">
          {error}
        </p>
      )}

      <div>
        <label htmlFor="usuario" className="login-field-label">
          Usuario
        </label>
        <div className="login-input-wrap">
          <Icon name="user" className="login-input-icon" />
          <input
            type="text"
            id="usuario"
            name="usuario"
            className="login-input"
            placeholder="Ingresa tu usuario"
            required
            autoComplete="username"
          />
        </div>
      </div>

      <div>
        <label htmlFor="password" className="login-field-label">
          Contraseña
        </label>
        <div className="login-input-wrap">
          <Icon name="lock" className="login-input-icon" />
          <input
            type={showPassword ? 'text' : 'password'}
            id="password"
            name="password"
            className="login-input"
            placeholder="Ingresa tu contraseña"
            required
            autoComplete="current-password"
          />
          <button
            type="button"
            onClick={() => setShowPassword((current) => !current)}
            aria-label={showPassword ? 'Ocultar contraseña' : 'Mostrar contraseña'}
            className="login-password-toggle"
          >
            <Icon name={showPassword ? 'eye-slash' : 'eye'} />
          </button>
        </div>
      </div>

      <button type="submit" disabled={pending} className="login-submit">
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
