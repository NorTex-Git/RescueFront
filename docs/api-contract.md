# Contrato de API — backend RESCUE

Entregable de la **Fase 0** de `MIGRATION_NEXTJS.md`. Inventario de todo lo que el frontend
consume hoy del backend, extraído de `utils/api_client.py`, `static/js/api-client.js`,
`app.py` y las vistas SPA.

- **Base**: `BACKEND_API_URL` (dev `http://localhost:5002`, prod `http://rescue-backend:5002`).
- **Hoy** el navegador pega a `/proxy/<path>` y Flask reenvía a `BACKEND_API_URL/<path>`.
- **En Next.js** pega a `/api/<path>` y el Route Handler `app/api/[...proxy]/route.ts` reenvía igual.
  Ojo con el doble `api`: `/api/api/hardware` → backend `/api/hardware`. Es intencional, el
  backend expone sus recursos bajo `/api/` y `auth`/`health` cuelgan de la raíz.

## Verificado contra el backend real (2026-07-25)

Lo de abajo se comprobó con el backend corriendo en `localhost:5002`, no inferido del código.

### Barra final: el backend redirige con 308

`/api/hardware`, `/api/hardware-types` y `/api/empresas` responden **308** hacia la
variante con barra final (`/api/hardware/`) — es `strict_slashes` de Flask. El BFF debe
**seguir** el redirect (`redirect: 'follow'`); si lo reenviara al navegador, el `Location`
apuntaría a `BACKEND_API_URL`, inalcanzable desde el cliente.

### Endpoints muertos de `static/js/api-client.js`

| Endpoint | Real |
|---|---|
| `/api/usuarios` | **404** |
| `/api/usuarios/including-inactive` | **404** |
| `/api/users/empresa/{id}` (el de `utils/api_client.py:199`) | **404** |
| `/empresas/{id}/usuarios` | **401** → existe, es el bueno |

Queda resuelta la discrepancia de la sección 4: **la familia válida es
`/empresas/{empresaId}/usuarios`**. Los tres endpoints globales de usuarios no existen.

### Claims reales del `auth_token`

```json
{ "fresh": false, "iat": …, "jti": "…", "type": "access",
  "sub": "6a657c5dfc32af380f385ce1", "nbf": …, "exp": …, "role": "super_admin" }
```

- `role` y `exp` sí están → el gating por rol funciona con el token.
- **No hay `username` ni `empresa_id`.** Solo llegan en el cuerpo de `/auth/login`.
- `sub` es el id de Mongo del usuario y coincide con el `user.id` que Flask guardaba en
  `session['user']['id']` y usaba como id de empresa. Es el valor correcto.

El secreto es `JWT_SECRET_KEY` del backend. Verificado: con él, un token de firma
inválida es rechazado por `proxy.ts`; sin él, pasa.

## Envelope de respuesta

Los endpoints responden con esta envoltura:

```jsonc
{
  "success": true,
  "data": [] | {},      // payload
  "count": 12,          // solo en listados
  "message": "…",       // en algunas respuestas OK
  "errors": ["…"]       // ⚠️ ARRAY, no objeto, cuando success=false
}
```

⚠️ **Los errores vienen en `errors` como array**, no en `message`:

```json
{ "success": false, "errors": ["Credenciales inválidas"] }
```

El código Flask leía `message`, así que mostraba el texto genérico en vez del real.
`lib/api/errors.ts` (`extractErrorMessage`) contempla `message`, `error` y `errors` en
sus dos formas.

Zod base sugerida en `lib/api/schema.ts`:

```ts
const envelope = <T extends ZodTypeAny>(data: T) =>
  z.object({
    success: z.boolean(),
    data: data.optional(),
    count: z.number().optional(),
    message: z.string().optional(),
    errors: z.unknown().optional(),
  })
```

---

## 1. Auth (raíz, sin prefijo `/api`)

| Método | Path | Body | Notas |
|---|---|---|---|
| POST | `/auth/login` | `{ usuario, password }` | Responde `{ user: { id, usuario, role, empresa_id, … } }` y **fija `auth_token` (15 min) + `refresh_token` (7 d) por `Set-Cookie`**. Público. |
| POST | `/auth/refresh` | — | Usa la cookie `refresh_token`, reemite `auth_token`. |
| POST | `/auth/logout` | — | Invalida la sesión actual. |
| POST | `/auth/logout-all` | — | Invalida todas las sesiones del usuario. |
| GET | `/auth/sessions` | — | Sesiones activas del usuario. |
| DELETE | `/auth/sessions/{sessionId}` | — | Cierra una sesión concreta. |
| GET | `/health` | — | Health del backend. Público. |

