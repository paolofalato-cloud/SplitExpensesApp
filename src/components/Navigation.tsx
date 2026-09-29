import { Receipt, Scale, Users, Settings, Plus } from 'lucide-react'

interface NavigationProps {
  activeTab: string
  setActiveTab: (tab: string) => void
  onAddExpense: () => void
}

export default function Navigation({ activeTab, setActiveTab, onAddExpense }: NavigationProps) {
  const navItems = [
    { id: 'expenses', label: 'Spese', icon: Receipt },
    { id: 'balances', label: 'Saldi', icon: Scale },
    { id: 'members', label: 'Membri', icon: Users },
    { id: 'settings', label: 'Opzioni', icon: Settings },
  ]

  return (
    <nav className="md:hidden fixed bottom-0 left-0 right-0 bg-slate-900/95 backdrop-blur-lg border-t border-slate-800 z-40 px-4 py-2">
      <div className="max-w-md mx-auto flex items-center justify-around relative">
        {/* Prime due schede: Spese e Saldi */}
        {navItems.slice(0, 2).map((item) => {
          const Icon = item.icon
          const isActive = activeTab === item.id
          return (
            <button
              key={item.id}
              onClick={() => setActiveTab(item.id)}
              className={`flex flex-col items-center gap-1 py-1.5 px-3 rounded-xl transition ${
                isActive ? 'text-emerald-400 font-bold' : 'text-slate-400 hover:text-slate-200'
              }`}
            >
              <Icon size={20} />
              <span className="text-[11px]">{item.label}</span>
            </button>
          )
        })}

        {/* Pulsante Centrale FAB per Aggiungere Spese */}
        <div className="relative -top-5">
          <button
            onClick={onAddExpense}
            title="Aggiungi Spesa"
            className="w-13 h-13 rounded-2xl bg-emerald-500 hover:bg-emerald-400 text-slate-950 flex items-center justify-center shadow-lg shadow-emerald-500/30 transition transform active:scale-95"
          >
            <Plus size={28} strokeWidth={2.5} />
          </button>
        </div>

        {/* Ultime due schede: Membri e Opzioni */}
        {navItems.slice(2).map((item) => {
          const Icon = item.icon
          const isActive = activeTab === item.id
          return (
            <button
              key={item.id}
              onClick={() => setActiveTab(item.id)}
              className={`flex flex-col items-center gap-1 py-1.5 px-3 rounded-xl transition ${
                isActive ? 'text-emerald-400 font-bold' : 'text-slate-400 hover:text-slate-200'
              }`}
            >
              <Icon size={20} />
              <span className="text-[11px]">{item.label}</span>
            </button>
          )
        })}
      </div>
    </nav>
  )
}