import { useEffect } from 'react'
import { Toolbar } from './components/Toolbar'
import { ConnectionPanel } from './components/ConnectionManager/ConnectionPanel'
import { DashboardCanvas } from './components/Dashboard/DashboardCanvas'
import { FilterBar } from './components/FilterBar/FilterBar'
import { useSettings } from './store/settings'

export default function App() {
  const theme = useSettings((s) => s.theme)

  // Tema değerini kök elemana yaz (CSS değişkenleri buna göre değişir).
  useEffect(() => {
    document.documentElement.setAttribute('data-theme', theme)
  }, [theme])

  return (
    <div className="flex h-screen flex-col bg-base">
      <Toolbar />
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
