import { describe, it, expect } from 'vitest'
import { pushHistory, type HistoryEntry } from './queryHistory'

const mk = (sql: string, id = sql): HistoryEntry => ({
  id,
  sql,
  connectionId: 'c',
  at: 0
})

describe('pushHistory', () => {
  it('yeni kaydı başa ekler', () => {
    const list = pushHistory([mk('A')], mk('B'))
    expect(list.map((e) => e.sql)).toEqual(['B', 'A'])
  })

  it('ardışık aynı SQL tekrarını atlar', () => {
    const list = pushHistory([mk('A')], mk('A'))
    expect(list.length).toBe(1)
  })

  it('boş SQL eklemez', () => {
    const list = pushHistory([mk('A')], mk('   '))
    expect(list.length).toBe(1)
  })

  it('maksimum sınırına göre kırpar', () => {
    let list: HistoryEntry[] = []
    for (let i = 0; i < 10; i++) list = pushHistory(list, mk('q' + i), 5)
    expect(list.length).toBe(5)
    expect(list[0].sql).toBe('q9')
  })
})
