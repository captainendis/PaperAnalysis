import { Toolbar } from './components/Toolbar'
import { ConnectionPanel } from './components/ConnectionManager/ConnectionPanel'
import { DashboardCanvas } from './components/Dashboard/DashboardCanvas'
import { FilterBar } from './components/FilterBar/FilterBar'

export default function App() {
  return (
    <div className="flex h-screen flex-col bg-[#15161b]">
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
