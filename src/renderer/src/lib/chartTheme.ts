import { getPalette } from './palettes'

export type ThemeMode = 'dark' | 'light'

/** ECharts render'ında kullanılan tema-duyarlı renkler. */
export interface ChartTheme {
  text: string
  axis: string
  grid: string
  palette: string[]
}

/** Mod + palet adından grafik temasını üretir. */
export function chartTheme(mode: ThemeMode, paletteName: string): ChartTheme {
  const p = getPalette(paletteName)
  return mode === 'light'
    ? { text: '#52514e', axis: '#898781', grid: '#e1e0d9', palette: p.light }
    : { text: '#c3c2b7', axis: '#898781', grid: '#2c2c2a', palette: p.dark }
}

/** chartSpec için geriye dönük uyumlu varsayılan (koyu tema). */
export const DEFAULT_CHART_THEME: ChartTheme = chartTheme('dark', 'default')
