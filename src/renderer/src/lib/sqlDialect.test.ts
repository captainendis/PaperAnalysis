/*
 * Copyright (c) 2026 PaperAxis. All rights reserved.
 * This file is part of PaperAnalysis. Unauthorized copying, modification
 * or distribution of this file is strictly prohibited.
 */
import { describe, it, expect } from 'vitest'
import { previewSelect, quoteIdent } from './sqlDialect'

describe('previewSelect', () => {
  it('limit yoksa satır sınırı eklemez (tüm veri)', () => {
    expect(previewSelect('mssql', 'dbo', 'Musteriler')).toBe('SELECT * FROM [dbo].[Musteriler]')
    expect(previewSelect('postgres', 'public', 'orders')).toBe('SELECT * FROM "public"."orders"')
  })

  it('MSSQL için limit verilince TOP kullanır', () => {
    expect(previewSelect('mssql', 'dbo', 'Musteriler', 100)).toBe(
      'SELECT TOP 100 * FROM [dbo].[Musteriler]'
    )
  })

  it('diğerleri için limit verilince LIMIT ekler', () => {
    expect(previewSelect('postgres', 'public', 'orders', 100)).toBe(
      'SELECT * FROM "public"."orders" LIMIT 100'
    )
    expect(previewSelect('mysql', undefined, 'orders', 50)).toBe(
      'SELECT * FROM `orders` LIMIT 50'
    )
    expect(previewSelect('sqlite', undefined, 'satislar', 100)).toBe(
      'SELECT * FROM "satislar" LIMIT 100'
    )
  })
})

describe('quoteIdent', () => {
  it('MSSQL köşeli parantez ve kaçış', () => {
    expect(quoteIdent('mssql', 'a]b')).toBe('[a]]b]')
  })
  it('MySQL backtick kaçışı', () => {
    expect(quoteIdent('mysql', 'a`b')).toBe('`a``b`')
  })
})
