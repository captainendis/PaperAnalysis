import * as echarts from 'echarts'
import type { Dashboard, DashboardTile, QueryResult, TableConfig } from '@shared/types'
import { buildEChartsOption, computeKpi } from './chartSpec'
import { chartTheme } from './chartTheme'
import { groupResult, isNumericColumn, sumValues } from './tableView'
import { cellStyle, formatValue, rulesByColumn } from './tableFormat'
import { cardStyleCssString } from './cardStyle'

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

function pubNumber(n: number): string {
  if (!Number.isFinite(n)) return '—'
  return new Intl.NumberFormat('tr-TR', { maximumFractionDigits: 2 }).format(n)
}

/** Tablo ayarlarını (gizli sütun, toplam sütunu) uygulayarak sütun/satır üretir. */
export function applyTableConfig(
  result: QueryResult,
  config?: TableConfig
): { columns: { name: string }[]; rows: Record<string, unknown>[]; totals?: Record<string, number> } {
  const hidden = new Set(config?.hiddenColumns ?? [])
  const baseCols = result.columns.filter((c) => !hidden.has(c.name))
  const sumCols = config?.sumColumns ?? []
  // Sütun kimliği→görünen ad eşlemesi (temel: id=ad; toplam: id=sum.id, ad=sum.name).
  const entries = [
    ...baseCols.map((c) => ({ id: c.name, name: c.name })),
    ...sumCols.map((s) => ({ id: s.id, name: s.name }))
  ]
  const order = config?.columnOrder
  if (order && order.length > 0) {
    const rank = new Map(order.map((id, i) => [id, i]))
    // Sırada olanlar önce (verilen sırayla), olmayanlar özgün sıralarında sonda.
    entries.sort((a, b) => (rank.get(a.id) ?? Infinity) - (rank.get(b.id) ?? Infinity))
  }
  const columns = entries.map((e) => ({ name: e.name }))
  const rows = result.rows.map((r) => {
    const o: Record<string, unknown> = {}
    for (const c of baseCols) o[c.name] = r[c.name]
    for (const s of sumCols) o[s.name] = sumValues(s.cols.map((cc) => r[cc]))
    return o
  })
  let totals: Record<string, number> | undefined
  if (config?.showTotals) {
    totals = {}
    const sample = rows.slice(0, 200)
    for (const c of columns) {
      const isSum = sumCols.some((s) => s.name === c.name)
      if (isSum || isNumericColumn(sample, c.name)) {
        totals[c.name] = sumValues(rows.map((r) => r[c.name]))
      }
    }
  }
  return { columns, rows, totals }
}

/** Tablo ayarlarını uygulayarak (gizli sütun, toplam sütunu, alt toplam) HTML tablo üretir. */
export function configuredTableHtml(
  result: QueryResult,
  config?: TableConfig,
  limit = 200
): string {
  const { columns, rows, totals } = applyTableConfig(result, config)
  const condByCol = rulesByColumn(config?.conditionalRules)
  const headers = columns.map((c) => `<th>${escapeHtml(c.name)}</th>`).join('')
  const body = rows
    .slice(0, limit)
    .map(
      (r) =>
        `<tr>${columns
          .map((c) => {
            const v = r[c.name]
            const text = escapeHtml(formatValue(v, config?.columnFormats?.[c.name]))
            const st = condByCol[c.name] ? cellStyle(v, condByCol[c.name]) : undefined
            const style = st
              ? ` style="${st.color ? `color:${st.color}` : `background:${st.backgroundColor}`}"`
              : ''
            return `<td${style}>${text}</td>`
          })
          .join('')}</tr>`
    )
    .join('')
  const foot = totals
    ? `<tfoot><tr>${columns
        .map((c, i) =>
          c.name in totals!
            ? `<td class="tot">${escapeHtml(pubNumber(totals![c.name]))}</td>`
            : `<td class="tot">${i === 0 ? 'Toplam' : ''}</td>`
        )
        .join('')}</tr></tfoot>`
    : ''
  const more =
    rows.length > limit
      ? `<div class="note">… ${rows.length - limit} satır daha (kısaltıldı)</div>`
      : ''
  return `<table><thead><tr>${headers}</tr></thead><tbody>${body}</tbody>${foot}</table>${more}`
}

