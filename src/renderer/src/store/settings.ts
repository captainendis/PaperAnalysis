import { create } from 'zustand'
import type { ThemeMode } from '../lib/chartTheme'

const KEY = 'pb-settings'

interface Persisted {
  theme: ThemeMode
  palette: string
}

function load(): Persisted {
  try {
    const raw = localStorage.getItem(KEY)
    if (raw) return { theme: 'dark', palette: 'default', ...JSON.parse(raw) }
  } catch {
    /* yoksay */
  }
  return { theme: 'dark', palette: 'default' }
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
}

export const useSettings = create<SettingsState>((set, get) => ({
  ...load(),

  setTheme: (theme) => {
    set({ theme })
    persist({ theme, palette: get().palette })
  },

  toggleTheme: () => {
    const theme: ThemeMode = get().theme === 'dark' ? 'light' : 'dark'
    set({ theme })
    persist({ theme, palette: get().palette })
  },

  setPalette: (palette) => {
    set({ palette })
    persist({ theme: get().theme, palette })
  }
}))
