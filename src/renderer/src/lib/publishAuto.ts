/*
 * Copyright (c) 2026 PaperAxis. All rights reserved.
 * This file is part of PaperAnalysis. Unauthorized copying, modification
 * or distribution of this file is strictly prohibited.
 */
import { useDashboard } from '../store/dashboard'
import { useSettings } from '../store/settings'
import { paramValues } from './params'
import { buildPublishHtml } from './publish'

// LAN yayınını belirli aralıklarla yeniden üretip sunucuya güncelleyen tek zamanlayıcı.
let timer: ReturnType<typeof setInterval> | null = null

export function stopAutoRepublish(): void {
  if (timer) {
    clearInterval(timer)
    timer = null
  }
}

export function startAutoRepublish(sec: number): void {
  stopAutoRepublish()
  if (!sec || sec <= 0) return
  timer = setInterval(() => {
    void (async () => {
      try {
        const d = useDashboard.getState().dashboard
        const palette = useSettings.getState().palette
        const html = await buildPublishHtml(d, paramValues(d.parameters), palette, sec)
        await window.api.publish.republish(html)
      } catch {
        /* yoksay — sonraki tetiklemede tekrar denenir */
      }
    })()
  }, sec * 1000)
}
