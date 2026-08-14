/*
 * Copyright (c) 2026 PaperAxis. All rights reserved.
 * This file is part of PaperAnalysis. Unauthorized copying, modification
 * or distribution of this file is strictly prohibited.
 */
// Erişilebilir kategorik grafik paletleri. Varsayılan palet PaperAxis kurumsal
// grafik setidir (bkz. styles/tokens.css → --pa-chart-*). Diğer paletler dataviz
// becerisinin doğrulanmış referans paletinden gelir ve uygulamanın koyu/açık
// yüzeylerine karşı validate edilmiştir (CVD/kontrast).

export interface Palette {
  name: string
  label: string
  /** Koyu tema hue'ları (koyu yüzey için steplenmiş). */
  dark: string[]
  /** Açık tema hue'ları. */
  light: string[]
}

/** Kurumsal grafik seti — lacivert/mercan ailesiyle uyumlu altı seri rengi. */
const PA_CHART = ['#E0552A', '#3C7DBB', '#1E9578', '#B87D12', '#7E63C9', '#2E9BB3']

export const PALETTES: Palette[] = [
  {
    name: 'paperaxis',
    label: 'PaperAxis',
    // Kurumsal set hem navy-800 hem paper-50 zeminde 3:1 üzerinde okunur;
    // bu yüzden iki temada da aynı diziyle kullanılır.
    dark: PA_CHART,
    light: PA_CHART
  },
  {
    name: 'default',
    label: 'Klasik',
    dark: ['#3987e5', '#199e70', '#c98500', '#008300', '#9085e9', '#e66767', '#d55181', '#d95926'],
    light: ['#2a78d6', '#1baf7a', '#eda100', '#008300', '#4a3aa7', '#e34948', '#e87ba4', '#eb6834']
  },
  {
    name: 'vivid',
    label: 'Canlı',
    dark: ['#3987e5', '#d95926', '#199e70', '#e66767', '#9085e9', '#c98500', '#008300', '#d55181'],
    light: ['#2a78d6', '#eb6834', '#1baf7a', '#e34948', '#4a3aa7', '#eda100', '#008300', '#e87ba4']
  },
  {
    name: 'calm',
    label: 'Dingin',
    dark: ['#3987e5', '#199e70', '#9085e9', '#008300', '#d55181', '#c98500', '#e66767', '#d95926'],
    light: ['#2a78d6', '#1baf7a', '#4a3aa7', '#008300', '#e87ba4', '#eda100', '#e34948', '#eb6834']
  }
]

/** Ada göre palet döndürür; bilinmeyen ada kurumsal paleti verir. */
export function getPalette(name: string): Palette {
  return PALETTES.find((p) => p.name === name) ?? PALETTES[0]
}
