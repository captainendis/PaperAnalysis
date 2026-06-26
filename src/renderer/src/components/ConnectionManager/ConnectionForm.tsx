import { useState } from 'react'
import type { ConnectionConfig, DbKind, SafeConnection } from '@shared/types'
import { DEFAULT_PORTS } from '@shared/types'
import { Modal } from '../common/Modal'
import { Button } from '../common/Button'
import { Field, TextInput, Select } from '../common/Field'
import { uid } from '../../lib/serialize'
import { useConnections } from '../../store/connections'

const KIND_LABELS: Record<DbKind, string> = {
  mssql: 'Microsoft SQL Server',
  postgres: 'PostgreSQL',
  mysql: 'MySQL / MariaDB',
  sqlite: 'SQLite'
}

interface Props {
  open: boolean
  /** Düzenlenecek mevcut bağlantı (yoksa yeni). */
  initial?: SafeConnection
  onClose: () => void
}

export function ConnectionForm({ open, initial, onClose }: Props) {
  const save = useConnections((s) => s.save)
  const [form, setForm] = useState<ConnectionConfig>(() => seed(initial))
  const [testState, setTestState] = useState<'idle' | 'testing' | 'ok' | 'err'>('idle')
  const [testMsg, setTestMsg] = useState('')
  const [saving, setSaving] = useState(false)

  function seedReset() {
    setForm(seed(initial))
    setTestState('idle')
    setTestMsg('')
  }

  const set = (patch: Partial<ConnectionConfig>) => setForm((f) => ({ ...f, ...patch }))

  const onKindChange = (kind: DbKind) =>
    set({ kind, port: DEFAULT_PORTS[kind] })

  async function handleTest() {
    setTestState('testing')
    setTestMsg('')
    const res = await window.api.connection.test(form)
    if (res.ok) {
      setTestState('ok')
      setTestMsg('Bağlantı başarılı.')
    } else {
      setTestState('err')
      setTestMsg(res.error)
    }
  }

  async function handleSave() {
    setSaving(true)
    const ok = await save(form)
    setSaving(false)
    if (ok) {
      onClose()
      seedReset()
    }
  }

  const isSqlite = form.kind === 'sqlite'
  const canSave = form.name.trim() && (isSqlite ? form.filePath : form.host)

  return (
    <Modal
      open={open}
      title={initial ? 'Bağlantıyı Düzenle' : 'Yeni Bağlantı'}
      onClose={onClose}
      footer={
        <>
          <Button variant="ghost" onClick={handleTest} disabled={testState === 'testing'}>
            {testState === 'testing' ? 'Test ediliyor…' : 'Bağlantıyı Test Et'}
          </Button>
          <Button variant="primary" onClick={handleSave} disabled={!canSave || saving}>
            {saving ? 'Kaydediliyor…' : 'Kaydet'}
          </Button>
        </>
      }
    >
      <div className="grid grid-cols-2 gap-4">
        <Field label="Bağlantı Adı">
          <TextInput
            value={form.name}
            placeholder="Örn. Üretim Veritabanı"
            onChange={(e) => set({ name: e.target.value })}
          />
        </Field>
        <Field label="Veritabanı Türü">
          <Select value={form.kind} onChange={(e) => onKindChange(e.target.value as DbKind)}>
            {(Object.keys(KIND_LABELS) as DbKind[]).map((k) => (
              <option key={k} value={k}>
                {KIND_LABELS[k]}
              </option>
            ))}
          </Select>
        </Field>

        {isSqlite ? (
          <div className="col-span-2">
            <Field label="Veritabanı Dosya Yolu (.sqlite / .db)">
              <TextInput
                value={form.filePath ?? ''}
                placeholder="/yol/veritabani.sqlite"
                onChange={(e) => set({ filePath: e.target.value })}
              />
            </Field>
          </div>
        ) : (
          <>
            <Field label="Sunucu (Host)">
              <TextInput
                value={form.host ?? ''}
                placeholder="localhost"
                onChange={(e) => set({ host: e.target.value })}
              />
            </Field>
            <Field label="Port">
              <TextInput
                type="number"
                value={form.port ?? ''}
                onChange={(e) => set({ port: Number(e.target.value) || undefined })}
              />
            </Field>
            <Field label="Kullanıcı Adı">
              <TextInput
                value={form.user ?? ''}
                onChange={(e) => set({ user: e.target.value })}
              />
            </Field>
            <Field label="Parola">
              <TextInput
                type="password"
                value={form.password ?? ''}
                placeholder={initial?.hasPassword ? '•••••• (kayıtlı)' : ''}
                onChange={(e) => set({ password: e.target.value })}
              />
            </Field>
            <Field label="Veritabanı Adı">
              <TextInput
                value={form.database ?? ''}
                onChange={(e) => set({ database: e.target.value })}
              />
            </Field>
            <Field label="SSL / Şifreli Bağlantı">
              <Select
                value={form.ssl ? 'on' : 'off'}
                onChange={(e) => set({ ssl: e.target.value === 'on' })}
              >
                <option value="off">Kapalı</option>
                <option value="on">Açık</option>
              </Select>
            </Field>
          </>
        )}
      </div>

      {testMsg && (
        <p
          className={`mt-4 rounded-md px-3 py-2 text-sm ${
            testState === 'ok'
              ? 'bg-green-500/15 text-green-300'
              : 'bg-red-500/15 text-red-300'
          }`}
        >
          {testMsg}
        </p>
      )}
    </Modal>
  )
}

function seed(initial?: SafeConnection): ConnectionConfig {
  if (initial) return { ...initial, password: '' }
  return {
    id: uid('conn'),
    name: '',
    kind: 'sqlite',
    port: DEFAULT_PORTS.sqlite,
    ssl: false
  }
}