export interface TileLayout {
  x: number
  y: number
  w: number
  h: number
}

export interface TileSection {
  title: string
  imgDataUrl?: string
  kpiText?: string
  tableHtml?: string
  error?: string
  /** Pano ızgarasındaki konum/boyut — yayında panonun görünümünü birebir yansıtır. */
  layout?: TileLayout
  /** Karta özel görsel stil (köşe/arka plan/kenarlık/gölge) — satır içi CSS. */
  cardCss?: string
}

/** Tile'ın 12 sütunlu ızgaradaki yerleşim CSS'ini üretir (react-grid-layout ile aynı). */
export function layoutStyle(layout?: TileLayout): string {
  if (!layout) return 'grid-column: span 4; grid-row: span 6;'
  const x = Math.max(0, Math.floor(layout.x))
  const y = Number.isFinite(layout.y) ? Math.max(0, Math.floor(layout.y)) : 0
  const w = Math.max(1, Math.floor(layout.w))
  const h = Math.max(1, Math.floor(layout.h))
  return `grid-column: ${x + 1} / span ${w}; grid-row: ${y + 1} / span ${h};`
}

/** Tek bir pano kartının HTML'ini üretir. */
export function tileSectionHtml(s: TileSection): string {
  let body: string
  if (s.error) body = `<div class="err">${escapeHtml(s.error)}</div>`
  else if (s.kpiText !== undefined) body = `<div class="kpi">${escapeHtml(s.kpiText)}</div>`
  else if (s.tableHtml !== undefined)
    // Etkileşimli tablo: arama kutusu + satır sayacı; başlığa tıklayınca sıralama (JS).
    body =
      `<div class="tablebox">` +
      `<div class="tbar"><input class="tbl-search" type="search" placeholder="Tabloda ara…" aria-label="Tabloda ara" />` +
      `<span class="tbl-count"></span></div>` +
      `<div class="tablewrap">${s.tableHtml}</div>` +
      `</div>`
  else if (s.imgDataUrl) body = `<img src="${s.imgDataUrl}" alt="${escapeHtml(s.title)}" />`
  else body = '<div class="note">—</div>'
  const style = s.cardCss ? `${layoutStyle(s.layout)} ${s.cardCss}` : layoutStyle(s.layout)
  return `<section class="card" style="${style}"><h2>${escapeHtml(s.title || 'İsimsiz')}</h2><div class="body">${body}</div></section>`
}

/**
 * Yayınlanan sayfaya gömülen etkileşim betiği: her tabloda canlı arama (satırları
 * süzer) ve başlığa tıklayarak sıralama (sayı-duyarlı, tr yerelleştirmeli). Dış
 * kaynak kullanmaz; snapshot verisi zaten HTML'de olduğundan sunucuya istek atmaz.
 */
