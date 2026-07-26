# Migración Flask → Next.js (ECOES FrontEnd)

Documento de arquitectura y plan de ejecución. Estado actual: Flask 3 + Jinja2 + Tailwind 3 + ~37k líneas de JS imperativo, dos SPA caseras (admin / empresa), proxy `/proxy/*` hacia backend, JWT en cookies HTTPOnly, WebSocket para alertas.

---

## 1. Diagnóstico del sistema actual

| Área | Estado | Implicación para migrar |
|---|---|---|
| `app.py` (1798 líneas) | Rutas + proxy + lógica de dashboard + CRUD de alert-types/imágenes | Solo el proxy y el gating por rol son esenciales; el resto es lógica que ya existe en el backend |
| `templates/` (6.2k líneas Jinja) | 2 shells SPA + vistas parciales | Se reescriben como componentes React, no se portan literal |
| `static/js/` (37k líneas) | DOM manual, `window.*` globals, registro de vistas `window.EmpresaSpaViews` | **La mayor parte se borra**, no se migra. Se reescribe la UI; se conserva la lógica de negocio (validaciones, mapeos, formatos) |
| Auth | Login POST a `/auth/login`, cookies `auth_token` (15 min) + `refresh_token` (7 d) reenviadas por Flask; sesión Flask duplica los datos del user | Next.js reemplaza sesión Flask por lectura del JWT; se elimina `/api/sync-session` |
| Realtime | `new WebSocket(WEBSOCKET_URL)` en `alertas.js`, guardado en `window.websocket` | Un solo provider React con reconexión |
| Libs externas | GSAP, Leaflet, Chart.js, SweetAlert2, intl-tel-input, Three.js por CDN | Pasan a npm (bundle versionado, sin depender de CDN caído) |

### Deuda que la migración debe eliminar (no arrastrar)

1. `session['user']` + cookie JWT como dos fuentes de verdad → una sola (JWT).
2. `secure=False` hardcodeado al reenviar cookies en `app.py:215` y `app.py:381` — **bug de seguridad en producción**, la cookie de auth viaja sin flag Secure. En Next.js se define por entorno.
3. `require_role` que hace `GET /health` para "validar" el token — no valida nada. Se reemplaza por verificación real de firma/exp del JWT.
4. `security-cleanup.js`, `final-token-cleanup.js`, `legacy/session-manager.js` (888 líneas) — parches de estado global que desaparecen con React.
5. Rutas Flask que replican el backend (`/admin/alert-types/*/update`, `/admin/imagenes/*`) → el cliente pega al backend vía BFF.

---

## 2. Stack objetivo

```
Next.js 15 (App Router) + TypeScript (strict)
Tailwind CSS 4          → config CSS-first (@theme), sin tailwind.config.js
TanStack Query v5       → cache/refetch/invalidación de CRUD
React Hook Form + Zod   → formularios y validación compartida
GSAP 3.13 + @gsap/react → animaciones (ver sección 6, es el punto delicado)
Leaflet + react-leaflet → mapas (dynamic import, ssr:false)
Recharts o Chart.js     → gráficas del dashboard
sonner / radix-ui       → toasts y modales (reemplaza SweetAlert2 + modal-utils.js)
jose                    → verificación de JWT en middleware (Edge runtime)
```

**Requisito de Tailwind 4**: Safari 16.4+, Chrome 111+, Firefox 128+. Si hay tablets/kioscos antiguos en operación, se cae a 3.4. Verificar en Fase 0.

Runtime de despliegue: `output: 'standalone'` en Docker, mismo `docker-compose` y red `rescue-network`, healthcheck en `/api/health`.

---

## 3. Arquitectura

### 3.1 Modelo de capas

```
Navegador (React)
   │  fetch same-origin, cookies HTTPOnly automáticas
   ▼
Next.js (BFF)
   ├── middleware.ts        → gating por rol antes de renderizar
   ├── app/api/[...proxy]   → reemplazo del proxy Flask (reenvía Set-Cookie)
   ├── Server Components    → primer render con datos ya cargados
   └── Client Components    → interacción, WebSocket, mapas, GSAP
   ▼
Backend existente (BACKEND_API_URL) — sin cambios
```

Regla clave: **el navegador nunca habla directo con el backend**. Todo pasa por el BFF same-origin para que las cookies HTTPOnly sigan funcionando sin CORS ni `SameSite=None`.

### 3.2 Estructura de carpetas

