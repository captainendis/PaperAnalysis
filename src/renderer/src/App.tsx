import { useEffect } from 'react'
import { Toolbar } from './components/Toolbar'
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

  // Tema değerini kök elemana yaz (CSS değişkenleri buna göre değişir).
  useEffect(() => {
    document.documentElement.setAttribute('data-theme', theme)
  }, [theme])

  return (
    <div className="flex h-screen flex-col bg-base">
      <Toolbar />
      <DashboardTabs />
      <FilterBar />
      <div className="flex flex-1 overflow-hidden">
        <ConnectionPanel />
        <main className="flex-1 overflow-hidden">
          <DashboardCanvas />
        </main>
      </div>
    </div>
  )
}
