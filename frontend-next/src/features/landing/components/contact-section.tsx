'use client'

import { zodResolver } from '@hookform/resolvers/zod'
import dynamic from 'next/dynamic'
import { useRef, useState } from 'react'
import { useForm } from 'react-hook-form'
import { Icon } from '@/components/ui/icon'
import { gsap, useGSAP } from '@/lib/gsap/register'
import { sendContactRequest } from '../api'
import { contactSchema, type ContactFormValues } from '../schema'

// Fondo WebGL aislado a esta sección: se carga solo en cliente.
const Threads = dynamic(() => import('./threads'), { ssr: false })

const defaults: ContactFormValues = {
  firstName: '',
  lastName: '',
  email: '',
  company: '',
  phone: '',
  projectType: '',
  message: '',
  privacy: true,
}

function ErrorText({ message }: { message?: string }) {
  return message ? <span className="field-error">{message}</span> : null
}

export function ContactSection() {
  const root = useRef<HTMLElement>(null)
  // Se evalúa una sola vez al montar (sin efecto ni setState): con reduced-motion el
  // fondo se deja estático.
  const reducedMotion = useState(
    () =>
      typeof window !== 'undefined' &&
      window.matchMedia('(prefers-reduced-motion: reduce)').matches,
  )[0]
  const [feedback, setFeedback] = useState<{ kind: 'ok' | 'error'; text: string } | null>(null)
  const {
    register,
    handleSubmit,
    reset,
    formState: { errors, isSubmitting },
  } = useForm<ContactFormValues>({ resolver: zodResolver(contactSchema), defaultValues: defaults })

  useGSAP(
    () => {
      if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) return
      gsap.from('[data-contact-card]', {
        opacity: 0,
        y: 45,
        duration: 0.85,
        stagger: 0.15,
        ease: 'power3.out',
        scrollTrigger: { trigger: root.current, start: 'top 70%', once: true },
      })
    },
    { scope: root },
  )

  const submit = handleSubmit(async (values) => {
    setFeedback(null)
    try {
      const result = await sendContactRequest(values)
      setFeedback({
        kind: 'ok',
        text: result.message || 'Solicitud enviada. Nuestro equipo se pondrá en contacto contigo.',
      })
      reset(defaults)
    } catch (error) {
      setFeedback({
        kind: 'error',
        text:
          error instanceof Error
            ? error.message
            : 'No pudimos enviar la solicitud. Intenta de nuevo.',
      })
    }
  })

  return (
    <section ref={root} id="contacto" className="contact-section" aria-labelledby="contact-title">
      {!reducedMotion && (
        <div className="contact-bg" aria-hidden="true">
          <Threads amplitude={1} distance={0} enableMouseInteraction />
        </div>
      )}
      <div className="contact-heading">
        <p className="landing-eyebrow">Hablemos de tu operación</p>
        <h2 id="contact-title">Solicita una demo RESCUE</h2>
        <p>
          Descubre cómo conectar tus alertas, equipos y canales de respuesta en una sola plataforma.
        </p>
      </div>
      <div className="contact-layout">
        <form data-contact-card className="contact-card contact-form" onSubmit={submit} noValidate>
          <div className="form-row">
            <label>
              Nombre *<input autoComplete="given-name" {...register('firstName')} />
              <ErrorText message={errors.firstName?.message} />
            </label>
            <label>
              Apellido *<input autoComplete="family-name" {...register('lastName')} />
              <ErrorText message={errors.lastName?.message} />
            </label>
          </div>
          <label>
            Email corporativo *<input type="email" autoComplete="email" {...register('email')} />
            <ErrorText message={errors.email?.message} />
          </label>
          <div className="form-row">
            <label>
              Empresa *<input autoComplete="organization" {...register('company')} />
              <ErrorText message={errors.company?.message} />
            </label>
            <label>
              Teléfono
              <input type="tel" autoComplete="tel" {...register('phone')} />
            </label>
          </div>
          <label>
            Tipo de organización *
            <select {...register('projectType')}>
              <option value="">Selecciona una opción</option>
              <option value="industria-empresas">Industria o empresa privada</option>
              <option value="bomberos-defensa">Bomberos o Defensa Civil</option>
              <option value="policia-seguridad">Policía o seguridad</option>
              <option value="municipios-gobernaciones">Municipio o Gobernación</option>
              <option value="gestion-riesgo">Gestión del riesgo</option>
              <option value="salud-publica">Salud pública</option>
              <option value="otros">Otro</option>
            </select>
            <ErrorText message={errors.projectType?.message} />
          </label>
          <label>
            Mensaje
            <textarea rows={4} {...register('message')} />
          </label>
          <label className="privacy-field">
            <input type="checkbox" {...register('privacy')} />
            <span>Acepto la política de privacidad y el tratamiento de mis datos.</span>
          </label>
          <ErrorText message={errors.privacy?.message} />
          <button className="contact-submit" type="submit" disabled={isSubmitting}>
            {isSubmitting ? 'Enviando…' : 'Solicitar demo'} <Icon name="arrow-down" />
          </button>
          {feedback && (
            <p className={`form-feedback ${feedback.kind}`} role="status">
              {feedback.text}
            </p>
          )}
        </form>
        <aside data-contact-card className="contact-info">
          <div className="contact-card">
            <h3>Contacto directo</h3>
            <a href="mailto:asesoria.rescue@gmail.com">
              <Icon name="envelope" />
              <span>
                <small>Email corporativo</small>asesoria.rescue@gmail.com
              </span>
            </a>
            <a href="https://wa.me/573108566009" target="_blank" rel="noreferrer">
              <Icon name="satellite-dish" />
              <span>
                <small>WhatsApp 24/7</small>+57 310 856 6009
              </span>
            </a>
            <div className="contact-location">
              <Icon name="location-dot" />
              <span>
                <small>Ubicación</small>Bogotá, Colombia
              </span>
            </div>
          </div>
          <div className="contact-metrics">
            <div>
              <strong>&lt;5s</strong>
              <span>Propagación</span>
            </div>
            <div>
              <strong>24/7</strong>
              <span>Disponibilidad</span>
            </div>
            <div>
              <strong>Multi</strong>
              <span>Canal</span>
            </div>
            <div>
              <strong>IoT</strong>
              <span>Conectado</span>
            </div>
          </div>
        </aside>
      </div>
    </section>
  )
}