`role` ∈ `empresa` | `super_admin` (validado hoy en `app.py:102`).

**Pendiente de Fase 0**: no hay `JWT_SECRET` ni `JWKS_URL` en `.env` / `.env.production`.
Sin él, `middleware.ts` solo puede decodificar el payload (gating optimista de UI) en vez de
verificar la firma. Ver sección 7.

## 2. Hardware

| Método | Path | Body / params |
|---|---|---|
| GET | `/api/hardware` | — |
| GET | `/api/hardware/all-including-inactive` | — |
| GET | `/api/hardware/{id}` | — |
| POST | `/api/hardware` | objeto hardware |
| PUT | `/api/hardware/{id}` | objeto hardware |
| DELETE | `/api/hardware/{id}` | — |
| PATCH | `/api/hardware/{id}/toggle-status` | `{ activa: boolean }` |
| GET | `/api/hardware/empresa/{empresaId}` | — |
| GET | `/api/hardware/empresa/{empresaId}/including-inactive` | — |

### Tipos de hardware

| Método | Path | Body |
|---|---|---|
| GET | `/api/hardware-types` | — |
| POST | `/api/hardware-types` | objeto tipo |
| PUT | `/api/hardware-types/{typeId}` | objeto tipo |
| DELETE | `/api/hardware-types/{typeId}` | — |

## 3. Empresas

| Método | Path | Body / params |
|---|---|---|
| GET | `/api/empresas` | `?include_inactive=` (opcional) |
| GET | `/api/empresas/dashboard/all` | activas + inactivas, para la tabla del admin |
| GET | `/api/empresas/{id}` | — |
| POST | `/api/empresas` | objeto empresa |
| PUT | `/api/empresas/{id}` | objeto empresa |
| DELETE | `/api/empresas/{id}` | — |
| PATCH | `/api/empresas/{id}/toggle-status` | `{ activa: boolean }` |
| GET | `/api/empresas/{id}/statistics` | alimenta `/empresa/stats` y el dashboard de empresa |

Verificado contra el servidor real:

- El campo de estado es **`activa`**, en femenino, no `activo` como en el resto de
  recursos (`models/empresa.py:to_json()`).
- `toggle-status` **sí recibe cuerpo** aquí (`{ activa }` con el estado deseado), a
  diferencia del de tipos de empresa, que no lleva ninguno y solo invierte.
- `DELETE` es otro soft delete: llama a `soft_delete()`, que pone `activa: False`
  (`services/empresa_service.py:342`). Equivale a `toggle-status`; el frontend no lo usa.
- `creado_por` no se envía: sale del token del super admin (`empresa_controller.py:28`).
- `password` es obligatoria al crear; al actualizar, si no se manda se conserva la
  existente (`empresa_service.py:221`). Comprobado: tras un `PUT` sin `password`, el
  login con la contraseña anterior sigue funcionando.
- `roles` es una lista de `{ nombre, is_creator, is_alert_manager }`. `sanitize_roles()`
  pasa el nombre a minúsculas, descarta duplicados, y **si llega vacía la sustituye por
  `operador` y `supervisor`** (`utils/role_utils.py`).

## 4. Usuarios

Dos familias distintas — **no unificar sin confirmar con backend**:

| Método | Path | Uso |
|---|---|---|
| GET | `/api/usuarios` | listado global (admin) |
| GET | `/api/usuarios/including-inactive` | listado global con inactivos |
| GET | `/empresas/{empresaId}/usuarios` | multi-tenant, portal empresa |
| GET | `/empresas/{empresaId}/usuarios/including-inactive` | idem con inactivos |
| GET | `/empresas/{empresaId}/usuarios/{usuarioId}` | detalle |
| POST | `/empresas/{empresaId}/usuarios` | crear |
| PUT | `/empresas/{empresaId}/usuarios/{usuarioId}` | actualizar |
| DELETE | `/empresas/{empresaId}/usuarios/{usuarioId}` | borrar |
| PATCH | `/empresas/{empresaId}/usuarios/{usuarioId}/toggle-status` | `{ activo: boolean }` |

