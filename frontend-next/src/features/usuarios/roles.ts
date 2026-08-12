/**
 * Porta `normalizeEmpresaRoles` de `usuarios-modals.js:1372`.
 *
 * El backend devuelve los roles como cadenas **o** como objetos `{nombre|name, …}`
 * según la antigüedad del registro. Aquí solo interesa el nombre.
 *
 * Vive aparte de `server.ts` porque lo necesitan los dos lados: el Server Component
 * que carga la página y el cliente que recarga los roles al cambiar de empresa.
 * `server.ts` arrastra `next/headers`, que no puede entrar en un bundle de cliente.
 */
export function normalizeEmpresaRoles(rawRoles: unknown): string[] {
  if (!Array.isArray(rawRoles)) return []

  return rawRoles
    .map((rol) => {
      if (typeof rol === 'string') return rol.trim()
      if (rol && typeof rol === 'object') {
        const { nombre, name } = rol as { nombre?: unknown; name?: unknown }
        return String(nombre ?? name ?? '').trim()
      }
      return ''
    })
    .filter(Boolean)
}
