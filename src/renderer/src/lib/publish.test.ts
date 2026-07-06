import { describe, it, expect } from 'vitest'
import { resultToHtmlTable, tileSectionHtml, assembleDashboardHtml, escapeHtml } from './publish'
import type { QueryResult } from '@shared/types'

const result: QueryResult = {
  columns: [{ name: 'ad' }, { name: 'tutar' }],
  rows: [
    { ad: 'Ali', tutar: 10 },
    { ad: '<b>Veli</b>', tutar: null }
  ],
  rowCount: 2,
  elapsedMs: 1
}

describe('escapeHtml', () => {
  it('tehlikeli karakterleri kaçırır', () => {
    expect(escapeHtml('<a>&"')).toBe('&lt;a&gt;&amp;&quot;')
  })
})

describe('resultToHtmlTable', () => {
  it('başlık ve satırları kaçışlı üretir', () => {
    const html = resultToHtmlTable(result)
    expect(html).toContain('<th>ad</th>')
    expect(html).toContain('<td>Ali</td>')
    expect(html).toContain('&lt;b&gt;Veli&lt;/b&gt;') // kaçışlı
    expect(html).toContain('<td></td>') // null → boş
  })

  it('limit aşılınca kısaltma notu ekler', () => {
    const big: QueryResult = {
      columns: [{ name: 'x' }],
      rows: Array.from({ length: 5 }, (_, i) => ({ x: i })),
      rowCount: 5,
      elapsedMs: 1
    }
    expect(resultToHtmlTable(big, 2)).toContain('satır daha')
  })
})

describe('tileSectionHtml', () => {
  it('kpi dalı', () => {
    expect(tileSectionHtml({ title: 'Ciro', kpiText: '1.000' })).toContain('class="kpi">1.000')
  })
  it('görsel dalı', () => {
    expect(tileSectionHtml({ title: 'G', imgDataUrl: 'data:image/png;base64,AAA' })).toContain(
      '<img src="data:image/png;base64,AAA"'
    )
  })
  it('hata dalı', () => {
    expect(tileSectionHtml({ title: 'X', error: 'oops' })).toContain('class="err">oops')
  })
})

describe('assembleDashboardHtml', () => {
  it('tam belge ve bölümleri içerir', () => {
    const doc = assembleDashboardHtml('Panom', ['<section>A</section>'], 'Oluşturuldu')
    expect(doc.startsWith('<!doctype html>')).toBe(true)
    expect(doc).toContain('<title>Panom</title>')
    expect(doc).toContain('<section>A</section>')
    expect(doc).toContain('PaperAnalysis')
    expect(doc).not.toContain('http-equiv="refresh"')
  })

  it('refreshSec verilince otomatik yenileme meta etiketi ekler', () => {
    const doc = assembleDashboardHtml('P', [], 'x', 30)
    expect(doc).toContain('<meta http-equiv="refresh" content="30" />')
  })
})
