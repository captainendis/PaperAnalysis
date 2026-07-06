import { useState } from 'react'
import { useDashboard } from '../store/dashboard'
import { useSettings } from '../store/settings'
import { PALETTES } from '../lib/palettes'
import { Button } from './common/Button'
import { ParameterManager } from './FilterBar/ParameterManager'
import { ScheduledReportModal } from './ScheduledReport/ScheduledReportModal'

export function Toolbar() {
  const { dashboard, filePath, dirty, setName, loadDashboard, markSaved, reset } = useDashboard()
  const { theme, toggleTheme, palette, setPalette } = useSettings()
  const [busy, setBusy] = useState(false)
  const [toast, setToast] = useState<string | null>(null)
  const [filtersOpen, setFiltersOpen] = useState(false)
  const [reportOpen, setReportOpen] = useState(false)

  function flash(msg: string) {
    setToast(msg)
    setTimeout(() => setToast(null), 2500)
  }

  async function save(asNew = false) {
    setBusy(true)
    const res = await window.api.dashboard.save(dashboard, asNew ? undefined : filePath ?? undefined)
    setBusy(false)
    if (res.ok) {
      markSaved(res.data.path)
      flash('Pano kaydedildi.')
    } else if (res.error !== 'İptal edildi.') {
      flash('Hata: ' + res.error)
    }
  }

  async function open() {
    setBusy(true)
    const res = await window.api.dashboard.open()
    setBusy(false)
    if (res.ok) {
      loadDashboard(res.data.dashboard, res.data.path)
      flash('Pano açıldı.')
    } else if (res.error !== 'İptal edildi.') {
      flash('Hata: ' + res.error)
    }
  }

  function newDashboard() {
    if (dirty && !confirm('Kaydedilmemiş değişiklikler var. Yeni pano oluşturulsun mu?')) return
    reset()
  }

  async function exportPdf() {
    setBusy(true)
    const res = await window.api.dashboard.exportPdf(`${dashboard.name || 'pano'}.pdf`)
    setBusy(false)
    if (res.ok) flash('PDF kaydedildi.')
    else if (res.error !== 'İptal edildi.') flash('Hata: ' + res.error)
  }

  const paramCount = dashboard.parameters?.length ?? 0

  return (
    <header className="flex items-center gap-3 border-b border-edge bg-panel px-4 py-2">
      <div className="flex items-center gap-2">
        <span className="text-brand-500 text-lg font-bold">▦</span>
        <span className="text-sm font-semibold text-gray-200">Power BI Tarzı Analiz</span>
      </div>

      <div className="mx-2 h-5 w-px bg-edge" />

      <input
        className="w-64 rounded-md border border-transparent bg-transparent px-2 py-1 text-sm font-medium text-gray-100 outline-none hover:border-edge focus:border-brand-500"
        value={dashboard.name}
        onChange={(e) => setName(e.target.value)}
        title="Pano adı"
      />
      {dirty && <span className="text-xs text-amber-400">● kaydedilmedi</span>}

      <div className="ml-auto flex items-center gap-2">
        {toast && <span className="text-xs text-gray-400">{toast}</span>}
        <button
          className="rounded-md border border-edge px-2 py-1.5 text-sm text-gray-200 hover:bg-white/10"
          onClick={toggleTheme}
          title={theme === 'dark' ? 'Açık temaya geç' : 'Koyu temaya geç'}
        >
          {theme === 'dark' ? '☀️' : '🌙'}
        </button>
        <select
          className="rounded-md border border-edge bg-surface px-2 py-1.5 text-sm text-gray-200 outline-none hover:bg-white/5"
          value={palette}
          onChange={(e) => setPalette(e.target.value)}
          title="Grafik paleti"
        >
          {PALETTES.map((p) => (
            <option key={p.name} value={p.name}>
              🎨 {p.label}
            </option>
          ))}
        </select>
        <div className="mx-1 h-5 w-px bg-edge" />
        <Button variant="ghost" onClick={() => setFiltersOpen(true)} disabled={busy}>
          Filtreler{paramCount > 0 ? ` (${paramCount})` : ''}
        </Button>
        <Button variant="ghost" onClick={exportPdf} disabled={busy}>
          PDF
        </Button>
        <Button variant="ghost" onClick={() => setReportOpen(true)} disabled={busy}>
          Zamanla
        </Button>
        <div className="mx-1 h-5 w-px bg-edge" />
        <Button variant="ghost" onClick={newDashboard} disabled={busy}>
          Yeni
        </Button>
        <Button variant="ghost" onClick={open} disabled={busy}>
          Aç
        </Button>
        <Button variant="ghost" onClick={() => save(true)} disabled={busy}>
          Farklı Kaydet
        </Button>
        <Button variant="primary" onClick={() => save(false)} disabled={busy}>
          Kaydet
        </Button>
      </div>

      <ParameterManager open={filtersOpen} onClose={() => setFiltersOpen(false)} />
      <ScheduledReportModal open={reportOpen} onClose={() => setReportOpen(false)} />
    </header>
  )
}
