// Erişilebilir kategorik grafik paletleri. Renkler dataviz becerisinin
// doğrulanmış referans paletinden alınmış ve uygulamanın koyu (#252731) ve
// açık yüzeylerine karşı validate edilmiştir (CVD/kontrast).

export interface Palette {
  name: string
  label: string
  /** Koyu tema hue'ları (koyu yüzey için steplenmiş). */
  dark: string[]
  /** Açık tema hue'ları. */
  light: string[]
}

export const PALETTES: Palette[] = [
  {
    name: 'default',
    label: 'Varsayılan',
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

/** Ada göre palet döndürür; bilinmeyen ada varsayılan paleti verir. */
export function getPalette(name: string): Palette {
  return PALETTES.find((p) => p.name === name) ?? PALETTES[0]
}
