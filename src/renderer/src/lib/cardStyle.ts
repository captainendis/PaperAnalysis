/*
 * Copyright (c) 2026 PaperAxis. All rights reserved.
 * This file is part of PaperAnalysis. Unauthorized copying, modification
 * or distribution of this file is strictly prohibited.
 */
import type { CardStyle } from '@shared/types'

// Grafik kartı görsel stilini CSS'e çeviren saf yardımcılar (birim test edilebilir).
// Yalnızca açıkça ayarlanmış alanlar için CSS üretilir; kalanlar temanın varsayılanını
// (Tailwind sınıfları) kullanmaya devam eder.

const SHADOWS: Record<string, string> = {
  none: 'none',
  sm: '0 1px 2px rgba(0,0,0,0.12)',
  md: '0 4px 12px rgba(0,0,0,0.20)',
  lg: '0 12px 28px rgba(0,0,0,0.32)'
}

/** CardStyle'ı React inline-style nesnesine çevirir (yalnızca ayarlı alanlar). */
export function cardStyleProps(s?: CardStyle): Record<string, string> {
  const out: Record<string, string> = {}
  if (!s) return out

  if (typeof s.radius === 'number') out.borderRadius = `${Math.max(0, s.radius)}px`

  if (s.bg === 'gradient' && s.bgColor && s.bgColor2) {
    out.background = `linear-gradient(${s.bgAngle ?? 135}deg, ${s.bgColor}, ${s.bgColor2})`
  } else if (s.bg === 'solid' && s.bgColor) {
    out.background = s.bgColor
  }

  if (s.border === 'none') {
    out.border = 'none'
  } else if ((s.border === 'solid' || s.border === 'dashed') && s.borderColor) {
    out.border = `${s.borderWidth ?? 1}px ${s.border} ${s.borderColor}`
  }

  if (s.shadow) out.boxShadow = SHADOWS[s.shadow] ?? 'none'

  return out
}

/** camelCase CSS anahtarını kebab-case'e çevirir (borderRadius → border-radius). */
function kebab(k: string): string {
  return k.replace(/[A-Z]/g, (m) => '-' + m.toLowerCase())
}

/** CardStyle'ı satır içi CSS dizesine çevirir (yayınlanan HTML için). */
export function cardStyleCssString(s?: CardStyle): string {
  return Object.entries(cardStyleProps(s))
    .map(([k, v]) => `${kebab(k)}: ${v}`)
    .join('; ')
}