const TABLE_SCRIPT = `<script>
(function(){
  function norm(s){ return (s||'').toLocaleLowerCase('tr'); }
  function toNum(s){
    var t = (s||'').trim().replace(/\\./g,'').replace(',', '.');
    if(t==='' ) return null;
    var n = parseFloat(t);
    return isNaN(n) ? null : n;
  }
  // Canlı arama
  document.querySelectorAll('.tablebox').forEach(function(box){
    var inp = box.querySelector('.tbl-search');
    var table = box.querySelector('table');
    var countEl = box.querySelector('.tbl-count');
    if(!inp || !table || !table.tBodies[0]) return;
    var tbody = table.tBodies[0];
    function apply(){
      var q = norm(inp.value.trim());
      var shown = 0, total = 0;
      Array.prototype.forEach.call(tbody.rows, function(tr){
        total++;
        var match = q === '' || norm(tr.textContent).indexOf(q) !== -1;
        tr.style.display = match ? '' : 'none';
        if(match) shown++;
      });
      if(countEl) countEl.textContent = q ? (shown + ' / ' + total + ' satır') : (total + ' satır');
    }
    inp.addEventListener('input', apply);
    apply();
  });
  // Başlığa tıklayınca sıralama
  document.querySelectorAll('.tablebox table').forEach(function(table){
    var tbody = table.tBodies[0];
    if(!tbody) return;
    var ths = table.tHead ? table.tHead.rows[0].cells : [];
    Array.prototype.forEach.call(ths, function(th){
      var ind = document.createElement('span');
      ind.className = 'sort-ind';
      ind.textContent = '\\u2195';
      th.appendChild(ind);
      var dir = 0;
      th.addEventListener('click', function(){
        var col = th.cellIndex;
        dir = dir === 1 ? -1 : 1;
        Array.prototype.forEach.call(ths, function(o){
          var i = o.querySelector('.sort-ind'); if(i) i.textContent = '\\u2195';
        });
        ind.textContent = dir === 1 ? '\\u25B2' : '\\u25BC';
        var rows = Array.prototype.slice.call(tbody.rows);
        rows.sort(function(a,b){
          var x = a.cells[col] ? a.cells[col].textContent : '';
          var y = b.cells[col] ? b.cells[col].textContent : '';
          var nx = toNum(x), ny = toNum(y);
          if(nx !== null && ny !== null) return (nx - ny) * dir;
          return x.trim().localeCompare(y.trim(), 'tr', { numeric: true }) * dir;
        });
        rows.forEach(function(r){ tbody.appendChild(r); });
      });
    });
  });
})();
</script>`

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
  /* Pano ile aynı 12 sütunlu ızgara; kartlar kayıtlı konum/boyutlarında yerleşir. */
  main { display: grid; grid-template-columns: repeat(12, 1fr); grid-auto-rows: 36px;
    gap: 12px; padding: 16px 24px; align-items: stretch; }
  .card { display: flex; flex-direction: column; background: #fff; border: 1px solid #e5e7eb;
    border-radius: 10px; padding: 12px; overflow: hidden; min-height: 0; min-width: 0; }
  .card h2 { margin: 0 0 8px; font-size: 14px; color: #374151; flex: 0 0 auto; }
  .card .body { flex: 1 1 auto; min-height: 0; display: flex; }
  .card img { width: 100%; height: 100%; object-fit: contain; display: block; margin: auto; }
  .kpi { font-size: 40px; font-weight: 700; text-align: center; margin: auto; }
  /* Etkileşimli tablo: arama çubuğu üstte, tablo altta kaydırılabilir. */
  .tablebox { display: flex; flex-direction: column; flex: 1 1 auto; min-height: 0; width: 100%; }
  .tbar { display: flex; align-items: center; gap: 8px; margin-bottom: 6px; flex: 0 0 auto; }
  .tbl-search { flex: 0 1 240px; padding: 4px 8px; border: 1px solid #d1d5db;
    border-radius: 6px; font-size: 13px; outline: none; }
  .tbl-search:focus { border-color: #6366f1; }
  .tbl-count { color: #9ca3af; font-size: 12px; }
  .tablewrap { flex: 1 1 auto; overflow: auto; width: 100%; }
  table { border-collapse: collapse; width: 100%; font-size: 13px; }
  th, td { border-bottom: 1px solid #eee; padding: 6px 8px; text-align: left; white-space: nowrap; }
  th { background: #fafafa; position: sticky; top: 0; cursor: pointer; user-select: none; }
  th .sort-ind { color: #c4c4c4; font-size: 10px; margin-left: 4px; }
  tfoot .tot { font-weight: 700; border-top: 2px solid #e5e7eb; background: #fafafa;
    position: sticky; bottom: 0; }
  .err { color: #b91c1c; font-size: 13px; margin: auto 0; }
  .note { color: #9ca3af; font-size: 12px; margin: auto 0; }
  footer { padding: 12px 24px; color: #9ca3af; font-size: 12px; }
  /* Dar ekranlarda ızgarayı tek sütuna indir (okunabilirlik). */
  @media (max-width: 820px) {
    main { display: block; padding: 16px; }
    .card { height: auto !important; margin-bottom: 12px; }
    .card .body { min-height: 220px; }
  }
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
<footer>Anlık görüntü — yayınlandığı andaki veriyi gösterir. Tablolarda arama yapıp başlığa tıklayarak sıralayabilirsiniz.</footer>
${TABLE_SCRIPT}
</body>
</html>`
}

// ---------- Orchestration (impür: sorgu çalıştırır, offscreen grafik çizer) ----------

function formatNumber(n: number): string {
  if (!Number.isFinite(n)) return '—'
  return new Intl.NumberFormat('tr-TR', { maximumFractionDigits: 2 }).format(n)
}

/** Bir tile'ın grafiğini offscreen ECharts ile PNG data URL'ine çevirir.
 * Boyut, tile'ın ızgaradaki en/boy oranına göre ayarlanır (görünüme sadık kalmak için). */
function renderChartPng(result: QueryResult, tile: DashboardTile, paletteName: string): string {
  const w = Math.max(360, Math.round((tile.layout?.w ?? 6) * 110))
  const h = Math.max(200, Math.round((tile.layout?.h ?? 8) * 40))
  const div = document.createElement('div')
  const inst = echarts.init(div, undefined, { renderer: 'canvas', width: w, height: h })
  try {
    // Grafiğe özel palet varsa onu kullan (yayın okunabilirliği için tema hep açık).
    const pal = tile.chart.palette ?? paletteName
    inst.setOption(buildEChartsOption(result, tile.chart, chartTheme('light', pal)))
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
    const layout = tile.layout
    const cardCss = cardStyleCssString(tile.chart.cardStyle)
    if (!tile.connectionId || !tile.sql.trim()) {
      sections.push(
        tileSectionHtml({ title, layout, cardCss, error: 'Bağlantı veya sorgu tanımlı değil.' })
      )
      continue
    }
    const res = await window.api.query.run(tile.connectionId, tile.sql, params)
    if (!res.ok) {
      sections.push(tileSectionHtml({ title, layout, cardCss, error: res.error }))
      continue
    }
    const result = res.data
    try {
      if (tile.chart.type === 'table') {
        const gb = tile.chart.tableConfig?.groupBy
        const groupKeys = gb ? [gb, ...(tile.chart.tableConfig?.groupByExtra ?? [])] : []
        const tableResult =
          gb && tile.chart.tableConfig?.groupEnabled !== false
            ? groupResult(
                result,
                groupKeys,
                tile.chart.tableConfig?.groupSum !== false,
                tile.chart.tableConfig?.groupSumExclude,
                tile.chart.tableConfig?.groupConcat
              )
            : result
        sections.push(
          tileSectionHtml({
            title,
            layout,
            cardCss,
            // Yayında satır limiti yok: tüm satırlar gömülür ki etkileşimli
            // arama/sıralama veri setinin tamamında çalışsın (snapshot; sunucuya
            // sorgu atılmaz).
            tableHtml: configuredTableHtml(tableResult, tile.chart.tableConfig, Infinity)
          })
        )
      } else if (tile.chart.type === 'kpi') {
        sections.push(
          tileSectionHtml({
            title,
            layout,
            cardCss,
            kpiText: formatNumber(computeKpi(result, tile.chart))
          })
        )
      } else {
        sections.push(
          tileSectionHtml({
            title,
            layout,
            cardCss,
            imgDataUrl: renderChartPng(result, tile, paletteName)
          })
        )
      }
    } catch (err) {
      sections.push(tileSectionHtml({ title, layout, cardCss, error: (err as Error).message }))
    }
  }

  if (sections.length === 0) {
    sections.push(tileSectionHtml({ title: 'Boş pano', error: 'Bu panoda grafik yok.' }))
  }

  const note =
    refreshSec > 0 ? `Her ${refreshSec} sn'de yenilenir` : 'Anlık görüntü'
  return assembleDashboardHtml(dashboard.name, sections, note, refreshSec)
}