```
src/
├── middleware.ts                    # auth + rol, corre en Edge antes de cada ruta
├── app/
│   ├── layout.tsx                   # providers globales (Query, Theme, Toaster)
│   ├── page.tsx                     # landing (GSAP)
│   ├── contact/page.tsx
│   ├── (auth)/
│   │   └── login/page.tsx           # Server Action para login
│   ├── (empresa)/
│   │   ├── layout.tsx               # shell: navbar + sidebar (estáticos, sin re-render)
│   │   └── empresa/
│   │       ├── page.tsx             # dashboard
│   │       ├── usuarios/page.tsx
│   │       ├── hardware/page.tsx
│   │       ├── alertas/page.tsx
│   │       ├── alertas-inactivas/page.tsx
│   │       ├── stats/page.tsx
│   │       └── perfil/page.tsx
│   ├── (admin)/
│   │   ├── layout.tsx
│   │   └── admin/
│   │       ├── page.tsx
│   │       ├── empresas/page.tsx
│   │       ├── usuarios/page.tsx
│   │       ├── hardware/page.tsx
│   │       ├── alert-types/page.tsx
│   │       ├── company-types/page.tsx
│   │       └── imagenes/page.tsx
│   └── api/
│       ├── auth/{login,logout,refresh}/route.ts
│       ├── health/route.ts
│       └── [...proxy]/route.ts      # GET/POST/PUT/PATCH/DELETE → backend
├── features/                        # un módulo por dominio
│   ├── alertas/{components,hooks,api.ts,types.ts,schema.ts}
│   ├── hardware/…
│   ├── usuarios/…
│   ├── empresas/…
│   ├── alert-types/…
│   └── imagenes/…
├── components/ui/                   # botón, modal, tabla, badge, input…
├── lib/
│   ├── api/{server.ts,client.ts}    # fetch tipado, server-side y client-side
│   ├── auth/{jwt.ts,session.ts}
│   ├── ws/alerts-provider.tsx       # WebSocket único con reconexión
│   └── config.ts                    # env vars validadas con Zod
└── styles/                          # CSS heredado que valga la pena conservar
```

El layout de grupo `(empresa)` / `(admin)` da **gratis** lo que hoy hace `router.js` a mano: navbar y sidebar persistentes, solo cambia el contenido, sin recarga. `SPA_ARCHITECTURE.md` deja de ser necesario.

### 3.3 Autenticación

**Login** — Server Action:
1. `POST {BACKEND_API_URL}/auth/login` con usuario/password.
2. Leer `Set-Cookie` de la respuesta del backend, re-emitir `auth_token` y `refresh_token` con `httpOnly: true`, `secure: process.env.NODE_ENV === 'production'`, `sameSite: 'lax'`, `path: '/'`.
3. `redirect()` según rol leído del JWT.

**Gating** — `middleware.ts`:
```ts
// pseudocódigo
const token = req.cookies.get('auth_token')?.value
const payload = token && await verifyJwt(token)   // jose, verifica firma + exp
if (!payload) return redirectToLogin(req)
if (!allowedRoles(req.nextUrl.pathname).includes(payload.role))
  return NextResponse.redirect(homeFor(payload.role))
```
Sustituye `@require_role` en las ~25 rutas protegidas, en un solo archivo.

**Refresh** — el interceptor de `lib/api/client.ts` detecta 401, llama `/api/auth/refresh` una sola vez (con cola de peticiones concurrentes, misma lógica que `api-client.js` ya tiene) y reintenta. En server components, el helper `lib/api/server.ts` hace lo mismo antes de renderizar.

Decisión tomada: el frontend **sí** puede verificar la firma (secreto compartido / JWKS), así que `verifyJwt` es verificación real con `jose` y el rol se lee del claim. `JWT_SECRET` (o `JWKS_URL`) entra en `lib/config.ts` como variable obligatoria server-side. El backend sigue siendo la autoridad final en cada llamada de API; el middleware solo evita renderizar páginas prohibidas.

### 3.4 Datos

- **Carga inicial**: Server Component hace el fetch (equivalente a lo que hoy hace `empresa_dashboard()` en `app.py:1264`) → HTML con datos, sin spinner.
- **Interacción**: TanStack Query con `queryKey` por recurso; mutaciones invalidan el key. Reemplaza los `setInterval` de refresco manual.
- **Realtime**: `AlertsProvider` monta un WebSocket a `NEXT_PUBLIC_WEBSOCKET_URL`, con reconexión exponencial; al recibir evento hace `queryClient.invalidateQueries(['alertas'])`. Un solo socket para toda la app, en vez de uno por vista montada.

