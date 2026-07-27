import type { NextConfig } from 'next'

const nextConfig: NextConfig = {
  // Imagen Docker mínima: copia solo lo necesario para arrancar.
  output: 'standalone',
  // Mientras Flask y Next convivan hay dos package-lock.json en el repo; sin esto
  // Turbopack elige la raíz equivocada.
  turbopack: {
    root: __dirname,
  },
}

export default nextConfig
