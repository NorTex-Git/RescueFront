'use client'

import { useEffect, useRef } from 'react'
import * as THREE from 'three'
import { EffectComposer } from 'three/addons/postprocessing/EffectComposer.js'
import { RenderPass } from 'three/addons/postprocessing/RenderPass.js'
import { UnrealBloomPass } from 'three/addons/postprocessing/UnrealBloomPass.js'

export default function EmergencyTunnel() {
  const sectionRef = useRef<HTMLElement>(null)
  const stageRef = useRef<HTMLDivElement>(null)
  const canvasRef = useRef<HTMLCanvasElement>(null)
  const copyRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    const section = sectionRef.current
    const stage = stageRef.current
    const canvas = canvasRef.current
    const copy = copyRef.current
    if (!section || !stage || !canvas || !copy) return
    if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) {
      section.classList.add('tunnel-reduced')
      return
    }

    // Three asume que el navegador siempre devuelve un contexto y, en equipos sin
    // aceleración/GPU bloqueada, termina leyendo `precision` sobre null. Se valida
    // antes y se mantiene una versión CSS de la sección en lugar de romper la página.
    const context = canvas.getContext('webgl2', { alpha: true, antialias: false })
    if (!context) {
      section.classList.add('tunnel-fallback')
      return
    }

    let renderer: THREE.WebGLRenderer
    try {
      renderer = new THREE.WebGLRenderer({ canvas, context, antialias: false, alpha: true })
    } catch (error) {
      console.warn('[landing] WebGL no está disponible; se usa el fallback visual.', error)
      section.classList.add('tunnel-fallback')
      return
    }
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 1.5))
    renderer.outputColorSpace = THREE.SRGBColorSpace
    const scene = new THREE.Scene()
    scene.fog = new THREE.FogExp2(0x030409, 0.045)
    const camera = new THREE.PerspectiveCamera(70, 1, 0.1, 180)

    const path = new THREE.CatmullRomCurve3([
      new THREE.Vector3(0, 0, 4),
      new THREE.Vector3(2, 1, -8),
      new THREE.Vector3(-2, -1, -20),
      new THREE.Vector3(2.5, 0.5, -34),
      new THREE.Vector3(-1, 0, -50),
      new THREE.Vector3(0, 0, -68),
    ])
    const tunnelGeometry = new THREE.TubeGeometry(path, 180, 6.5, 20, false)
    const tunnelMaterial = new THREE.MeshBasicMaterial({
      color: 0x381014,
      side: THREE.BackSide,
      wireframe: true,
      transparent: true,
      opacity: 0.42,
    })
    const tunnel = new THREE.Mesh(tunnelGeometry, tunnelMaterial)
    scene.add(tunnel)

    const particleCount = window.innerWidth < 700 ? 450 : 900
    const positions = new Float32Array(particleCount * 3)
    for (let i = 0; i < particleCount; i += 1) {
      const angle = Math.random() * Math.PI * 2
      const radius = 2.4 + Math.random() * 3.8
      positions[i * 3] = Math.cos(angle) * radius
      positions[i * 3 + 1] = Math.sin(angle) * radius
      positions[i * 3 + 2] = 5 - Math.random() * 78
    }
    const particleGeometry = new THREE.BufferGeometry()
    particleGeometry.setAttribute('position', new THREE.BufferAttribute(positions, 3))
    const particleMaterial = new THREE.PointsMaterial({
      color: 0xff553c,
      size: 0.075,
      transparent: true,
      opacity: 0.8,
      blending: THREE.AdditiveBlending,
      depthWrite: false,
    })
    const particles = new THREE.Points(particleGeometry, particleMaterial)
    scene.add(particles)

    const composer = new EffectComposer(renderer)
    composer.addPass(new RenderPass(scene, camera))
    const bloom = new UnrealBloomPass(new THREE.Vector2(1, 1), 0.8, 0.45, 0.2)
    composer.addPass(bloom)

    let width = 0
    let height = 0
    const resize = () => {
      width = stage.clientWidth
      height = stage.clientHeight
      renderer.setSize(width, height, false)
      composer.setSize(width, height)
      camera.aspect = width / Math.max(height, 1)
      camera.updateProjectionMatrix()
    }
    resize()

    let running = false
    let frame = 0
    let scrollProgress = 0
    const clock = new THREE.Clock()
    const updateScroll = () => {
      const rect = section.getBoundingClientRect()
      const distance = Math.max(section.offsetHeight - window.innerHeight, 1)
      scrollProgress = THREE.MathUtils.clamp(-rect.top / distance, 0, 1)
      // El mensaje abre la experiencia y desaparece al entrar al recorrido.
      copy.style.opacity = String(THREE.MathUtils.clamp(1 - scrollProgress * 5, 0, 1))
      copy.style.transform = `translate3d(0, ${scrollProgress * -35}px, 0)`
    }
    updateScroll()
    const render = () => {
      if (!running) return
      const elapsed = clock.getElapsedTime()
      // El avance principal depende del scroll: el usuario recorre el túnel, no lo observa pasar.
      const t = THREE.MathUtils.lerp(0.015, 0.955, scrollProgress)
      const point = path.getPointAt(t)
      const ahead = path.getPointAt(Math.min(t + 0.025, 0.99))
      camera.position.copy(point)
      camera.position.x += Math.sin(elapsed * 0.8) * 0.06
      camera.position.y += Math.cos(elapsed * 0.65) * 0.04
      camera.lookAt(ahead)
      particles.rotation.z = elapsed * 0.025
      composer.render()
      frame = window.requestAnimationFrame(render)
    }
    const observer = new IntersectionObserver(
      ([entry]) => {
        running = entry.isIntersecting
        if (running) {
          clock.start()
          window.cancelAnimationFrame(frame)
          render()
        } else window.cancelAnimationFrame(frame)
      },
      { rootMargin: '150px' },
    )
    observer.observe(section)
    window.addEventListener('resize', resize, { passive: true })
    window.addEventListener('scroll', updateScroll, { passive: true })

    return () => {
      running = false
      window.cancelAnimationFrame(frame)
      observer.disconnect()
      window.removeEventListener('resize', resize)
      window.removeEventListener('scroll', updateScroll)
      tunnelGeometry.dispose()
      tunnelMaterial.dispose()
      particleGeometry.dispose()
      particleMaterial.dispose()
      composer.dispose()
      renderer.dispose()
      renderer.forceContextLoss()
    }
  }, [])

  return (
    <section ref={sectionRef} className="tunnel-section" aria-labelledby="tunnel-title">
      <div ref={stageRef} className="tunnel-stage">
        <canvas ref={canvasRef} className="tunnel-canvas" aria-hidden="true" />
        <div className="tunnel-vignette" />
        <div ref={copyRef} className="tunnel-copy">
          <p className="landing-eyebrow">Del evento a la acción</p>
          <h2 id="tunnel-title">Entra en la respuesta.</h2>
          <p>
            Avanza para recorrer la red que transporta cada alerta y mantiene sincronizados a los
            equipos de emergencia.
          </p>
          <span className="tunnel-scroll-cue">Desliza para entrar</span>
        </div>
      </div>
    </section>
  )
}