### 3.5 Variables de entorno

| Hoy | Next.js | Nota |
|---|---|---|
| `BACKEND_API_URL` | `BACKEND_API_URL` | solo server-side, nunca `NEXT_PUBLIC_` |
| `WEBSOCKET_URL` | `NEXT_PUBLIC_WEBSOCKET_URL` | expuesto al cliente |
| `PROXY_PREFIX` | fijo `/api` | deja de ser configurable |
| `SECRET_KEY`, `SESSION_LIFETIME` | se eliminan | ya no hay sesión de servidor |
| `IMAGES_SERVICE_BASE_URL` | igual | server-side |
| `RECIPIENT_EMAIL`, `COMPANY_PHONE`, … | igual | se sirven desde un Server Component, sin inyectarlos en HTML global |

`lib/config.ts` valida todo con Zod al arrancar (equivalente a `validate_config()`).

---

## 4. Estrategia de migración: strangler

No hay big-bang. Se levanta Next.js al lado de Flask y un reverse proxy (nginx/Traefik, ya está en la red `rescue-network`) enruta por path. Cada fase mueve rutas del upstream Flask al upstream Next.

```
/            → flask   → next  (fase 6)
/login       → flask   → next  (fase 2)
/empresa/*   → flask   → next  (fase 3)
/admin/*     → flask   → next  (fase 4)
/proxy/*     → flask   (se apaga al final)
```

Las cookies son del mismo dominio, así que una sesión iniciada en Next funciona en las rutas que aún sirve Flask y viceversa. Eso permite rollback por ruta: si `/empresa/hardware` falla, se devuelve esa ruta a Flask sin tocar el resto.

---

## 5. Fases

### Fase 0 — Preparación (1–2 días)
- [ ] Congelar features nuevas en Flask durante la migración (o aceptar doble implementación).
- [ ] Inventariar la API real del backend: los ~33 endpoints detectados (`/api/hardware`, `/api/usuarios`, `/api/empresas`, `/api/mqtt-alerts/*`, `/api/tipos-alarma/*`, `/api/tipos_empresa/*`, `/api/dashboard/*`, `/api/contact/send`). Documentar request/response de cada uno.
- [ ] Generar tipos TypeScript de esos payloads (`features/*/types.ts`). Si el backend expone OpenAPI, generarlos automático.
- [ ] Conseguir `JWT_SECRET` / `JWKS_URL` del backend y verificar que un `auth_token` real valida con `jose`.
- [ ] Inventariar el CSS custom a conservar (`login.css`, `spa/`, `gsap_css/`, `global-text-theme.css`, `scrollbar-global.css`) → se copian tal cual a `styles/`.
- [ ] **Confirmar parque de navegadores** (analytics o política de la operación). Tailwind 4 exige Safari 16.4+ / Chrome 111+ / Firefox 128+. Si hay equipos por debajo, se baja a Tailwind 3.4 y se ajusta la sección 8.1.
- [ ] Copiar a `public/` los assets de `s3-us-west-2.amazonaws.com/s.cdpn.io/68819/` que usa `tunnel.js` (shaders, texturas). Dependencia externa no controlada.
- **Entregable**: `docs/api-contract.md` + tipos + prueba de verificación de JWT + veredicto sobre Tailwind 4.

### Fase 1 — Esqueleto (2–3 días)
- [ ] `create-next-app` con TS + Tailwind 4 + App Router en `frontend-next/`; el `extend` del `tailwind.config.js` actual pasa a un bloque `@theme`.
- [ ] `@custom-variant dark` + `ThemeProvider` (reemplaza `theme-toggle.js` y arregla la inconsistencia `.dark` vs modo `media`).
- [ ] `lib/gsap/register.ts` con `registerPlugin` de los 8 plugins; `npm i gsap @gsap/react`; cero `<script>` de CDN.
- [ ] `lib/config.ts`, `lib/api/{server,client}.ts`, `app/api/[...proxy]/route.ts`, `app/api/health/route.ts`.
- [ ] Dockerfile multi-stage con `output: 'standalone'`; servicio nuevo en `docker-compose.yml` en la misma red.
- [ ] Componentes base en `components/ui/` (Button, Input, Select, Modal, Table, Badge, Card) con los estilos actuales.
- **Criterio de aceptación**: `curl http://next:3000/api/health` responde 200 y `/api/api/hardware` (vía proxy) devuelve lo mismo que `/proxy/api/hardware` de Flask.