> **Discrepancia detectada**: `utils/api_client.py:199` llama a `/api/users/empresa/{id}`
> mientras `static/js/api-client.js:316` llama a `/empresas/{id}/usuarios`. Uno de los dos
> está muerto o el backend expone ambos. **Verificar contra el backend antes de la Fase 3.3.**

## 5. Tipos de empresa

| Método | Path |
|---|---|
| GET | `/api/tipos_empresa` |
| GET | `/api/tipos_empresa/activos` (para selects) |
| GET | `/api/tipos_empresa/dashboard/all` |
| POST | `/api/tipos_empresa` |
| PUT | `/api/tipos_empresa/{id}` |
| DELETE | `/api/tipos_empresa/{id}` |
| PATCH | `/api/tipos_empresa/{id}/toggle-status` (sin cuerpo) |

Nota: guion bajo (`tipos_empresa`), a diferencia de `tipos-alarma`. No normalizar.

**`DELETE` aquí no borra.** Es un soft delete: hace `{"$set": {"activo": False}}`, es
decir lo mismo que `toggle-status`, y además filtra por `activo: True`, así que sobre un
tipo ya inactivo responde **404 "Tipo de empresa no encontrado"** aunque el documento
exista (`repositories/tipo_empresa_repository.py:161`, comprobado contra el servidor real).

Por eso el frontend no expone "Eliminar" en tipos de empresa, solo activar/desactivar.
Contrasta con usuarios, donde `DELETE` sí es un `delete_one` permanente
(`repositories/usuario_repository.py:276`): antes de ofrecer un borrado, comprobar de
cuál de los dos se trata.

## 6. Tipos de alarma (alert-types)

Verificado contra el servidor real:

- Blueprint registrado con `url_prefix='/api'` (`core/routes.py:527`) → `/api/tipos-alarma/…`.
  Guion, no guion bajo: al revés que `tipos_empresa`.
- Es **multi-tenant**: cada tipo cuelga de una `empresa_id`, que va en el cuerpo al
  crear. Los que no la traen son "globales" (`?exclude_globales=`).
- `DELETE` aquí **sí borra de verdad** (`delete_one`,
  `repositories/tipo_alarma_repository.py:350`), a diferencia de empresas y tipos de
  empresa. Comprobado: tras eliminar, el listado baja de 1 a 0.
- `toggle-status` no recibe cuerpo: invierte el estado.
- `GET /tipos-alarma/empresa/{id}` devuelve **también los inactivos**, pese a que
  `/todos` existe como variante explícita. El frontend usa `/todos` de todos modos,
  que es el que declara esa intención.
- `imagen_base64` y `sonido_link` son opcionales, pero el modelo rechaza la cadena
  vacía "si se proporciona": o van con contenido o se omiten del cuerpo.
- Los niveles (`ROJO`, `AZUL`, `AMARILLO`, `VERDE`, `NARANJA`) se piden a
  `GET /api/tipos-alarma/tipos-alerta` en vez de copiarlos al frontend.


| Método | Path | Body |
|---|---|---|
| GET | `/api/tipos-alarma` | todos |
| GET | `/api/tipos-alarma/activos` | solo activos |
| GET | `/api/tipos-alarma/inactivos` | solo inactivos |
| GET | `/api/tipos-alarma/{id}` | detalle |
| GET | `/api/tipos-alarma/empresa/{empresaId}/todos?solo_activos=true` | por empresa |
| POST | `/api/tipos-alarma` | `{ nombre, descripcion, tipo_alerta, color_alerta, empresa_id }` — los 4 primeros obligatorios |
| PUT | `/api/tipos-alarma/{id}` | mismos campos obligatorios |
| PATCH | `/api/tipos-alarma/{id}/toggle-status` | `{ accion?, motivo? }` |
| DELETE | `/api/tipos-alarma/{id}` | — |

La validación de campos obligatorios vive hoy en `app.py:830` y `app.py:918` → pasa a un
schema Zod compartido en `features/alert-types/schema.ts`.

**Lógica a mover a Next** (`app.py:646-988`): `build_stats` y `apply_status_filter`. O se pide
al backend que exponga el conteo. Decisión pendiente de Fase 4.4.

