/*
 * Copyright (c) 2026 PaperAxis. All rights reserved.
 * This file is part of PaperAnalysis. Unauthorized copying, modification
 * or distribution of this file is strictly prohibited.
 */
function pad(n: number): string {
  return String(n).padStart(2, '0')
}

/**
 * Zaman damgalı rapor dosya adı üretir.
 * Örn: reportFileName('Satış Panosu', date) → "Satış_Panosu_2026-07-06_14-30-00.pdf"
 */
export function reportFileName(base: string, date: Date): string {
  const safe = (base || 'pano').trim().replace(/[^\p{L}\p{N}._-]+/gu, '_') || 'pano'
  const y = date.getFullYear()
  const mo = pad(date.getMonth() + 1)
  const d = pad(date.getDate())
  const h = pad(date.getHours())
  const mi = pad(date.getMinutes())
  const s = pad(date.getSeconds())
  return `${safe}_${y}-${mo}-${d}_${h}-${mi}-${s}.pdf`
}