### Fase 2 — Auth (3–4 días)
- [ ] `/login` con Server Action, transferencia de cookies con flags correctos.
- [ ] `middleware.ts` con gating por rol para `(empresa)` y `(admin)`.
- [ ] `/api/auth/refresh` + interceptor con cola de peticiones concurrentes.
- [ ] `/logout`.
- **Criterio de aceptación**: login como `empresa` y como `super_admin`; expirar el access token a mano y confirmar refresh transparente; acceder a `/admin` con rol `empresa` redirige a `/empresa`.
- **Riesgo**: si el backend fija cookies con `Domain` o `Path` específicos, ajustar el reenvío. Probar temprano.

### Fase 3 — Portal empresa (2–3 semanas)
Orden por dependencia y valor, de menor a mayor complejidad:
1. `stats` (230 líneas JS) — la más simple, sirve de plantilla del patrón.
2. `dashboard` (200 líneas template).
3. `usuarios` (1126 + 1529 líneas de modales).
4. `hardware` (2326 líneas) — incluye mapa Leaflet y estado en vivo.
5. `alertas` (2997 + 1104 líneas) — WebSocket, la más crítica. Se deja al final con el patrón ya rodado.
6. `alertas_inactivas`, `perfil`.
- [ ] `AlertsProvider` antes del punto 5.
- **Criterio de aceptación por vista**: paridad funcional verificada contra la vista Flask (mismo CRUD, mismos filtros, mismos estados vacíos/error), en Chrome y en móvil.

### Fase 4 — Portal admin (2–3 semanas)
1. `company-types` (903 líneas) — plantilla del patrón admin.
2. `empresas` (1246 + 1759 modales).
3. `usuarios` (1201 + 1513).
4. `alert-types` (1788) — mover a Next la lógica que hoy vive en `app.py:646-988` (build_stats, apply_status_filter) o pedir al backend que la exponga.
5. `hardware` (735 + 1064 + 690 notificaciones).
6. `imagenes` / `multimedia` (1103 + 1193) — subida de archivos vía Route Handler.
- **Criterio de aceptación**: igual que fase 3, más pruebas de subida de imágenes y borrado de carpetas.

### Fase 5 — Landing y contacto (1–1.5 semanas)
Detalle completo en la sección 6. Resumen: `sticky-header` → `hero` → `contact` → ScrollSmoother en el layout → `tunnel` + Three.js. Formulario de contacto con Server Action.
- **Criterio de aceptación**: navegar landing → portal → landing 5 veces y comprobar que `ScrollTrigger.getAll().length` no crece. Sin eso, el cleanup no está bien hecho.

### Fase 6 — Corte y limpieza (3–5 días)
- [ ] Enrutar `/` a Next; apagar Flask.
- [ ] Borrar `app.py`, `templates/`, `static/js/`, `utils/`, `requirements.txt`, `Dockerfile` de Flask.
- [ ] Actualizar `CLAUDE.md`, `AGENTS.md`, CI de `.github/`.
- [ ] Añadir Playwright con los smoke tests que hoy son manuales (login + un CRUD por rol).

**Total estimado**: 7–10 semanas de trabajo enfocado para una persona. Las fases 3 y 4 son el 70%.

---

## 6. GSAP en Next.js — el punto delicado

Uso actual medido: `gsap.to`×70, `ScrollTrigger`×48, `gsap.set`×29, `ScrollSmoother`×14, `gsap.fromTo`×13, `gsap.timeline`×10, `ScrollToPlugin`×4, `DrawSVG`×3, `MotionPath`×2, `CustomEase`×2, `TextPlugin`×2. Solo **2** `gsap.context` en todo el repo.

Ese último número es el problema central.

### 6.1 Por qué hoy funciona y en Next se rompe

Hoy cada navegación es una recarga completa de página: el contexto JS muere y con él todo timeline, ScrollTrigger y listener. Por eso 48 ScrollTriggers sin cleanup no molestan.

En App Router la navegación es client-side: el contexto **sobrevive**. Sin cleanup, cada visita a la landing registra otro juego de ScrollTriggers sobre nodos ya desmontados → memoria que crece, scroll que se comporta raro, animaciones que disparan sobre elementos inexistentes. No es un detalle de pulido; es la diferencia entre que la landing funcione o no.