## 7. Alertas MQTT

| Método | Path | Body / params |
|---|---|---|
| GET | `/api/mqtt-alerts/empresa/{empresaId}/active-by-sede` | `?limit=5&offset=0` |
| GET | `/api/mqtt-alerts/inactive` | `?empresaId=&limit=5&offset=0` |
| GET | `/api/mqtt-alerts/{alertId}` | detalle |
| POST | `/api/mqtt-alerts/user-alert` | objeto alerta |
| PUT | `/api/mqtt-alerts/user-alert/deactivate` | `{ alert_id, desactivado_por_id, desactivado_por_tipo, mensaje_desactivacion }` |
| PATCH | `/api/mqtt-alerts/{alertId}/toggle-status` | — |

Realtime: `NEXT_PUBLIC_WEBSOCKET_URL` (dev `ws://localhost:8080`, prod
`wss://websocket.rescue.com.co`). Un evento entrante debe invalidar `['alertas']`.

## 8. Dashboard (super admin)

| Método | Path |
|---|---|
| GET | `/api/dashboard/stats` |
| GET | `/api/dashboard/recent-companies` |
| GET | `/api/dashboard/recent-users` |
| GET | `/api/dashboard/activity-chart` |
| GET | `/api/dashboard/distribution-chart` |
| GET | `/api/dashboard/hardware-stats` |
| GET | `/api/dashboard/system-performance` |

## 9. Contacto

| Método | Path | Notas |
|---|---|---|
| POST | `/api/contact/send` | Público (no requiere `auth_token`). Hoy Flask añade `User-Agent: RESCUE-Frontend/1.0` (`app.py:333`) — replicar en el Route Handler. |

## 10. Servicio de imágenes — **base distinta**

No pasa por `BACKEND_API_URL` sino por `IMAGES_SERVICE_BASE_URL`
(`https://images-service.rescue.com.co`). Necesita su propio Route Handler, no el proxy genérico.

| Método | Path (relativo a `IMAGES_SERVICE_BASE_URL`) | Notas |
|---|---|---|
| GET | `folders` | lista de nombres de carpeta |
| POST | `folders` | `{ name }` |
| DELETE | `folders/{folderName}` | borra carpeta |
| GET | `folders/{folderName}/files` | archivos de la carpeta |
| GET | `folders/{folderName}/files/{fileName}` | descarga/serve del archivo |
| POST | `upload` | `multipart/form-data` con `folder` + archivo |

La normalización de entradas de `utils/images_service.py:27-72` (`_normalize_file_entry`:
el backend devuelve a veces string, a veces objeto con `url`/`path`/`download_url`) debe
portarse a `features/imagenes/api.ts`. Es lógica de negocio real, no boilerplate.

---

## 11. Rutas Flask que **desaparecen** (no se portan)

Envoltorios que solo reenvían al backend; el cliente pegará directo vía BFF:

- `/api/sync-session` — la sesión Flask deja de existir.
- `/admin/alert-types/{create,*/update,*/detail,*/delete,*/toggle,*/deactivate}` → `/api/tipos-alarma/*`.
- `/admin/imagenes/*`, `/admin/image-assets/folders*` → servicio de imágenes.
- `/test-login`, `/debug/validate-contact-config` — utilidades de desarrollo.

## 12. Verificaciones pendientes (bloquean fases posteriores)

| # | Verificación | Estado |
|---|---|---|
| 1 | Obtener `JWT_SECRET` y validar un `auth_token` real con `jose` | ✅ Es `JWT_SECRET_KEY` del backend |
| 2 | Confirmar si el backend fija `Domain`/`Path` en las cookies | ✅ El BFF reescribe los flags de todos modos |
| 3 | Resolver la discrepancia `/api/users/empresa/{id}` vs `/empresas/{id}/usuarios` | ✅ Gana `/empresas/{id}/usuarios` |
| 4 | Confirmar la forma exacta de `data` en cada listado | ⏳ Pendiente: la base está casi vacía |
| 5 | Validar `Upgrade`/`Connection` del WebSocket detrás del reverse proxy | ⏳ Fase 3.5 |
| 6 | **Crear un usuario con rol `empresa`** | ⏳ Solo existe `superadmin`; el portal empresa no se puede probar con datos reales |
