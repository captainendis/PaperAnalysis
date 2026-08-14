/*
 * Copyright (c) 2026 PaperAxis. All rights reserved.
 * This file is part of PaperAnalysis. Unauthorized copying, modification
 * or distribution of this file is strictly prohibited.
 */
import { useEffect, useState } from 'react'
import type { AppInfo } from '@shared/types'
import { BRAND, copyrightLine } from '@shared/brand'
import { Modal } from '../common/Modal'
import { Button } from '../common/Button'
import { PaperAxisMark } from '../common/PaperAxisMark'

/**
 * Hakkında penceresi: marka işareti, ürün adı, koddan okunan sürüm, aidiyet,
 * telif satırı, iletişim ve gizlilik politikası bağlantısı.
 */
export function AboutModal({ open, onClose }: { open: boolean; onClose: () => void }) {
  const [info, setInfo] = useState<AppInfo | null>(null)

  useEffect(() => {
    if (!open) return
    let alive = true
    void window.api.app.info().then((res) => {
      if (alive && res.ok) setInfo(res.data)
    })
    return () => {
      alive = false
    }
  }, [open])

  return (
    <Modal
      open={open}
      title={`${BRAND.product} Hakkında`}
      onClose={onClose}
      footer={
        <Button variant="primary" onClick={onClose}>
          Kapat
        </Button>
      }
    >
      <div className="flex flex-col items-center gap-3 py-2 text-center">
        {/* Marka işareti tek renk: koyu zeminde paper-50, açık zeminde navy-900. */}
        <PaperAxisMark size={56} className="brand-mark" />

        <div>
          <div className="text-lg font-semibold text-gray-100">{BRAND.product}</div>
          <div className="text-sm text-gray-400">Sürüm {info?.version ?? '—'}</div>
        </div>

        <p className="text-sm text-gray-300">
          Bir <span className="font-semibold">{BRAND.company}</span> ürünüdür.
        </p>
        <p className="text-xs text-gray-400">{copyrightLine()}</p>

        <div className="flex items-center gap-3 text-sm">
          <a
            className="text-pa-coral-400 hover:underline"
            href={`mailto:${BRAND.contactEmail}`}
            target="_blank"
            rel="noreferrer"
          >
            {BRAND.contactEmail}
          </a>
          <span className="text-gray-600">·</span>
          <a
            className="text-pa-coral-400 hover:underline"
            href={BRAND.privacyUrl}
            target="_blank"
            rel="noreferrer"
          >
            Gizlilik politikası
          </a>
          <span className="text-gray-600">·</span>
          <a
            className="text-pa-coral-400 hover:underline"
            href={BRAND.site}
            target="_blank"
            rel="noreferrer"
          >
            paperaxis.com
          </a>
        </div>

        {info?.portable && (
          <p className="mt-1 max-w-sm text-xs text-gray-500">
            Taşınabilir kopya — ayarlar ve bağlantılar{' '}
            <span className="font-mono">{info.dataDir}</span> klasöründe tutulur.
          </p>
        )}
      </div>
    </Modal>
  )
}
