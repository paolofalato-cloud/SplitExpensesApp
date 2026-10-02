import { Receipt, Scale, Users, Settings, Plus, FolderPlus } from 'lucide-react'

interface NavigationProps {
  activeTab: string
  setActiveTab: (tab: string) => void
  onAddExpense: () => void
  onAddMember?: () => void
  onCreateGroup?: () => void 
}

export default function Navigation({ activeTab, setActiveTab, onAddExpense, onAddMember, onCreateGroup }: NavigationProps) {
  const navItems = [
    { id: 'expenses', label: 'Spese', icon: Receipt },
    { id: 'balances', label: 'Saldi', icon: Scale },
    { id: 'members', label: 'Membri', icon: Users },
    { id: 'settings', label: 'Opzioni', icon: Settings },
  ]

  // Gestione dinamica del click sul FAB in base alla tab attiva
  const handleFabClick = () => {
    if (activeTab === 'members' && onAddMember) {
      onAddMember()
    } else if (activeTab === 'settings' && onCreateGroup) {
      onCreateGroup() 
    } else {
      onAddExpense()
    }
  }

  const isSettings = activeTab === 'settings'
  const isMembers = activeTab === 'members'

  return (
    <nav className="md:hidden fixed bottom-0 left-0 right-0 bg-slate-900/80 backdrop-blur-xl border-t border-slate-800/80 z-40 px-4 pt-2 pb-6 shadow-2xl shadow-black/50">
      <div className="max-w-md mx-auto flex items-center justify-around relative">
        {/* Prime due schede: Spese e Saldi */}
        {navItems.slice(0, 2).map((item) => {
          const Icon = item.icon
          const isActive = activeTab === item.id
          return (
            <button
              key={item.id}
              onClick={() => setActiveTab(item.id)}
              className={`relative flex flex-col items-center gap-1 py-1.5 px-3 rounded-2xl transition-all duration-300 ${
                isActive 
                  ? 'text-emerald-400 font-semibold scale-105' 
                  : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800/40'
              }`}
            >
              {isActive && (
                <span className="absolute -top-2 w-8 h-1 bg-emerald-500 rounded-full shadow-lg shadow-emerald-500/50" />
              )}
              <Icon size={21} strokeWidth={isActive ? 2.5 : 2} />
              <span className="text-[10px] tracking-tight">{item.label}</span>
            </button>
          )
        })}

        {/* Pulsante Centrale FAB Contestuale */}
        <div className="relative -top-6">
          <button
            onClick={handleFabClick}
            title={isMembers ? 'Aggiungi Membro' : isSettings ? 'Crea Nuovo Gruppo' : 'Aggiungi Spesa'}
            className={`w-14 h-14 rounded-full flex items-center justify-center shadow-xl ring-4 ring-slate-950 transition-all duration-300 transform hover:scale-105 active:scale-90 ${
              isSettings 
                ? 'bg-gradient-to-tr from-blue-600 to-indigo-400 text-white shadow-blue-500/30' 
                : isMembers
                ? 'bg-gradient-to-tr from-teal-600 to-cyan-400 text-slate-950 shadow-teal-500/30'
                : 'bg-gradient-to-tr from-emerald-600 to-emerald-400 hover:from-emerald-500 hover:to-emerald-300 text-slate-950 shadow-emerald-500/40'
            }`}
          >
            {isMembers ? (
              <Users size={24} strokeWidth={2.5} />
            ) : isSettings ? (
              <FolderPlus size={24} strokeWidth={2.5} />
            ) : (
              <Plus size={30} strokeWidth={2.8} />
            )}
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
              className={`relative flex flex-col items-center gap-1 py-1.5 px-3 rounded-2xl transition-all duration-300 ${
                isActive 
                  ? 'text-emerald-400 font-semibold scale-105' 
                  : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800/40'
              }`}
            >
              {isActive && (
                <span className="absolute -top-2 w-8 h-1 bg-emerald-500 rounded-full shadow-lg shadow-emerald-500/50" />
              )}
              <Icon size={21} strokeWidth={isActive ? 2.5 : 2} />
              <span className="text-[10px] tracking-tight">{item.label}</span>
            </button>
          )
        })}
      </div>
    </nav>
  )
}