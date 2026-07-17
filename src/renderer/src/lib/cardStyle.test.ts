import { describe, it, expect } from 'vitest'
import { cardStyleProps, cardStyleCssString } from './cardStyle'

describe('cardStyleProps', () => {
  it('boş/undefined stil boş nesne verir', () => {
    expect(cardStyleProps()).toEqual({})
    expect(cardStyleProps({})).toEqual({})
  })
  it('köşe yarıçapını px olarak verir', () => {
    expect(cardStyleProps({ radius: 12 }).borderRadius).toBe('12px')
    expect(cardStyleProps({ radius: 0 }).borderRadius).toBe('0px')
  })
  it('düz arka plan rengini uygular', () => {
    expect(cardStyleProps({ bg: 'solid', bgColor: '#fff' }).background).toBe('#fff')
  })
  it('gradient arka planı açıyla üretir', () => {
    const p = cardStyleProps({ bg: 'gradient', bgColor: '#000', bgColor2: '#fff', bgAngle: 90 })
    expect(p.background).toBe('linear-gradient(90deg, #000, #fff)')
  })
  it('gradient açısı yoksa 135 varsayar', () => {
    const p = cardStyleProps({ bg: 'gradient', bgColor: '#000', bgColor2: '#fff' })
    expect(p.background).toBe('linear-gradient(135deg, #000, #fff)')
  })
  it('eksik gradient renginde arka plan üretmez', () => {
    expect(cardStyleProps({ bg: 'gradient', bgColor: '#000' }).background).toBeUndefined()
  })
  it('kenarlık none/solid/dashed', () => {
    expect(cardStyleProps({ border: 'none' }).border).toBe('none')
    expect(cardStyleProps({ border: 'solid', borderColor: '#111', borderWidth: 2 }).border).toBe(
      '2px solid #111'
    )
    expect(cardStyleProps({ border: 'dashed', borderColor: '#111' }).border).toBe('1px dashed #111')
  })
  it('gölge yoğunluğunu boxShadow yapar', () => {
    expect(cardStyleProps({ shadow: 'none' }).boxShadow).toBe('none')
    expect(cardStyleProps({ shadow: 'lg' }).boxShadow).toContain('rgba')
  })
})

describe('cardStyleCssString', () => {
  it('camelCase anahtarları kebab-case CSS dizesine çevirir', () => {
    const css = cardStyleCssString({ radius: 8, shadow: 'sm' })
    expect(css).toContain('border-radius: 8px')
    expect(css).toContain('box-shadow:')
  })
  it('boş stilde boş dize', () => {
    expect(cardStyleCssString()).toBe('')
  })
})
