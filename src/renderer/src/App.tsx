/*
 * Copyright (c) 2026 PaperAxis. All rights reserved.
 * This file is part of PaperAnalysis. Unauthorized copying, modification
 * or distribution of this file is strictly prohibited.
 */
import { useEffect, useState } from 'react'
import { Toolbar } from './components/Toolbar'
import { StatusBar } from './components/StatusBar'
import { AboutModal } from './components/About/AboutModal'
import { DashboardTabs } from './components/DashboardTabs'
import { ConnectionPanel } from './components/ConnectionManager/ConnectionPanel'
import { DashboardCanvas } from './components/Dashboard/DashboardCanvas'
import { FilterBar } from './components/FilterBar/FilterBar'
import { useSettings } from './store/settings'
import { useDashboard } from './store/dashboard'

export default function App() {
  const globalTheme = useSettings((s) => s.theme)
  const dashTheme = useDashboard((s) => s.dashboard.theme)
  // Panoya özel tema varsa onu, yoksa uygulama genel temasını uygula.
  const theme = dashTheme ?? globalTheme
  const [aboutOpen, setAboutOpen] = useState(false)

  // Tema değerini kök elemana yaz (CSS değişkenleri buna göre değişir).
  useEffect(() => {
    document.documentElement.setAttribute('data-theme', theme)
  }, [theme])

  // Menüdeki "Yardım → PaperAnalysis Hakkında" girişi bu pencereyi açar.
  useEffect(() => window.api.app.onShowAbout(() => setAboutOpen(true)), [])

  return (
    <div className="flex h-screen flex-col bg-base">
      <Toolbar onAbout={() => setAboutOpen(true)} />
      <DashboardTabs />
      <FilterBar />
      <div className="flex flex-1 overflow-hidden">
        <ConnectionPanel />
        <main className="flex-1 overflow-hidden">
          <DashboardCanvas />
        </main>
      </div>
      <StatusBar onAbout={() => setAboutOpen(true)} />
      <AboutModal open={aboutOpen} onClose={() => setAboutOpen(false)} />
    </div>
  )
}
