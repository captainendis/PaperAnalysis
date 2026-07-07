import { useState } from 'react'
import type {
  Aggregation,
  ChartConfig,
  ChartType,
  ColumnFormat,
  ColumnFormatKind,
  ConditionalRule,
  QueryResult,
  TableConfig
} from '@shared/types'
import { Field, Select, TextInput } from '../common/Field'
import { resolveMeasures } from '../../lib/chartSpec'
import { suggestChart } from '../../lib/chartSuggest'
import { isNumericColumn } from '../../lib/tableView'
import { useDashboard } from '../../store/dashboard'

const CHART_TYPES: { value: ChartType; label: string }[] = [
  { value: 'bar', label: 'Sütun (Bar)' },
  { value: 'stackedBar', label: 'Yığılmış Sütun' },
  { value: 'line', label: 'Çizgi' },
  { value: 'area', label: 'Alan (Area)' },
  { value: 'scatter', label: 'Saçılım (Scatter)' },
  { value: 'pie', label: 'Pasta' },
  { value: 'kpi', label: 'KPI Kartı' },
  { value: 'table', label: 'Tablo' }
]

const AGGS: { value: Aggregation; label: string }[] = [
  { value: 'sum', label: 'Toplam (SUM)' },
  { value: 'avg', label: 'Ortalama (AVG)' },
  { value: 'count', label: 'Sayım (COUNT)' },
  { value: 'min', label: 'En Küçük (MIN)' },
  { value: 'max', label: 'En Büyük (MAX)' },
  { value: 'none', label: 'Yok (ham değer)' }
]

const FORMAT_KINDS: { value: ColumnFormatKind; label: string }[] = [
  { value: 'auto', label: 'Otomatik' },
  { value: 'number', label: 'Sayı' },
  { value: 'currency', label: 'Para' },
  { value: 'percent', label: 'Yüzde' },
  { value: 'date', label: 'Tarih' }
]
const RULE_OPS: ConditionalRule['op'][] = ['>', '<', '>=', '<=', '=', '<>', 'contains']
const CURRENCIES = ['TRY', 'USD', 'EUR', 'GBP']

interface Props {
  chart: ChartConfig
  result: QueryResult | null
  onChange: (chart: ChartConfig) => void
}

