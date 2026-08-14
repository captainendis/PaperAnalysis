/*
 * Copyright (c) 2026 PaperAxis. All rights reserved.
 * This file is part of PaperAnalysis. Unauthorized copying, modification
 * or distribution of this file is strictly prohibited.
 */
import { describe, it, expect } from 'vitest'
import {
  resultToHtmlTable,
  tileSectionHtml,
  assembleDashboardHtml,
  escapeHtml,
  layoutStyle,
  applyTableConfig,
  configuredTableHtml
} from './publish'
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
  it('layout ile ızgara konumunu uygular', () => {
    const html = tileSectionHtml({ title: 'G', kpiText: '1', layout: { x: 2, y: 3, w: 4, h: 6 } })
    expect(html).toContain('grid-column: 3 / span 4; grid-row: 4 / span 6;')
  })
})

describe('layoutStyle', () => {
  it('x/y 1-tabanlı, w/h span olur', () => {
    expect(layoutStyle({ x: 0, y: 0, w: 6, h: 8 })).toBe(
      'grid-column: 1 / span 6; grid-row: 1 / span 8;'
    )
  })
  it('layout yoksa varsayılan span', () => {
    expect(layoutStyle(undefined)).toContain('span')
  })
  it('sonsuz y değerini 0 kabul eder', () => {
    expect(layoutStyle({ x: 1, y: Infinity, w: 3, h: 4 })).toBe(
      'grid-column: 2 / span 3; grid-row: 1 / span 4;'
    )
  })
})

describe('applyTableConfig', () => {
  const r: QueryResult = {
    columns: [{ name: 'urun' }, { name: 'depo1' }, { name: 'depo2' }],
    rows: [
      { urun: 'A', depo1: 2, depo2: 3 },
      { urun: 'B', depo1: 5, depo2: 0 }
    ],
    rowCount: 2,
    elapsedMs: 1
  }
  it('gizli sütunları çıkarır', () => {
    const { columns } = applyTableConfig(r, { hiddenColumns: ['depo2'] })
    expect(columns.map((c) => c.name)).toEqual(['urun', 'depo1'])
  })
  it('toplam sütunu ekler (satır bazında)', () => {
    const { columns, rows } = applyTableConfig(r, {
      sumColumns: [{ id: 's1', name: 'ToplamStok', cols: ['depo1', 'depo2'] }]
    })
    expect(columns.map((c) => c.name)).toContain('ToplamStok')
    expect(rows[0].ToplamStok).toBe(5)
    expect(rows[1].ToplamStok).toBe(5)
  })
  it('showTotals ile sayısal sütun toplamlarını hesaplar', () => {
    const { totals } = applyTableConfig(r, { showTotals: true })
    expect(totals).toBeDefined()
    expect(totals!.depo1).toBe(7)
    expect(totals!.depo2).toBe(3)
    expect(totals!.urun).toBeUndefined() // metin sütun toplanmaz
  })
  it('configuredTableHtml alt toplam satırını üretir', () => {
    const html = configuredTableHtml(r, { showTotals: true })
    expect(html).toContain('<tfoot>')
    expect(html).toContain('class="tot"')
  })
  it('limit=Infinity ile tüm satırları verir, kısaltma notu olmaz', () => {
    const big: QueryResult = {
      columns: [{ name: 'x' }],
      rows: Array.from({ length: 1000 }, (_, i) => ({ x: i })),
      rowCount: 1000,
      elapsedMs: 1
    }
    const html = configuredTableHtml(big, undefined, Infinity)
    expect(html).not.toContain('kısaltıldı')
    expect((html.match(/<tr>/g) || []).length).toBe(1001) // 1000 satır + 1 başlık
  })
  it('columnOrder ile sütunları yeniden sıralar', () => {
    const { columns } = applyTableConfig(r, { columnOrder: ['depo2', 'urun', 'depo1'] })
    expect(columns.map((c) => c.name)).toEqual(['depo2', 'urun', 'depo1'])
  })
  it('columnOrder eksik kimlikleri özgün sırayla sona ekler', () => {
    const { columns } = applyTableConfig(r, { columnOrder: ['depo2'] })
    expect(columns.map((c) => c.name)).toEqual(['depo2', 'urun', 'depo1'])
  })
  it('columnOrder toplam sütununu id ile konumlandırır', () => {
    const { columns } = applyTableConfig(r, {
      sumColumns: [{ id: 's1', name: 'ToplamStok', cols: ['depo1', 'depo2'] }],
      columnOrder: ['s1', 'urun']
    })
    // s1 (ToplamStok) başa gelir, sonra urun, kalanlar özgün sırayla.
    expect(columns.map((c) => c.name)).toEqual(['ToplamStok', 'urun', 'depo1', 'depo2'])
  })
})

describe('tileSectionHtml — etkileşimli tablo', () => {
  it('tablo dalında arama kutusu ve sayaç ekler', () => {
    const html = tileSectionHtml({ title: 'T', tableHtml: '<table><tbody></tbody></table>' })
    expect(html).toContain('class="tablebox"')
    expect(html).toContain('class="tbl-search"')
    expect(html).toContain('class="tbl-count"')
  })
})

describe('assembleDashboardHtml', () => {
  it('etkileşim betiğini (arama + sıralama) gömer', () => {
    const doc = assembleDashboardHtml('P', ['<section>A</section>'], 'x')
    expect(doc).toContain('<script>')
    expect(doc).toContain('.tbl-search')
    expect(doc).toContain('addEventListener')
  })
  it('tam belge ve bölümleri içerir', () => {
    const doc = assembleDashboardHtml('Panom', ['<section>A</section>'], 'Oluşturuldu')
    expect(doc.startsWith('<!doctype html>')).toBe(true)
    expect(doc).toContain('<title>Panom</title>')
    expect(doc).toContain('<section>A</section>')
    expect(doc).toContain('PaperAnalysis')
    expect(doc).not.toContain('http-equiv="refresh"')
  })

  it('alt bilgide PaperAxis künyesini ve sürümü gösterir', () => {
    const doc = assembleDashboardHtml('P', [], 'x', 0, '0.3.0')
    expect(doc).toContain('© 2026 PaperAxis · PaperAnalysis v0.3.0')
  })

  it('refreshSec verilince otomatik yenileme meta etiketi ekler', () => {
    const doc = assembleDashboardHtml('P', [], 'x', 30)
    expect(doc).toContain('<meta http-equiv="refresh" content="30" />')
  })
})
