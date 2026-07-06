import { useEffect, useState } from 'react'
import type { PublishStatus } from '@shared/types'
import { Modal } from '../common/Modal'
import { Button } from '../common/Button'
import { Field, TextInput } from '../common/Field'
import { useDashboard } from '../../store/dashboard'
import { useSettings } from '../../store/settings'
import { paramValues } from '../../lib/params'
import { buildPublishHtml } from '../../lib/publish'

interface Props {
  open: boolean
  onClose: () => void
}

/** Aktif panoyu LAN'da anlık görüntü olarak yayınlama penceresi. */
export function PublishModal({ open, onClose }: Props) {
  const dashboard = useDashboard((s) => s.dashboard)
  const parameters = useDashboard((s) => s.dashboard.parameters)
  const palette = useSettings((s) => s.palette)
  const [port, setPort] = useState(8080)
  const [status, setStatus] = useState<PublishStatus | null>(null)
  const [busy, setBusy] = useState(false)
  const [msg, setMsg] = useState<string | null>(null)

  useEffect(() => {
    if (!open) return
    window.api.publish.status().then((r) => {
      if (r.ok) {
        setStatus(r.data)
        if (r.data.port) setPort(r.data.port)
      }
    })
  }, [open])

  async function buildHtml(): Promise<string> {
    return buildPublishHtml(dashboard, paramValues(parameters), palette)
  }

  async function publish() {
    setBusy(true)
    setMsg('Pano hazırlanıyor…')
    try {
      const html = await buildHtml()
      const r = await window.api.publish.start(html, port)
      if (r.ok) {
        setStatus(r.data)
        setMsg('Yayında.')
      } else {
        setMsg('Hata: ' + r.error)
      }
    } catch (err) {
      setMsg('Hata: ' + (err as Error).message)
    }
    setBusy(false)
  }

  async function republish() {
    setBusy(true)
    setMsg('Güncelleniyor…')
    try {
      const html = await buildHtml()
      const r = await window.api.publish.republish(html)
      setMsg(r.ok ? 'Güncellendi.' : 'Hata: ' + r.error)
    } catch (err) {
      setMsg('Hata: ' + (err as Error).message)
    }
    setBusy(false)
  }

  async function stop() {
    setBusy(true)
    const r = await window.api.publish.stop()
    if (r.ok) {
      setStatus(r.data)
      setMsg('Yayın durduruldu.')
    }
    setBusy(false)
  }

  const active = status?.active
  const url = status?.url ?? ''

  return (
    <Modal
      open={open}
      title="Panoyu LAN'da Yayınla"
      onClose={onClose}
      footer={
        active ? (
          <>
            <Button variant="ghost" onClick={republish} disabled={busy}>
              Yeniden Yayınla
            </Button>
            <Button variant="danger" onClick={stop} disabled={busy}>
              Durdur
            </Button>
          </>
        ) : (
          <Button variant="primary" onClick={publish} disabled={busy}>
            {busy ? 'Hazırlanıyor…' : 'Yayınla'}
          </Button>
        )
      }
    >
      <p className="mb-4 text-sm text-gray-400">
        Panonun <strong>anlık görüntüsü</strong> aynı yerel ağdaki cihazlarda tarayıcıyla
        görüntülenebilir. Veritabanı bağlantısı paylaşılmaz; yalnızca hazır sayfa sunulur.
      </p>

      {!active ? (
        <Field label="Port">
          <TextInput
            type="number"
            value={port}
            onChange={(e) => setPort(Number(e.target.value) || 0)}
          />
        </Field>
      ) : (
        <div className="flex flex-col gap-2">
          <div className="rounded-md bg-green-500/15 px-3 py-2 text-sm text-green-300">
            ● Yayında
          </div>
          <div className="flex items-center gap-2">
            <input
              readOnly
              value={url}
              className="flex-1 rounded-md border border-edge bg-surface px-3 py-2 text-[15px] text-gray-100"
            />
            <Button variant="ghost" onClick={() => navigator.clipboard?.writeText(url)}>
              Kopyala
            </Button>
          </div>
          <p className="text-xs text-gray-500">
            Bu adresi aynı ağdaki bir cihazın tarayıcısında açın. Veriyi güncellemek için
            “Yeniden Yayınla”.
          </p>
        </div>
      )}

      {msg && <p className="mt-3 text-sm text-gray-400">{msg}</p>}

      <p className="mt-4 rounded-md bg-amber-500/10 px-3 py-2 text-xs text-amber-300/90">
        Uyarı: Kimlik doğrulama yoktur — adresi bilen aynı ağdaki herkes görebilir.
        Yalnızca güvendiğiniz yerel ağda kullanın. Windows ilk yayında güvenlik duvarı
        izni isteyebilir.
      </p>
    </Modal>
  )
}
