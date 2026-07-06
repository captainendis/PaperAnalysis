import type { Aggregation, ChartConfig, ChartType, QueryResult } from '@shared/types'
import { Field, Select, TextInput } from '../common/Field'
import { resolveMeasures } from '../../lib/chartSpec'
import { suggestChart } from '../../lib/chartSuggest'
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

interface Props {
  chart: ChartConfig
  result: QueryResult | null
  onChange: (chart: ChartConfig) => void
}

export function ChartBuilder({ chart, result, onChange }: Props) {
  const columns = result?.columns.map((c) => c.name) ?? []
  const dashboardParams = useDashboard((s) => s.dashboard.parameters) ?? []
  const set = (patch: Partial<ChartConfig>) => onChange({ ...chart, ...patch })

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
        <p className="text-xs text-gray-500">
          Tablo görseli ham sorgu sonucunu gösterir; alan seçimi gerekmez.
        </p>
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
