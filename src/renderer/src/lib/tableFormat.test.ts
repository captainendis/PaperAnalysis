/*
 * Copyright (c) 2026 PaperAxis. All rights reserved.
 * This file is part of PaperAnalysis. Unauthorized copying, modification
 * or distribution of this file is strictly prohibited.
 */
import { describe, it, expect } from 'vitest'
import { formatValue, matchesRule, cellStyle } from './tableFormat'
import type { ConditionalRule } from '@shared/types'

describe('formatValue', () => {
  it('auto → ham metin', () => {
    expect(formatValue(1234.5, { kind: 'auto' })).toBe('1234.5')
    expect(formatValue('abc')).toBe('abc')
  })
  it('number → binlik ayraç + ondalık', () => {
    expect(formatValue(1234567.891, { kind: 'number', decimals: 2 })).toBe('1.234.567,89')
    expect(formatValue(1000, { kind: 'number', decimals: 0, thousands: false })).toBe('1000')
  })
  it('currency → para birimi', () => {
    const s = formatValue(1500, { kind: 'currency', currency: 'TRY', decimals: 2 })
    expect(s).toContain('1.500,00')
    expect(s).toMatch(/₺|TRY/)
  })
  it('percent → % ekler (×100 yapmaz)', () => {
    expect(formatValue(25, { kind: 'percent', decimals: 0 })).toBe('%25')
    expect(formatValue(12.5, { kind: 'percent', decimals: 1 })).toBe('%12,5')
  })
  it('date → yerel tarih', () => {
    const s = formatValue('2024-03-15', { kind: 'date' })
    expect(s).toMatch(/15.*03.*2024|15\.03\.2024/)
  })
  it('sayı olmayan değerde number biçimi ham metne düşer', () => {
    expect(formatValue('elma', { kind: 'number', decimals: 2 })).toBe('elma')
  })
  it('boş değer boş string', () => {
    expect(formatValue(null, { kind: 'currency' })).toBe('')
  })
})

describe('matchesRule', () => {
  const rule = (op: ConditionalRule['op'], value: string): ConditionalRule => ({
    id: 'r',
    column: 'x',
    op,
    value,
    color: '#f00'
  })
  it('sayısal operatörler', () => {
    expect(matchesRule(5, rule('>', '3'))).toBe(true)
    expect(matchesRule(2, rule('>', '3'))).toBe(false)
    expect(matchesRule(0, rule('=', '0'))).toBe(true)
    expect(matchesRule(3, rule('<>', '0'))).toBe(true)
  })
  it('contains metin', () => {
    expect(matchesRule('Merkez Depo', rule('contains', 'depo'))).toBe(true)
    expect(matchesRule('Şube', rule('contains', 'depo'))).toBe(false)
  })
})

describe('cellStyle', () => {
  it('ilk eşleşen kuralın rengini uygular (text/bg)', () => {
    const rules: ConditionalRule[] = [
      { id: '1', column: 'stok', op: '<', value: '10', color: '#ff0000', mode: 'text' },
      { id: '2', column: 'stok', op: '>=', value: '10', color: '#00ff00', mode: 'bg' }
    ]
    expect(cellStyle(5, rules)).toEqual({ color: '#ff0000' })
    expect(cellStyle(20, rules)).toEqual({ backgroundColor: '#00ff00' })
    expect(cellStyle(10, rules)).toEqual({ backgroundColor: '#00ff00' })
  })
  it('eşleşme yoksa undefined', () => {
    expect(cellStyle('x', [])).toBeUndefined()
  })
})
