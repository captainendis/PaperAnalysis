import { describe, it, expect } from 'vitest'
import { cellToText, includesFilter, compareCells } from './tableView'

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
  it('metni yerel karşılaştırır', () => {
    expect(compareCells('elma', 'muz')).toBeLessThan(0)
    expect(compareCells('muz', 'elma')).toBeGreaterThan(0)
  })
  it('null/undefined en sona', () => {
    expect(compareCells(null, 5)).toBeGreaterThan(0)
    expect(compareCells(5, null)).toBeLessThan(0)
    expect(compareCells(null, null)).toBe(0)
  })
})