### 6.2 Reglas

1. **Todo GSAP va en Client Components** (`"use client"`). GSAP toca el DOM; no existe en el servidor.
2. **`useGSAP` de `@gsap/react`, nunca `useEffect` a pelo.** `useGSAP` envuelve en `gsap.context` y hace `revert()` al desmontar — resuelve el punto 6.1 de una y además neutraliza el doble montaje de React Strict Mode en desarrollo.
   ```tsx
   useGSAP(() => {
     gsap.to('.hero-title', { y: 0, opacity: 1, duration: 1 })
   }, { scope: containerRef })   // scope acota los selectores al contenedor
   ```
3. **Registro de plugins una sola vez**, en `lib/gsap/register.ts` (client):
   ```ts
   gsap.registerPlugin(useGSAP, ScrollTrigger, ScrollSmoother, ScrollToPlugin,
                       DrawSVGPlugin, MotionPathPlugin, TextPlugin, CustomEase)
   ```
   Todos vienen en el paquete `gsap` de npm en 3.13 — el propio código actual ya los carga desde `cdn.jsdelivr.net/npm/gsap@3.13.0/dist/`, o sea que están en el paquete público. Se instala `gsap` y se borran los 8 `<script>` del CDN.
4. **Nada de mezclar `transition-*` o `animate-*` de Tailwind en elementos que GSAP anima.** La transición CSS pelea contra las escrituras por frame de GSAP. GSAP escribe `transform` inline y gana sobre las utilidades de Tailwind (que en v4 son variables CSS), así que no hay conflicto de especificidad — el conflicto es de *timing*.
5. **Estado inicial en CSS, no en `gsap.set` post-montaje.** Si un elemento entra con `from: {opacity: 0}`, sin esto se ve un flash del contenido ya visible antes de hidratar. Se pinta el estado inicial con una clase y `useGSAP` la retira.

### 6.3 ScrollSmoother (14 usos) — el caso difícil

ScrollSmoother secuestra el scroll del body y exige la estructura `#smooth-wrapper > #smooth-content`. Con navegación client-side eso pide cuidado extra:

- Vive en un componente cliente **persistente** dentro del layout, no dentro de una página.
- Al cambiar de ruta: `ScrollTrigger.refresh()` una vez montado el contenido nuevo (la altura del documento cambió).
- Al desmontar: `ScrollSmoother.get()?.kill()`.
- Choca con la restauración de scroll de Next → `scroll={false}` en los `<Link>` internos de las páginas con smoother, y el scroll se maneja con `ScrollToPlugin`.
- **Alternativa a evaluar en Fase 5**: dejar ScrollSmoother solo en la landing y el resto de la app sin él. Los portales admin/empresa no necesitan scroll suavizado, y aislarlo elimina la mayoría de estos problemas.

### 6.4 `tunnel.js` (953 líneas + Three.js)

- `dynamic(() => import('./Tunnel'), { ssr: false })` — Three.js no soporta render en servidor.
- Los shaders y texturas se cargan hoy desde `s3-us-west-2.amazonaws.com/s.cdpn.io/68819/` (assets de CodePen, no controlados por ustedes). **Copiar a `public/`** antes de migrar; si ese bucket desaparece, la landing se rompe hoy también.
- Es la pieza más pesada del bundle: cargar con `IntersectionObserver`, no en el arranque.

### 6.5 Orden de trabajo en Fase 5

1. `lib/gsap/register.ts` + quitar CDN.
2. `sticky-header` (240 líneas) — la más simple, valida el patrón `useGSAP`.
3. `hero` (319) — con estado inicial en CSS, es donde se nota el FOUC.
4. `contact` (738).
5. ScrollSmoother en el layout de la landing.
6. `tunnel` (953 + Three.js) al final.

Criterio de aceptación: navegar landing → portal → landing 5 veces y verificar con `ScrollTrigger.getAll().length` que no crece. Ese es el test que prueba que el cleanup funciona.

---

## 7. Reglas de reescritura (para no repetir la deuda)

