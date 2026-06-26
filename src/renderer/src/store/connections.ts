import { create } from 'zustand'
import type { ConnectionConfig, SafeConnection } from '@shared/types'

interface ConnectionsState {
  items: SafeConnection[]
  activeId: string | null
  loading: boolean
  error: string | null
  refresh: () => Promise<void>
  save: (config: ConnectionConfig) => Promise<boolean>
  remove: (id: string) => Promise<void>
  setActive: (id: string | null) => void
}

export const useConnections = create<ConnectionsState>((set, get) => ({
  items: [],
  activeId: null,
  loading: false,
  error: null,

  refresh: async () => {
    set({ loading: true, error: null })
    const res = await window.api.connection.list()
    if (res.ok) {
      set((s) => ({
        items: res.data,
        loading: false,
        // Aktif bağlantı silinmişse ilk bağlantıya düş.
        activeId:
          s.activeId && res.data.some((c) => c.id === s.activeId)
            ? s.activeId
            : (res.data[0]?.id ?? null)
      }))
    } else {
      set({ loading: false, error: res.error })
    }
  },

  save: async (config) => {
    const res = await window.api.connection.save(config)
    if (res.ok) {
      await get().refresh()
      set({ activeId: config.id })
      return true
    }
    set({ error: res.error })
    return false
  },

  remove: async (id) => {
    const res = await window.api.connection.delete(id)
    if (res.ok) {
      await get().refresh()
    } else {
      set({ error: res.error })
    }
  },

  setActive: (id) => set({ activeId: id })
}))
