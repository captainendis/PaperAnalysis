/*
 * Copyright (c) 2026 PaperAxis. All rights reserved.
 * This file is part of PaperAnalysis. Unauthorized copying, modification
 * or distribution of this file is strictly prohibited.
 */
import { create } from 'zustand'
import { pushHistory, type HistoryEntry } from '../lib/queryHistory'
import { uid } from '../lib/serialize'

export interface SavedQuery {
  id: string
  name: string
  sql: string
  connectionId: string | null
}

const KEY = 'pb-queries'

interface Persisted {
  history: HistoryEntry[]
  saved: SavedQuery[]
}

function load(): Persisted {
  try {
    const raw = localStorage.getItem(KEY)
    if (raw) return { history: [], saved: [], ...JSON.parse(raw) }
  } catch {
    /* yoksay */
  }
  return { history: [], saved: [] }
}

function persist(p: Persisted): void {
  try {
    localStorage.setItem(KEY, JSON.stringify(p))
  } catch {
    /* yoksay */
  }
}

interface QueriesState extends Persisted {
  addHistory: (sql: string, connectionId: string | null) => void
  saveQuery: (name: string, sql: string, connectionId: string | null) => void
  deleteSaved: (id: string) => void
  clearHistory: () => void
}

export const useQueries = create<QueriesState>((set, get) => ({
  ...load(),

  addHistory: (sql, connectionId) => {
    const entry: HistoryEntry = { id: uid('h'), sql, connectionId, at: Date.now() }
    const history = pushHistory(get().history, entry)
    set({ history })
    persist({ history, saved: get().saved })
  },

  saveQuery: (name, sql, connectionId) => {
    const saved = [{ id: uid('q'), name, sql, connectionId }, ...get().saved]
    set({ saved })
    persist({ history: get().history, saved })
  },

  deleteSaved: (id) => {
    const saved = get().saved.filter((q) => q.id !== id)
    set({ saved })
    persist({ history: get().history, saved })
  },

  clearHistory: () => {
    set({ history: [] })
    persist({ history: [], saved: get().saved })
  }
}))
