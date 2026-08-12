'use client'

import { useGSAP } from '@gsap/react'
import { gsap } from 'gsap'
import { CustomEase } from 'gsap/CustomEase'
import { DrawSVGPlugin } from 'gsap/DrawSVGPlugin'
import { MotionPathPlugin } from 'gsap/MotionPathPlugin'
import { ScrollSmoother } from 'gsap/ScrollSmoother'
import { ScrollToPlugin } from 'gsap/ScrollToPlugin'
import { ScrollTrigger } from 'gsap/ScrollTrigger'
import { SplitText } from 'gsap/SplitText'
import { TextPlugin } from 'gsap/TextPlugin'

/**
 * Registro único de plugins. Reemplaza los 8 `<script>` de CDN de los templates Jinja.
 *
 * Importar este módulo desde cualquier Client Component que use GSAP; el registro
 * es idempotente y solo corre una vez por bundle.
 */
gsap.registerPlugin(
  useGSAP,
  ScrollTrigger,
  ScrollSmoother,
  ScrollToPlugin,
  DrawSVGPlugin,
  MotionPathPlugin,
  TextPlugin,
  CustomEase,
  SplitText,
)

export {
  gsap,
  useGSAP,
  ScrollTrigger,
  ScrollSmoother,
  ScrollToPlugin,
  DrawSVGPlugin,
  MotionPathPlugin,
  TextPlugin,
  CustomEase,
  SplitText,
}
