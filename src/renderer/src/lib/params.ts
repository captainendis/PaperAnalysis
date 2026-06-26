import type { DashboardParameter } from '@shared/types'

/**
 * Pano parametrelerini sorguya geçirilecek değer nesnesine çevirir.
 * Tür dönüşümü uygulanır (number → sayı); boş değerler null olur.
 */
export function paramValues(
  parameters: DashboardParameter[] | undefined
): Record<string, unknown> {
  const out: Record<string, unknown> = {}
  for (const p of parameters ?? []) {
    if (p.value === '' || p.value === undefined) {
      out[p.name] = null
    } else if (p.type === 'number') {
      const n = Number(p.value)
      out[p.name] = Number.isFinite(n) ? n : null
    } else {
      // text ve date sürücüye dizgi olarak geçer (DB tarafında CAST edilebilir).
      out[p.name] = p.value
    }
  }
  return out
}
