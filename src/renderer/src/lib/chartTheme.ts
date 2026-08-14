/*
 * Copyright (c) 2026 PaperAxis. All rights reserved.
 * This file is part of PaperAnalysis. Unauthorized copying, modification
 * or distribution of this file is strictly prohibited.
 */
import { getPalette } from './palettes'

export type ThemeMode = 'dark' | 'light'

/** ECharts render'ında kullanılan tema-duyarlı renkler. */
export interface ChartTheme {
  text: string
  axis: string
  grid: string
  palette: string[]
}

/**
 * Mod + palet adından grafik temasını üretir. ECharts tuvale çizdiği için CSS
 * değişkeni okuyamaz; değerler PaperAxis tokenlarının birebir karşılığıdır
 * (açık: ink-600/ink-400/paper-200 — koyu: navy-100/navy-300/navy-700).
 */
export function chartTheme(mode: ThemeMode, paletteName: string): ChartTheme {
  const p = getPalette(paletteName)
  return mode === 'light'
    ? { text: '#4A5462', axis: '#8A94A2', grid: '#E6E1D7', palette: p.light }
    : { text: '#DAE6F2', axis: '#7FA3CB', grid: '#163356', palette: p.dark }
}

/** chartSpec için geriye dönük uyumlu varsayılan (koyu tema). */
export const DEFAULT_CHART_THEME: ChartTheme = chartTheme('dark', 'paperaxis')
