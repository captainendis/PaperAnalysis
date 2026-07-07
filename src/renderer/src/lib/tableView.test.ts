import { describe, it, expect } from 'vitest'
import {
  cellToText,
  includesFilter,
  compareCells,
  buildViewResult,
  matchesFilter,
  sumValues,
  isNumericColumn,
  groupResult
} from './tableView'
import type { QueryResult } from '@shared/types'

describe('cellToText', () => {
  it('null/undefined boş dize verir', () => {
    expect(cellToText(null)).toBe('')
    expect(cellToText(undefined)).toBe('')
  })
  it('nesneyi JSON olarak verir', () => {
    expect(cellToText({ a: 1 })).toBe('{"a":1}')
  })
  it('sayı/metni String olarak verir', () => {
    expect(cellToText(42)).toBe('42')
    expect(cellToText('abc')).toBe('abc')
  })
})

describe('includesFilter', () => {
  it('büyük/küçük harf duyarsız içeren', () => {
    expect(includesFilter('Merkez Depo', 'depo')).toBe(true)
    expect(includesFilter('Merkez Depo', 'DEPO')).toBe(true)
    expect(includesFilter('Merkez Depo', 'şube')).toBe(false)
  })
  it('boş sorgu tümünü geçirir', () => {
    expect(includesFilter('herhangi', '')).toBe(true)
    expect(includesFilter(null, '  ')).toBe(true)
  })
  it('sayısal değerde alt-dize eşleşmesi', () => {
    expect(includesFilter(120, '12')).toBe(true)
    expect(includesFilter(120, '99')).toBe(false)
  })
})

describe('compareCells', () => {
  it('sayısal sıralar (dize karşılaştırması değil)', () => {
    expect(compareCells(9, 10)).toBeLessThan(0)
    expect(compareCells(100, 20)).toBeGreaterThan(0)
    // Dize olsaydı '9' > '10' olurdu; sayısal olduğu için değil.
    expect(compareCells('9', '10')).toBeLessThan(0)
  })
  it('metni yerel karşılaştırır (A→Z)', () => {
    expect(compareCells('elma', 'muz')).toBeLessThan(0)
    expect(compareCells('muz', 'elma')).toBeGreaterThan(0)
  })
  it('Türkçe harf sırasına göre A→Z sıralar', () => {
    const words = ['zeytin', 'çilek', 'armut', 'şeftali', 'ıhlamur']
    const sorted = [...words].sort(compareCells)
    expect(sorted).toEqual(['armut', 'çilek', 'ıhlamur', 'şeftali', 'zeytin'])
  })
  it('null/undefined en sona', () => {
    expect(compareCells(null, 5)).toBeGreaterThan(0)
    expect(compareCells(5, null)).toBeLessThan(0)
    expect(compareCells(null, null)).toBe(0)
  })
})

describe('matchesFilter', () => {
  it('operatörsüz sorguda içeren eşleşmesi yapar', () => {
    expect(matchesFilter('Merkez', 'merk')).toBe(true)
    expect(matchesFilter('Merkez', 'depo')).toBe(false)
  })
  it('> ve < operatörleri', () => {
    expect(matchesFilter(150, '>100')).toBe(true)
    expect(matchesFilter(50, '>100')).toBe(false)
    expect(matchesFilter(50, '<100')).toBe(true)
  })
  it('>=, <=, =, <> operatörleri', () => {
    expect(matchesFilter(100, '>=100')).toBe(true)
    expect(matchesFilter(100, '<=100')).toBe(true)
    expect(matchesFilter(0, '=0')).toBe(true)
    expect(matchesFilter(5, '<>0')).toBe(true)
    expect(matchesFilter(0, '!=0')).toBe(false)
  })
  it('stokta olmayanları gizleme: ">0" yalnızca pozitifleri geçirir', () => {
    expect(matchesFilter(0, '>0')).toBe(false)
    expect(matchesFilter(3, '>0')).toBe(true)
  })
  it('sayısal operatörde sayı olmayan hücreyi eler', () => {
    expect(matchesFilter('abc', '>0')).toBe(false)
    expect(matchesFilter(null, '<10')).toBe(false)
  })
  it('metin sayısal (string) değeri de karşılaştırır', () => {
    expect(matchesFilter('120', '>100')).toBe(true)
  })
})

