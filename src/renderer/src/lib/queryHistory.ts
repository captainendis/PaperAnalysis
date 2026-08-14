/*
 * Copyright (c) 2026 PaperAxis. All rights reserved.
 * This file is part of PaperAnalysis. Unauthorized copying, modification
 * or distribution of this file is strictly prohibited.
 */
export interface HistoryEntry {
  id: string
  sql: string
  connectionId: string | null
  at: number
}

/**
 * Geçmiş listesine yeni bir kayıt ekler. Boş SQL atlanır; en yeni kayıtla aynı
 * (ardışık tekrar) SQL atlanır; liste `max` ile kırpılır. En yeni başta.
 */
export function pushHistory(
  list: HistoryEntry[],
  entry: HistoryEntry,
  max = 50
): HistoryEntry[] {
  const sql = entry.sql.trim()
  if (!sql) return list
  if (list[0]?.sql.trim() === sql) return list
  return [entry, ...list].slice(0, max)
}
