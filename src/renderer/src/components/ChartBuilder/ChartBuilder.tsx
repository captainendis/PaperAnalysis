import type { Aggregation, ChartConfig, ChartType, QueryResult } from '@shared/types'
import { Field, Select, TextInput } from '../common/Field'

const CHART_TYPES: { value: ChartType; label: string }[] = [
  { value: 'bar', label: 'Sütun (Bar)' },
  { value: 'line', label: 'Çizgi' },
  { value: 'pie', label: 'Pasta' }
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
  const set = (patch: Partial<ChartConfig>) => onChange({ ...chart, ...patch })

  return (
    <div className="flex flex-col gap-4">
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

      <Field label="Değer / Y Ekseni (Ölçü)">
        <Select
          value={chart.measure ?? ''}
          onChange={(e) => set({ measure: e.target.value || null })}
          disabled={chart.aggregation === 'count'}
        >
          <option value="">{chart.aggregation === 'count' ? '(sayım için gerekmez)' : '— seçin —'}</option>
          {columns.map((c) => (
            <option key={c} value={c}>
              {c}
            </option>
          ))}
        </Select>
      </Field>

      {columns.length === 0 && (
        <p className="text-xs text-gray-500">
          Alanları seçebilmek için önce bir sorgu çalıştırın.
        </p>
      )}
    </div>
  )
}