describe('sumValues', () => {
  it('sonlu sayıları toplar, sayı olmayanları yok sayar', () => {
    expect(sumValues([1, 2, 3])).toBe(6)
    expect(sumValues([1, 'x', null, '4', 5])).toBe(10)
    expect(sumValues([])).toBe(0)
  })
})

describe('isNumericColumn', () => {
  it('tüm boş olmayan değerler sayıysa true', () => {
    expect(isNumericColumn([{ a: 1 }, { a: '2' }, { a: null }], 'a')).toBe(true)
  })
  it('metin içeren sütunda false', () => {
    expect(isNumericColumn([{ a: 1 }, { a: 'elma' }], 'a')).toBe(false)
  })
  it('tamamen boş sütunda false', () => {
    expect(isNumericColumn([{ a: null }, { a: '' }], 'a')).toBe(false)
  })
})

describe('groupResult', () => {
  const r: QueryResult = {
    columns: [{ name: 'malzeme' }, { name: 'depo' }, { name: 'adet' }],
    rows: [
      { malzeme: 'M1', depo: 'A', adet: 10 },
      { malzeme: 'M1', depo: 'B', adet: 5 },
      { malzeme: 'M2', depo: 'A', adet: 3 }
    ],
    rowCount: 3,
    elapsedMs: 1
  }
  it('tekrarlayan değerleri birleştirir, sayısalı toplar, Adet ekler', () => {
    const g = groupResult(r, 'malzeme')
    expect(g.rowCount).toBe(2)
    const m1 = g.rows.find((x) => x.malzeme === 'M1')!
    expect(m1.adet).toBe(15) // 10 + 5
    expect(m1.Adet).toBe(2) // 2 satır birleşti
    expect(m1.depo).toBe('A') // ilk değer korunur
    const m2 = g.rows.find((x) => x.malzeme === 'M2')!
    expect(m2.adet).toBe(3)
    expect(m2.Adet).toBe(1)
    expect(g.columns.map((c) => c.name)).toContain('Adet')
  })
  it('sum=false ise toplamaz, ilk değeri korur (yine de birleştirir + Adet)', () => {
    const g = groupResult(r, 'malzeme', false)
    expect(g.rowCount).toBe(2)
    const m1 = g.rows.find((x) => x.malzeme === 'M1')!
    expect(m1.adet).toBe(10) // toplanmadı, ilk satırın değeri
    expect(m1.Adet).toBe(2) // yine 2 satır birleşti
  })
  it('bilinmeyen sütunda sonucu değiştirmez', () => {
    expect(groupResult(r, 'yok')).toBe(r)
  })
  it('excludeSum içindeki sayısal sütunu toplamaz (ilk değeri korur)', () => {
    const r2: QueryResult = {
      columns: [{ name: 'malzeme' }, { name: 'adet' }, { name: 'fiyat' }],
      rows: [
        { malzeme: 'M1', adet: 10, fiyat: 5 },
        { malzeme: 'M1', adet: 5, fiyat: 7 }
      ],
      rowCount: 2,
      elapsedMs: 1
    }
    const g = groupResult(r2, 'malzeme', true, ['fiyat'])
    const m1 = g.rows.find((x) => x.malzeme === 'M1')!
    expect(m1.adet).toBe(15) // toplandı
    expect(m1.fiyat).toBe(5) // toplama dışı → ilk değer
  })
})

describe('buildViewResult', () => {
  it('görünür sütun ve satırlardan QueryResult üretir', () => {
    const r = buildViewResult(['ad', 'fiyat'], [
      { ad: 'elma', fiyat: 3 },
      { ad: 'muz', fiyat: 5 }
    ])
    expect(r.columns).toEqual([{ name: 'ad' }, { name: 'fiyat' }])
    expect(r.rowCount).toBe(2)
    expect(r.rows[0]).toEqual({ ad: 'elma', fiyat: 3 })
  })
})
