import { create } from 'zustand'
import type { SchemaInfo } from '@shared/types'

interface SchemaState {
  /** connectionId → şema önbelleği. */
  cache: Record<string, SchemaInfo>
  loadingId: string | null
  error: string | null
  /** Şemayı yükler (önbellekte yoksa veya force ile yeniler). */
  load: (connectionId: string, force?: boolean) => Promise<void>
}

export const useSchema = create<SchemaState>((set, get) => ({
  cache: {},
  loadingId: null,
  error: null,

  load: async (connectionId, force = false) => {
    if (!connectionId) return
    if (!force && get().cache[connectionId]) return
    set({ loadingId: connectionId, error: null })
    const res = await window.api.schema.introspect(connectionId)
    if (res.ok) {
      set((s) => ({ cache: { ...s.cache, [connectionId]: res.data }, loadingId: null }))
    } else {
      set({ loadingId: null, error: res.error })
    }
  }
}))
