/*
 * Copyright (c) 2026 PaperAxis. All rights reserved.
 * This file is part of PaperAnalysis. Unauthorized copying, modification
 * or distribution of this file is strictly prohibited.
 */
import { useEffect, useState } from 'react'
import { BRAND, footerLine } from '@shared/brand'

/**
 * Alt bilgi çubuğu — künye burada görünür: "Bir PaperAxis ürünüdür" ve
 * koddan okunan sürümle telif satırı. Sürüm elle yazılmaz.
 */
export function StatusBar({ onAbout }: { onAbout: () => void }) {
  const [version, setVersion] = useState('')
  const [portable, setPortable] = useState(false)

  useEffect(() => {
    let alive = true
    void window.api.app.info().then((res) => {
      if (!alive || !res.ok) return
      setVersion(res.data.version)
      setPortable(res.data.portable)
    })
    return () => {
      alive = false
    }
  }, [])

  return (
    <footer className="flex items-center gap-3 border-t border-edge bg-panel px-4 py-1 text-[11px] text-gray-500">
      <span>
        Bir <span className="font-semibold text-gray-400">{BRAND.company}</span> ürünüdür.
      </span>
      {portable && <span className="text-gray-500">· taşınabilir kopya</span>}
      <button
        className="ml-auto hover:text-gray-300 hover:underline"
        onClick={onAbout}
        title="Hakkında"
      >
        {footerLine(version)}
      </button>
    </footer>
  )
}