1. **Nada de `window.*` como estado.** Estado de servidor → TanStack Query. Estado de UI → `useState`/`useReducer`. Estado compartido → Context.
2. **Un archivo por componente**, máximo ~300 líneas. Los actuales de 2000+ se parten en: página, tabla, filtros, modal-crear, modal-editar, hooks.
3. **Sin `innerHTML`.** Todo render en JSX.
4. **Fetch solo en `features/*/api.ts`**, nunca dentro de un componente (misma regla que ya tenía `SPA_ARCHITECTURE.md`, ahora sí forzable).
5. **Validación con Zod compartida** entre formulario y parseo de respuesta. Reemplaza `hardware-validation.js`.
6. **Textos de UI en español** (se mantiene la convención de `AGENTS.md`).
7. **Nada de CDN en producción**: todas las libs por npm (hoy hay 8 scripts de GSAP, Leaflet, Chart.js, SweetAlert2, intl-tel-input, Three.js y Font Awesome cargados de terceros).
8. **GSAP siempre con `useGSAP`**, nunca `useEffect` a pelo (sección 6.2).

## 8. Riesgos

| Riesgo | Mitigación |
|---|---|
| Cookies del backend con Domain/SameSite incompatibles | Probar en Fase 2, antes de escribir UI |
| WebSocket detrás del reverse proxy sin upgrade configurado | Validar `Upgrade`/`Connection` en nginx en Fase 3 |
| Paridad visual: 90k de `output.css` + CSS custom por vista | Migrar vista por vista con captura antes/después; no rediseñar durante la migración |
| Falta de tests: hoy todo es smoke manual | Playwright desde Fase 2, un test por ruta migrada |
| Contratos de API no documentados | Fase 0 es bloqueante; sin ella cada vista se convierte en ingeniería inversa |
| Tailwind 4 rompe navegadores viejos | Verificar parque en Fase 0; plan B es 3.4 sin tocar el resto de la arquitectura |
| Fugas de ScrollTrigger con navegación client-side | `useGSAP` obligatorio + test de `ScrollTrigger.getAll().length` (Fase 5) |
| Assets de `tunnel.js` alojados en un bucket de CodePen ajeno | Copiar a `public/` en Fase 0. Riesgo vigente hoy también |

## 9. Decisiones tomadas

1. **Verificación de JWT**: el frontend tiene acceso al secreto/JWKS. `middleware.ts` verifica firma + `exp` con `jose` en el Edge; no hace falta `GET /auth/me` por navegación. El rol sale del claim del token.
2. **Diseño**: paridad visual exacta. La migración **no** es rediseño. Cada vista se valida con captura antes/después.
3. **Tailwind 4** (última). El costo medido sobre este repo es bajo (ver 9.1) y como cada template se reescribe a JSX igual, se toca cada string de clases una sola vez. Condicionado a que el parque de navegadores lo soporte.
4. **Ubicación**: mismo repo, carpeta `frontend-next/`. Flask y Next conviven hasta la Fase 6.

### 9.1 Costo medido de Tailwind 3 → 4

| Elemento | Ocurrencias | Acción |
|---|---|---|
| `tailwind.config.js` | 5 líneas `extend` (3 colores, 1 fontFamily) + `forms` + `typography` | → bloque `@theme` en CSS; plugins con `@plugin` |
| `@apply` | 3 (todos en `input.css`) | `@layer components` → `@utility` |
| `flex-shrink-*` | 38 | → `shrink-*` |
| `blur-sm` | 15 | → `blur-xs` |
| `backdrop-blur-sm` | 13 | → `backdrop-blur-xs` |
| `shadow-sm` | 5 | → `shadow-xs` |
| `border-opacity-*` | 1 | → modificador `/opacidad` |
| `rounded` pelado | 51 | → `rounded-sm` (la escala se corrió) |
| `border` pelado | 40 | **auditar uno por uno**: el color por defecto pasa de `gray-200` a `currentColor` |
| `space-x/y-*` | 146 | selector cambia a `& > :not(:last-child)`; revisar solo casos con `flex-row-reverse` o hijos ocultos |
| `dark:` | 368 | ver nota abajo |

Notas:
- `npx @tailwindcss/upgrade` automatiza los renombres; se corre **una vez sobre el JSX ya generado**, no sobre los Jinja.
- **Bug preexistente**: el CSS usa selectores `html:not(.dark)` (estrategia de clase) pero `tailwind.config.js` no declara `darkMode`, así que Tailwind 3 está operando en modo `media`. En v4 se declara explícito: `@custom-variant dark (&:where(.dark, .dark *));` y el toggle de `theme-toggle.js` pasa a un `ThemeProvider`.
- Preflight de v4 cambia `button { cursor: default }` (antes `pointer`). Se restaura en el CSS base para no degradar la UI.
