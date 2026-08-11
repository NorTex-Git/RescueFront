const DOT_TONES = {
  neutral: 'bg-[var(--shell-text-muted)]',
  danger: 'bg-[var(--shell-danger)]',
  success: 'bg-[var(--shell-ok)]',
} as const

/**
 * Bloque "ACTIVIDAD" del sidebar (diseño `admin-shell-v2.pen` → nodo "Mid Block"),
 * entre la navegación y "Cerrar Sesión". Solo métricas reales: cada `item` lo arma
 * quien llama con datos ya verificados contra el backend (no se inventan cifras).
 */
export function SidebarActivity({
  items,
}: {
  items: { label: string; value: string | number; tone?: keyof typeof DOT_TONES }[]
}) {
  if (items.length === 0) return null

  return (
    <div className="border-t border-[var(--shell-border-soft)] pt-[18px]">
      <p className="px-2 text-[10px] font-semibold tracking-[1.4px] text-[var(--shell-text-muted)] uppercase">
        Actividad
      </p>
      <ul className="mt-3 flex flex-col gap-0.5">
        {items.map((item) => (
          <li
            key={item.label}
            className="flex h-9 items-center justify-between rounded-[9px] px-2 text-sm"
          >
            <span className="flex items-center gap-[9px] text-[var(--shell-text)]">
              <span
                aria-hidden
                className={`size-1.5 shrink-0 rounded-full ${DOT_TONES[item.tone ?? 'neutral']}`}
              />
              {item.label}
            </span>
            <span className="font-semibold text-[var(--shell-text-strong)]">{item.value}</span>
          </li>
        ))}
      </ul>
    </div>
  )
}
