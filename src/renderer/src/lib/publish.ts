import * as echarts from 'echarts'
import type { Dashboard, DashboardTile, QueryResult } from '@shared/types'
import { buildEChartsOption, computeKpi } from './chartSpec'
import { chartTheme } from './chartTheme'

// ---------- Saf yardımcılar (test edilir) ----------

export function escapeHtml(s: string): string {
  return s
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
}

function cell(v: unknown): string {
  if (v === null || v === undefined) return ''
  if (typeof v === 'object') return JSON.stringify(v)
  return String(v)
}

/** Sorgu sonucundan basit, kaçışlı bir HTML tablo üretir. */
export function resultToHtmlTable(result: QueryResult, limit = 200): string {
  const headers = result.columns.map((c) => `<th>${escapeHtml(c.name)}</th>`).join('')
  const rows = result.rows
    .slice(0, limit)
    .map(
      (r) =>
        `<tr>${result.columns
          .map((c) => `<td>${escapeHtml(cell(r[c.name]))}</td>`)
          .join('')}</tr>`
    )
    .join('')
  const more =
    result.rows.length > limit
      ? `<div class="note">… ${result.rows.length - limit} satır daha (kısaltıldı)</div>`
      : ''
  return `<table><thead><tr>${headers}</tr></thead><tbody>${rows}</tbody></table>${more}`
}

export interface TileSection {
  title: string
  imgDataUrl?: string
  kpiText?: string
  tableHtml?: string
  error?: string
}

/** Tek bir pano kartının HTML'ini üretir. */
export function tileSectionHtml(s: TileSection): string {
  let body: string
  if (s.error) body = `<div class="err">${escapeHtml(s.error)}</div>`
  else if (s.kpiText !== undefined) body = `<div class="kpi">${escapeHtml(s.kpiText)}</div>`
  else if (s.tableHtml !== undefined) body = `<div class="tablewrap">${s.tableHtml}</div>`
  else if (s.imgDataUrl) body = `<img src="${s.imgDataUrl}" alt="${escapeHtml(s.title)}" />`
  else body = '<div class="note">—</div>'
  return `<section class="card"><h2>${escapeHtml(s.title || 'İsimsiz')}</h2>${body}</section>`
}

/** Bölümlerden tam, kendi kendine yeten HTML belgesi oluşturur (dış kaynak yok). */
export function assembleDashboardHtml(
  name: string,
  sections: string[],
  generatedAtText: string,
  refreshSec = 0
): string {
  const refreshMeta =
    refreshSec > 0 ? `\n<meta http-equiv="refresh" content="${Math.round(refreshSec)}" />` : ''
  return `<!doctype html>
<html lang="tr">
<head>
<meta charset="utf-8" />
<meta name="viewport" content="width=device-width, initial-scale=1" />${refreshMeta}
<title>${escapeHtml(name || 'Pano')}</title>
<style>
  * { box-sizing: border-box; }
  body { margin: 0; font-family: 'Segoe UI', system-ui, -apple-system, sans-serif;
    background: #f4f5f7; color: #1f2430; }
  header { padding: 16px 24px; background: #fff; border-bottom: 1px solid #e1e0d9;
    display: flex; justify-content: space-between; align-items: baseline; flex-wrap: wrap; gap: 8px; }
  header h1 { margin: 0; font-size: 18px; }
  header .meta { color: #6b7280; font-size: 12px; }
  main { display: grid; grid-template-columns: repeat(auto-fill, minmax(360px, 1fr));
    gap: 16px; padding: 16px 24px; }
  .card { background: #fff; border: 1px solid #e5e7eb; border-radius: 10px; padding: 12px; overflow: hidden; }
  .card h2 { margin: 0 0 8px; font-size: 14px; color: #374151; }
  .card img { width: 100%; height: auto; display: block; }
  .kpi { font-size: 40px; font-weight: 700; text-align: center; padding: 24px 0; }
  .tablewrap { overflow: auto; max-height: 360px; }
  table { border-collapse: collapse; width: 100%; font-size: 13px; }
  th, td { border-bottom: 1px solid #eee; padding: 6px 8px; text-align: left; white-space: nowrap; }
  th { background: #fafafa; position: sticky; top: 0; }
  .err { color: #b91c1c; font-size: 13px; }
  .note { color: #9ca3af; font-size: 12px; }
  footer { padding: 12px 24px; color: #9ca3af; font-size: 12px; }
</style>
</head>
<body>
<header>
  <h1>${escapeHtml(name || 'Pano')}</h1>
  <span class="meta">${escapeHtml(generatedAtText)} · PaperAnalysis</span>
</header>
<main>
${sections.join('\n')}
</main>
<footer>Anlık görüntü — yayınlandığı andaki veriyi gösterir.</footer>
</body>
</html>`
}

// ---------- Orchestration (impür: sorgu çalıştırır, offscreen grafik çizer) ----------

function formatNumber(n: number): string {
  if (!Number.isFinite(n)) return '—'
  return new Intl.NumberFormat('tr-TR', { maximumFractionDigits: 2 }).format(n)
}

/** Bir tile'ın grafiğini offscreen ECharts ile PNG data URL'ine çevirir. */
function renderChartPng(result: QueryResult, tile: DashboardTile, paletteName: string): string {
  const div = document.createElement('div')
  const inst = echarts.init(div, undefined, { renderer: 'canvas', width: 640, height: 360 })
  try {
    inst.setOption(buildEChartsOption(result, tile.chart, chartTheme('light', paletteName)))
    return inst.getDataURL({ type: 'png', pixelRatio: 2, backgroundColor: '#ffffff' })
  } finally {
    inst.dispose()
  }
}

/**
 * Aktif panoyu, her tile'ın verisini çekip kendi kendine yeten HTML'e dönüştürür.
 */
export async function buildPublishHtml(
  dashboard: Dashboard,
  params: Record<string, unknown>,
  paletteName: string,
  refreshSec = 0
): Promise<string> {
  const sections: string[] = []

  for (const tile of dashboard.tiles) {
    const title = tile.title || 'İsimsiz'
    if (!tile.connectionId || !tile.sql.trim()) {
      sections.push(tileSectionHtml({ title, error: 'Bağlantı veya sorgu tanımlı değil.' }))
      continue
    }
    const res = await window.api.query.run(tile.connectionId, tile.sql, params)
    if (!res.ok) {
      sections.push(tileSectionHtml({ title, error: res.error }))
      continue
    }
    const result = res.data
    try {
      if (tile.chart.type === 'table') {
        sections.push(tileSectionHtml({ title, tableHtml: resultToHtmlTable(result) }))
      } else if (tile.chart.type === 'kpi') {
        sections.push(tileSectionHtml({ title, kpiText: formatNumber(computeKpi(result, tile.chart)) }))
      } else {
        sections.push(tileSectionHtml({ title, imgDataUrl: renderChartPng(result, tile, paletteName) }))
      }
    } catch (err) {
      sections.push(tileSectionHtml({ title, error: (err as Error).message }))
    }
  }

  if (sections.length === 0) {
    sections.push(tileSectionHtml({ title: 'Boş pano', error: 'Bu panoda grafik yok.' }))
  }

  const note =
    refreshSec > 0 ? `Her ${refreshSec} sn'de yenilenir` : 'Anlık görüntü'
  return assembleDashboardHtml(dashboard.name, sections, note, refreshSec)
}
