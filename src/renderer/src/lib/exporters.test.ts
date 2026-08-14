/*
 * Copyright (c) 2026 PaperAxis. All rights reserved.
 * This file is part of PaperAnalysis. Unauthorized copying, modification
 * or distribution of this file is strictly prohibited.
 */
import { describe, it, expect } from 'vitest'
import { toCsv } from './exporters'
import type { QueryResult } from '@shared/types'

const result: QueryResult = {
  columns: [{ name: 'ad' }, { name: 'not' }, { name: 'tutar' }],
  rows: [
    { ad: 'Ali', not: 'normal', tutar: 10 },
    { ad: 'Veli, Ayşe', not: 'virgüllü', tutar: 20 },
    { ad: 'Tırnak"lı', not: 'çift"tırnak', tutar: null },
    { ad: 'Çok\nsatır', not: 'yeni satır', tutar: 5 }
  ],
  rowCount: 4,
  elapsedMs: 1
}

describe('toCsv', () => {
  it('başlık satırını yazar', () => {
    const csv = toCsv(result)
    expect(csv.split('\r\n')[0]).toBe('ad,not,tutar')
  })

  it('virgül içeren alanı tırnaklar', () => {
    expect(toCsv(result)).toContain('"Veli, Ayşe"')
  })

  it('çift tırnağı ikiye katlar', () => {
    expect(toCsv(result)).toContain('"Tırnak""lı"')
  })

  it('yeni satır içeren alanı tırnaklar', () => {
    expect(toCsv(result)).toContain('"Çok\nsatır"')
  })

  it('null değeri boş alana çevirir', () => {
    const lines = toCsv(result).split('\r\n')
    // 3. veri satırı (index 3): Tırnak"lı,...,(boş)
    expect(lines[3].endsWith(',')).toBe(true)
  })
})
