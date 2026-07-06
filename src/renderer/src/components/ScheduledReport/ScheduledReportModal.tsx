import { useEffect, useState } from 'react'
import type { ReportStatus } from '@shared/types'
import { Modal } from '../common/Modal'
import { Button } from '../common/Button'
import { Field, Select } from '../common/Field'
import { useDashboard } from '../../store/dashboard'

interface Props {
  open: boolean
  onClose: () => void
}

const INTERVALS = [
  { value: 15, label: '15 dakika' },
  { value: 60, label: '1 saat' },
  { value: 360, label: '6 saat' },
  { value: 1440, label: '24 saat' }
]

/** Panoyu belirli aralıklarla otomatik PDF olarak kaydetme ayarları. */
export function ScheduledReportModal({ open, onClose }: Props) {
  const dashboardName = useDashboard((s) => s.dashboard.name)
  const [folder, setFolder] = useState('')
  const [interval, setIntervalMin] = useState(60)
  const [status, setStatus] = useState<ReportStatus | null>(null)
  const [busy, setBusy] = useState(false)
  const [msg, setMsg] = useState<string | null>(null)

  useEffect(() => {
    if (!open) return
    window.api.report.status().then((r) => {
      if (r.ok) {
        setStatus(r.data)
        if (r.data.folder) setFolder(r.data.folder)
        if (r.data.intervalMinutes) setIntervalMin(r.data.intervalMinutes)
      }
    })
  }, [open])

  async function pickFolder() {
    const r = await window.api.report.pickFolder()
    if (r.ok) setFolder(r.data.folder)
  }

  async function start() {
    setBusy(true)
    setMsg(null)
    const r = await window.api.report.schedule(folder, interval, dashboardName)
    setBusy(false)
    if (r.ok) {
      setStatus(r.data)
      setMsg('Zamanlama başladı; ilk rapor oluşturuldu.')
    } else {
      setMsg('Hata: ' + r.error)
    }
  }

  async function stop() {
    setBusy(true)
    const r = await window.api.report.cancel()
    setBusy(false)
    if (r.ok) {
      setStatus(r.data)
      setMsg('Zamanlama durduruldu.')
    }
  }

  const active = status?.active

  return (
    <Modal
      open={open}
      title="Zamanlanmış Rapor"
      onClose={onClose}
      footer={
        active ? (
          <Button variant="danger" onClick={stop} disabled={busy}>
            Durdur
          </Button>
        ) : (
          <Button variant="primary" onClick={start} disabled={busy || !folder}>
            {busy ? 'Başlatılıyor…' : 'Başlat'}
          </Button>
        )
      }
    >
      <p className="mb-4 text-xs text-gray-400">
        Pano, seçtiğiniz klasöre belirli aralıklarla otomatik PDF olarak kaydedilir.
        Bu özellik yalnızca <strong>uygulama açıkken</strong> çalışır.
      </p>

      <div className="flex flex-col gap-4">
        <Field label="Hedef Klasör">
          <div className="flex gap-2">
            <input
              className="flex-1 rounded-md border border-edge bg-surface px-3 py-1.5 text-sm text-gray-100 outline-none"
              value={folder}
              readOnly
              placeholder="Klasör seçilmedi"
            />
            <Button variant="ghost" onClick={pickFolder}>
              Gözat…
            </Button>
          </div>
        </Field>

        <Field label="Aralık">
          <Select value={String(interval)} onChange={(e) => setIntervalMin(Number(e.target.value))}>
            {INTERVALS.map((i) => (
              <option key={i.value} value={i.value}>
                {i.label}
              </option>
            ))}
          </Select>
        </Field>

        {active && (
          <div className="rounded-md bg-green-500/15 px-3 py-2 text-sm text-green-300">
            ● Aktif — her {status?.intervalMinutes} dakikada bir.
            {status?.lastFile && (
              <div className="mt-1 truncate text-xs text-green-200/80">
                Son: {status.lastFile}
              </div>
            )}
          </div>
        )}

        {msg && <p className="text-sm text-gray-400">{msg}</p>}
      </div>
    </Modal>
  )
}
