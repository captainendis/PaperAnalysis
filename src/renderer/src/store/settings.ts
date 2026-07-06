import { create } from 'zustand'
import type { ThemeMode } from '../lib/chartTheme'

const KEY = 'pb-settings'

interface Persisted {
  theme: ThemeMode
  palette: string
  /** Şema ağacından tablo önizleme satır sınırı. 0 = Tümü (sınırsız). */
  previewLimit: number
}

const DEFAULTS: Persisted = { theme: 'dark', palette: 'default', previewLimit: 0 }

function load(): Persisted {
  try {
    const raw = localStorage.getItem(KEY)
    if (raw) return { ...DEFAULTS, ...JSON.parse(raw) }
  } catch {
    /* yoksay */
  }
  return { ...DEFAULTS }
}

function persist(p: Persisted): void {
  try {
    localStorage.setItem(KEY, JSON.stringify(p))
  } catch {
    /* yoksay */
  }
}

interface SettingsState extends Persisted {
  setTheme: (theme: ThemeMode) => void
  toggleTheme: () => void
  setPalette: (palette: string) => void
  setPreviewLimit: (n: number) => void
}

export const useSettings = create<SettingsState>((set, get) => ({
  ...load(),

  setTheme: (theme) => {
    set({ theme })
    persist({ theme, palette: get().palette, previewLimit: get().previewLimit })
  },

  toggleTheme: () => {
    const theme: ThemeMode = get().theme === 'dark' ? 'light' : 'dark'
    set({ theme })
    persist({ theme, palette: get().palette, previewLimit: get().previewLimit })
  },

  setPalette: (palette) => {
    set({ palette })
    persist({ theme: get().theme, palette, previewLimit: get().previewLimit })
  },

  setPreviewLimit: (previewLimit) => {
    set({ previewLimit })
    persist({ theme: get().theme, palette: get().palette, previewLimit })
  }
}))
