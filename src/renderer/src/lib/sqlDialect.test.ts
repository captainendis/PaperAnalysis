import { describe, it, expect } from 'vitest'
import { previewSelect, quoteIdent } from './sqlDialect'

describe('previewSelect', () => {
  it('MSSQL için TOP kullanır (LIMIT değil)', () => {
    expect(previewSelect('mssql', 'dbo', 'Musteriler')).toBe(
      'SELECT TOP 100 * FROM [dbo].[Musteriler]'
    )
  })

  it('PostgreSQL için LIMIT ve çift tırnak', () => {
    expect(previewSelect('postgres', 'public', 'orders')).toBe(
      'SELECT * FROM "public"."orders" LIMIT 100'
    )
  })

  it('MySQL için LIMIT ve backtick, şemasız', () => {
    expect(previewSelect('mysql', undefined, 'orders')).toBe('SELECT * FROM `orders` LIMIT 100')
  })

  it('SQLite için LIMIT', () => {
    expect(previewSelect('sqlite', undefined, 'satislar')).toBe(
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