export function ChartBuilder({ chart, result, onChange }: Props) {
  const columns = result?.columns.map((c) => c.name) ?? []
  const dashboardParams = useDashboard((s) => s.dashboard.parameters) ?? []
  const set = (patch: Partial<ChartConfig>) => onChange({ ...chart, ...patch })

  // ---- Tablo ayarları (gömülü) ----
  const tc: TableConfig = chart.tableConfig ?? {}
  const setTc = (patch: Partial<TableConfig>) => set({ tableConfig: { ...tc, ...patch } })
  const hidden = new Set(tc.hiddenColumns ?? [])
  const numericCols = result
    ? columns.filter((c) => isNumericColumn(result.rows.slice(0, 200), c))
    : []
  const [sumDraft, setSumDraft] = useState<{ name: string; cols: Set<string> }>({
    name: 'Toplam',
    cols: new Set()
  })
  function toggleHidden(name: string) {
    const h = new Set(hidden)
    if (h.has(name)) h.delete(name)
    else h.add(name)
    setTc({ hiddenColumns: [...h] })
  }
  function addSumColumn() {
    const cols = [...sumDraft.cols]
    if (cols.length === 0) return
    const id = `__col${Date.now().toString(36)}`
    setTc({
      sumColumns: [
        ...(tc.sumColumns ?? []),
        { id, name: sumDraft.name.trim() || 'Toplam', cols }
      ]
    })
    setSumDraft({ name: 'Toplam', cols: new Set() })
  }

  // ---- Sütun biçimleri (sayı/para/yüzde/tarih) ----
  const colFormats = tc.columnFormats ?? {}
  function setColFormat(col: string, patch: Partial<ColumnFormat>) {
    const cur: ColumnFormat = colFormats[col] ?? { kind: 'auto' }
    setTc({ columnFormats: { ...colFormats, [col]: { ...cur, ...patch } } })
  }

  // ---- Koşullu renklendirme ----
  const [ruleDraft, setRuleDraft] = useState<Omit<ConditionalRule, 'id'>>({
    column: '',
    op: '>',
    value: '',
    color: '#ef4444',
    mode: 'text'
  })
  function addRule() {
    if (!ruleDraft.column) return
    const id = `__rule${Date.now().toString(36)}`
    setTc({ conditionalRules: [...(tc.conditionalRules ?? []), { id, ...ruleDraft }] })
    setRuleDraft({ column: '', op: '>', value: '', color: '#ef4444', mode: 'text' })
  }

  const selectedMeasures = resolveMeasures(chart)
  const supportsMulti = chart.type === 'bar' || chart.type === 'stackedBar' || chart.type === 'line' || chart.type === 'area'
  const isScatter = chart.type === 'scatter'
  const isTable = chart.type === 'table'
  const isKpi = chart.type === 'kpi'
  const isPie = chart.type === 'pie'
  const needsDimension = supportsMulti || isPie

  function toggleMeasure(name: string) {
    const cur = new Set(selectedMeasures)
    if (cur.has(name)) cur.delete(name)
    else cur.add(name)
    const arr = Array.from(cur)
    set({ measures: arr, measure: arr[0] ?? null })
  }

  const drillLevels = chart.drillLevels ?? []
  function toggleDrill(name: string) {
    const arr = drillLevels.includes(name)
      ? drillLevels.filter((d) => d !== name)
      : [...drillLevels, name] // sıra korunur
    set({ drillLevels: arr })
  }

  return (
    <div className="flex flex-col gap-5">
      <button
        className="self-start rounded-md bg-brand-500/20 px-4 py-2 text-[15px] font-medium text-brand-500 hover:bg-brand-500/30 disabled:opacity-50"
        disabled={!result}
        title="Sonuca göre otomatik grafik öner"
        onClick={() => result && onChange({ ...chart, ...suggestChart(result) })}
      >
        ✨ Otomatik grafik öner
      </button>

      <Field label="Grafik Başlığı">
        <TextInput
          value={chart.title ?? ''}
          placeholder="(opsiyonel)"
          onChange={(e) => set({ title: e.target.value })}
        />
      </Field>

      <Field label="Grafik Türü">
        <Select value={chart.type} onChange={(e) => set({ type: e.target.value as ChartType })}>
          {CHART_TYPES.map((t) => (
            <option key={t.value} value={t.value}>
              {t.label}
            </option>
          ))}
        </Select>
      </Field>

      {isTable && (
        <>
          {columns.length === 0 ? (
            <p className="text-xs text-gray-500">
              Tablo ayarlarını yapmak için önce bir sorgu çalıştırın.
            </p>
          ) : (
            <div className="flex flex-col gap-4 rounded-md border border-edge bg-surface p-3">
              <span className="text-[13px] font-semibold uppercase tracking-wide text-gray-300">
                Tablo Ayarları
              </span>

              <Field label="Grupla (tekrarlayan değerleri birleştir)">
                <Select
                  value={tc.groupBy ?? ''}
                  onChange={(e) => setTc({ groupBy: e.target.value || undefined })}
                >
                  <option value="">— gruplanmasın —</option>
                  {columns.map((c) => (
                    <option key={c} value={c}>
                      {c}
                    </option>
                  ))}
                </Select>
                <span className="mt-1 text-[11px] text-gray-500">
                  Seçilen sütunda aynı değere sahip satırlar tek satırda birleşir ve kaç
                  satırın birleştiğini gösteren bir <b>Adet</b> sütunu eklenir.
                </span>
                {tc.groupBy && (
                  <>
                    <label className="mt-2 flex items-center gap-2 text-[15px] text-gray-200">
                      <input
                        type="checkbox"
                        checked={tc.groupEnabled !== false}
                        onChange={(e) => setTc({ groupEnabled: e.target.checked })}
                      />
                      Tekrarlayan değerleri birleştir — kapalıyken satırlar ham haliyle
                      gösterilir (sütun seçili kalır)
                    </label>
                    {tc.groupEnabled !== false && (
                      <label className="mt-2 flex items-center gap-2 text-[15px] text-gray-200">
                        <input
                          type="checkbox"
                          checked={tc.groupSum !== false}
                          onChange={(e) => setTc({ groupSum: e.target.checked })}
                        />
                        Sayısal sütunları topla (SUM) — kapalıyken toplanmaz, ilk değer korunur
                      </label>
                    )}
                  </>
                )}
              </Field>

              <Field label="Görünür Sütunlar">
                <div className="flex max-h-48 flex-col gap-1 overflow-auto rounded-md border border-edge bg-base p-2">
                  {columns.map((c) => (
                    <label key={c} className="flex items-center gap-2 text-[15px] text-gray-200">
                      <input
                        type="checkbox"
                        checked={!hidden.has(c)}
                        onChange={() => toggleHidden(c)}
                      />
                      {c}
                    </label>
                  ))}
                </div>
              </Field>

              <label className="flex items-center gap-2 text-[15px] text-gray-200">
                <input
                  type="checkbox"
                  checked={!!tc.showTotals}
                  onChange={(e) => setTc({ showTotals: e.target.checked })}
                />
                Alt toplam satırı göster (sayısal sütunların toplamı)
              </label>

              <Field label="Toplam Sütunu Ekle (seçili sütunları her satırda toplar)">
                {numericCols.length === 0 ? (
                  <p className="text-xs text-gray-500">Sayısal sütun bulunamadı.</p>
                ) : (
                  <div className="flex flex-col gap-2">
                    <div className="flex max-h-40 flex-col gap-1 overflow-auto rounded-md border border-edge bg-base p-2">
                      {numericCols.map((c) => (
                        <label key={c} className="flex items-center gap-2 text-[15px] text-gray-200">
                          <input
                            type="checkbox"
                            checked={sumDraft.cols.has(c)}
                            onChange={() =>
                              setSumDraft((d) => {
                                const cols = new Set(d.cols)
                                if (cols.has(c)) cols.delete(c)
                                else cols.add(c)
                                return { ...d, cols }
                              })
                            }
                          />
                          {c}
                        </label>
                      ))}
                    </div>
                    <div className="flex items-center gap-2">
                      <TextInput
                        className="flex-1"
                        placeholder="Yeni sütun adı"
                        value={sumDraft.name}
                        onChange={(e) => setSumDraft((d) => ({ ...d, name: e.target.value }))}
                      />
                      <button
                        className="rounded-md bg-brand-500 px-3 py-1.5 text-sm font-medium text-white hover:bg-brand-600 disabled:opacity-40"
                        disabled={sumDraft.cols.size === 0}
                        onClick={addSumColumn}
                      >
                        Ekle
                      </button>
                    </div>
                  </div>
                )}
                {(tc.sumColumns?.length ?? 0) > 0 && (
                  <div className="mt-2 flex flex-col gap-1">
                    {tc.sumColumns!.map((sc) => (
                      <div
                        key={sc.id}
                        className="flex items-center justify-between gap-2 rounded bg-base px-2 py-1 text-xs text-gray-300"
                      >
                        <span className="truncate" title={sc.cols.join(' + ')}>
                          {sc.name} = {sc.cols.join(' + ')}
                        </span>
                        <button
                          className="text-gray-500 hover:text-red-400"
                          title="Kaldır"
                          onClick={() =>
                            setTc({ sumColumns: (tc.sumColumns ?? []).filter((x) => x.id !== sc.id) })
                          }
                        >
                          ✕
                        </button>
                      </div>
                    ))}
                  </div>
                )}
              </Field>
              <Field label="Sütun Biçimleri (sayı / para / yüzde / tarih)">
                <div className="flex max-h-56 flex-col gap-1.5 overflow-auto rounded-md border border-edge bg-base p-2">
                  {columns.map((c) => {
                    const f: ColumnFormat = colFormats[c] ?? { kind: 'auto' }
                    return (
                      <div key={c} className="flex items-center gap-2 text-xs">
                        <span className="w-28 shrink-0 truncate text-gray-200" title={c}>
                          {c}
                        </span>
                        <Select
                          className="flex-1"
                          value={f.kind}
                          onChange={(e) => setColFormat(c, { kind: e.target.value as ColumnFormatKind })}
                        >
                          {FORMAT_KINDS.map((k) => (
                            <option key={k.value} value={k.value}>
                              {k.label}
                            </option>
                          ))}
                        </Select>
                        {(f.kind === 'number' || f.kind === 'currency' || f.kind === 'percent') && (
                          <input
                            type="number"
                            min={0}
                            max={6}
                            title="Ondalık basamak"
                            className="w-14 rounded border border-edge bg-surface px-1.5 py-1 text-gray-100 outline-none focus:border-brand-500"
                            value={f.decimals ?? (f.kind === 'currency' ? 2 : 0)}
                            onChange={(e) => setColFormat(c, { decimals: Math.max(0, Number(e.target.value) || 0) })}
                          />
                        )}
                        {f.kind === 'currency' && (
                          <Select
                            className="w-20"
                            value={f.currency ?? 'TRY'}
                            onChange={(e) => setColFormat(c, { currency: e.target.value })}
                          >
                            {CURRENCIES.map((cur) => (
                              <option key={cur} value={cur}>
                                {cur}
                              </option>
                            ))}
                          </Select>
                        )}
                      </div>
                    )
                  })}
                </div>
              </Field>

              <Field label="Koşullu Renklendirme (kurala uyan hücreyi renklendir)">
                <div className="flex flex-col gap-2">
                  <div className="flex flex-wrap items-center gap-1">
                    <Select
                      className="min-w-[7rem] flex-1"
                      value={ruleDraft.column}
                      onChange={(e) => setRuleDraft((d) => ({ ...d, column: e.target.value }))}
                    >
                      <option value="">sütun</option>
                      {columns.map((c) => (
                        <option key={c} value={c}>
                          {c}
                        </option>
                      ))}
                    </Select>
                    <Select
                      value={ruleDraft.op}
                      onChange={(e) => setRuleDraft((d) => ({ ...d, op: e.target.value as ConditionalRule['op'] }))}
                    >
                      {RULE_OPS.map((o) => (
                        <option key={o} value={o}>
                          {o === 'contains' ? 'içerir' : o}
                        </option>
                      ))}
                    </Select>
                    <TextInput
                      className="w-20"
                      placeholder="değer"
                      value={ruleDraft.value}
                      onChange={(e) => setRuleDraft((d) => ({ ...d, value: e.target.value }))}
                    />
                    <input
                      type="color"
                      title="Renk"
                      className="h-8 w-9 cursor-pointer rounded border border-edge bg-surface"
                      value={ruleDraft.color}
                      onChange={(e) => setRuleDraft((d) => ({ ...d, color: e.target.value }))}
                    />
                    <Select
                      value={ruleDraft.mode}
                      onChange={(e) => setRuleDraft((d) => ({ ...d, mode: e.target.value as 'text' | 'bg' }))}
                    >
                      <option value="text">yazı</option>
                      <option value="bg">zemin</option>
                    </Select>
                    <button
                      className="rounded-md bg-brand-500 px-3 py-1.5 text-sm font-medium text-white hover:bg-brand-600 disabled:opacity-40"
                      disabled={!ruleDraft.column}
                      onClick={addRule}
                    >
                      Ekle
                    </button>
                  </div>
                  {(tc.conditionalRules?.length ?? 0) > 0 && (
                    <div className="flex flex-col gap-1">
                      {tc.conditionalRules!.map((r) => (
                        <div
                          key={r.id}
                          className="flex items-center justify-between gap-2 rounded bg-base px-2 py-1 text-xs text-gray-300"
                        >
                          <span className="flex items-center gap-2 truncate">
                            <span
                              className="inline-block h-3 w-3 rounded"
                              style={{ backgroundColor: r.color }}
                            />
                            {r.column} {r.op === 'contains' ? 'içerir' : r.op} {r.value}
                            <span className="text-gray-500">({r.mode === 'bg' ? 'zemin' : 'yazı'})</span>
                          </span>
                          <button
                            className="text-gray-500 hover:text-red-400"
                            title="Kaldır"
                            onClick={() =>
                              setTc({
                                conditionalRules: (tc.conditionalRules ?? []).filter((x) => x.id !== r.id)
                              })
                            }
                          >
                            ✕
                          </button>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              </Field>

              <p className="text-[11px] text-gray-500">
                Bu ayarlar grafiğe kaydedilir; panoda ve yayında bu şekilde görünür.
              </p>
            </div>
          )}
        </>
      )}

      {needsDimension && (
        <Field label="Kategori / X Ekseni">
          <Select
            value={chart.dimension ?? ''}
            onChange={(e) => set({ dimension: e.target.value || null })}
          >
            <option value="">— seçin —</option>
            {columns.map((c) => (
              <option key={c} value={c}>
                {c}
              </option>
            ))}
          </Select>
        </Field>
      )}

      {!isTable && !isScatter && (
        <Field label="Agregasyon">
          <Select
            value={chart.aggregation}
            onChange={(e) => set({ aggregation: e.target.value as Aggregation })}
          >
            {AGGS.map((a) => (
              <option key={a.value} value={a.value}>
                {a.label}
              </option>
            ))}
          </Select>
        </Field>
      )}

      {/* Saçılım: sayısal X + Y ölçüsü */}
      {isScatter && (
        <>
          <Field label="X Ekseni (sayısal)">
            <Select
              value={chart.xMeasure ?? ''}
              onChange={(e) => set({ xMeasure: e.target.value || null })}
            >
              <option value="">— seçin —</option>
              {columns.map((c) => (
                <option key={c} value={c}>
                  {c}
                </option>
              ))}
            </Select>
          </Field>
          <Field label="Y Ekseni (sayısal)">
            <Select
              value={selectedMeasures[0] ?? ''}
              onChange={(e) => set({ measure: e.target.value || null, measures: e.target.value ? [e.target.value] : [] })}
            >
              <option value="">— seçin —</option>
              {columns.map((c) => (
                <option key={c} value={c}>
                  {c}
                </option>
              ))}
            </Select>
          </Field>
        </>
      )}

      {/* KPI / Pasta: tek ölçü */}
      {(isKpi || isPie) && chart.aggregation !== 'count' && (
        <Field label="Değer / Ölçü">
          <Select
            value={selectedMeasures[0] ?? ''}
            onChange={(e) => set({ measure: e.target.value || null, measures: e.target.value ? [e.target.value] : [] })}
          >
            <option value="">— seçin —</option>
            {columns.map((c) => (
              <option key={c} value={c}>
                {c}
              </option>
            ))}
          </Select>
        </Field>
      )}

      {/* Çoklu seri grafikleri: çoklu ölçü seçimi */}
      {supportsMulti && chart.aggregation !== 'count' && (
        <Field label="Değerler / Ölçüler (çoklu seri)">
          <div className="flex max-h-56 flex-col gap-1.5 overflow-auto rounded-md border border-edge bg-surface p-2">
            {columns.length === 0 && (
              <span className="text-xs text-gray-500">Önce sorgu çalıştırın.</span>
            )}
            {columns.map((c) => (
              <label key={c} className="flex items-center gap-2 text-[15px] text-gray-200">
                <input
                  type="checkbox"
                  checked={selectedMeasures.includes(c)}
                  onChange={() => toggleMeasure(c)}
                />
                {c}
              </label>
            ))}
          </div>
        </Field>
      )}

      {/* Drill-down: sıralı boyut seviyeleri */}
      {!isTable && !isKpi && !isScatter && columns.length > 0 && (
        <Field label="Drill-Down Seviyeleri (sıralı)">
          <div className="flex max-h-56 flex-col gap-1.5 overflow-auto rounded-md border border-edge bg-surface p-2">
            {columns.map((c) => {
              const idx = drillLevels.indexOf(c)
              return (
                <label key={c} className="flex items-center gap-2 text-[15px] text-gray-200">
                  <input
                    type="checkbox"
                    checked={idx >= 0}
                    onChange={() => toggleDrill(c)}
                  />
                  {c}
                  {idx >= 0 && (
                    <span className="ml-auto rounded bg-brand-500/20 px-1.5 text-[10px] text-brand-500">
                      {idx + 1}
                    </span>
                  )}
                </label>
              )
            })}
          </div>
          <span className="mt-1 text-[11px] text-gray-500">
            2+ seviye seçilirse grafiğe tıklamak alt kırılıma iner. Sorgu tüm seçilen
            sütunları döndürmelidir.
          </span>
        </Field>
      )}

      {/* Çapraz filtre: tıklanınca bir pano parametresi ayarla */}
      {!isTable && !isKpi && !isScatter && (
        <Field label="Tıklanınca Filtrele (Çapraz Filtre)">
          {dashboardParams.length === 0 ? (
            <p className="text-xs text-gray-500">
              Önce üst çubuktaki <strong>Filtreler</strong>'den bir parametre tanımlayın;
              sonra bu grafiği ona bağlayabilirsiniz.
            </p>
          ) : (
            <Select
              value={chart.crossFilterParam ?? ''}
              onChange={(e) => set({ crossFilterParam: e.target.value || null })}
            >
              <option value="">— yok —</option>
              {dashboardParams.map((p) => (
                <option key={p.name} value={p.name}>
                  {p.label || p.name} (:{p.name})
                </option>
              ))}
            </Select>
          )}
        </Field>
      )}

      {columns.length === 0 && !isTable && (
        <p className="text-xs text-gray-500">
          Alanları seçebilmek için önce bir sorgu çalıştırın.
        </p>
      )}
    </div>
  )
}
