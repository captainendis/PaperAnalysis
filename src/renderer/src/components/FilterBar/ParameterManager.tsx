import { useState } from 'react'
import type { DashboardParameter, ParamType } from '@shared/types'
import { Modal } from '../common/Modal'
import { Button } from '../common/Button'
import { Select, TextInput } from '../common/Field'
import { useDashboard } from '../../store/dashboard'

interface Props {
  open: boolean
  onClose: () => void
}

const TYPES: ParamType[] = ['text', 'number', 'date']

/** Pano parametrelerini (filtreleri) ve otomatik yenilemeyi yönetir. */
export function ParameterManager({ open, onClose }: Props) {
  const { dashboard, setParameters, setRefreshInterval } = useDashboard()
  const [list, setList] = useState<DashboardParameter[]>(dashboard.parameters ?? [])
  const [refresh, setRefresh] = useState<number>(dashboard.refreshIntervalSec ?? 0)

  function add() {
    setList((l) => [
      ...l,
      { name: `param${l.length + 1}`, label: '', type: 'text', value: '' }
    ])
  }

  function update(i: number, patch: Partial<DashboardParameter>) {
    setList((l) => l.map((p, idx) => (idx === i ? { ...p, ...patch } : p)))
  }

  function remove(i: number) {
    setList((l) => l.filter((_, idx) => idx !== i))
  }

  function save() {
    // Geçerli parametre adlarını normalize et (boşlukları kaldır).
    const cleaned = list
      .map((p) => ({ ...p, name: p.name.trim().replace(/[^a-zA-Z0-9_]/g, '_') }))
      .filter((p) => p.name)
    setParameters(cleaned)
    setRefreshInterval(refresh)
    onClose()
  }

  return (
    <Modal
      open={open}
      title="Filtreler ve Yenileme"
      onClose={onClose}
      footer={
        <>
          <Button variant="ghost" onClick={onClose}>
            İptal
          </Button>
          <Button variant="primary" onClick={save}>
            Kaydet
          </Button>
        </>
      }
    >
      <p className="mb-3 text-xs text-gray-400">
        Parametreleri SQL sorgularınızda <code className="text-brand-500">:ad</code> şeklinde
        kullanın. Örn: <code>WHERE kategori = :kategori</code>. Değerler güvenli şekilde
        (parametre bağlama ile) geçirilir.
      </p>

      <div className="flex flex-col gap-2">
        {list.length === 0 && (
          <p className="text-sm text-gray-500">Henüz parametre yok.</p>
        )}
        {list.map((p, i) => (
          <div key={i} className="flex items-center gap-2">
            <TextInput
              className="w-32"
              placeholder="ad"
              value={p.name}
              onChange={(e) => update(i, { name: e.target.value })}
            />
            <TextInput
              className="flex-1"
              placeholder="etiket"
              value={p.label}
              onChange={(e) => update(i, { label: e.target.value })}
            />
            <Select value={p.type} onChange={(e) => update(i, { type: e.target.value as ParamType })}>
              {TYPES.map((t) => (
                <option key={t} value={t}>
                  {t}
                </option>
              ))}
            </Select>
            <TextInput
              className="w-28"
              placeholder="varsayılan"
              value={p.value}
              onChange={(e) => update(i, { value: e.target.value })}
            />
            <button
              className="px-1 text-gray-400 hover:text-red-400"
              onClick={() => remove(i)}
              title="Sil"
            >
              ✕
            </button>
          </div>
        ))}
      </div>

      <Button variant="subtle" className="mt-3" onClick={add}>
        + Parametre Ekle
      </Button>

      <div className="mt-5 flex items-center gap-2 border-t border-edge pt-4">
        <span className="text-sm text-gray-300">Otomatik yenileme</span>
        <Select value={String(refresh)} onChange={(e) => setRefresh(Number(e.target.value))}>
          <option value="0">Kapalı</option>
          <option value="10">10 sn</option>
          <option value="30">30 sn</option>
          <option value="60">1 dk</option>
          <option value="300">5 dk</option>
        </Select>
      </div>
    </Modal>
  )
}
