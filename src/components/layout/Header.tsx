
import type { User } from '@supabase/supabase-js'
import type { Group, GroupMember } from '../../lib/groups'
import {
  ChevronDown,
  PlusCircle,
  UserPlus,
  Users as UsersIcon,
  Receipt,
  Scale,
  Settings,
  LogOut,
} from 'lucide-react'

interface HeaderProps {
  user: User
  groups: Group[]
  activeGroup: Group | null
  members: GroupMember[]
  activeTab: string
  setActiveTab: (tab: string) => void
  setActiveGroup: (group: Group) => void
  setIsCreateGroupOpen: (isOpen: boolean) => void
  setIsShareGroupOpen: (isOpen: boolean) => void
  isDropdownOpen: boolean
  setIsDropdownOpen: (isOpen: boolean) => void
  onSignOut: () => void
}

export default function Header({
  user,
  groups,
  activeGroup,
  members,
  activeTab,
  setActiveTab,
  setActiveGroup,
  setIsCreateGroupOpen,
  setIsShareGroupOpen,
  isDropdownOpen,
  setIsDropdownOpen,
  onSignOut,
}: HeaderProps) {
  const userMetadata = (user as any)?.user_metadata || {}
  const userFullName = userMetadata.full_name || (user as any)?.full_name || 'Utente'
  const userInitial = userFullName.charAt(0).toUpperCase()

  return (
    <header className="sticky top-0 z-30 bg-slate-900/90 backdrop-blur-md border-b border-slate-800 px-4 pt-[calc(env(safe-area-inset-top)+0.75rem)] pb-3">
      <div className="max-w-4xl mx-auto flex items-center justify-between gap-4">

        {/* Selettore Gruppo */}
        <div className="relative">
          <button
            onClick={() => setIsDropdownOpen(!isDropdownOpen)}
            className="flex items-center gap-2.5 p-1.5 px-2.5 rounded-2xl bg-slate-800/60 hover:bg-slate-800 border border-slate-700/60 transition"
          >
            <div className="w-8 h-8 rounded-xl bg-gradient-to-tr from-emerald-500 to-teal-400 flex items-center justify-center font-black text-slate-950 text-sm shadow-md shadow-emerald-500/20">
              {activeGroup ? activeGroup.name.charAt(0).toUpperCase() : 'SE'}
            </div>
            <div className="text-left">
              <h1 className="font-bold text-white text-sm leading-tight flex items-center gap-1">
                {activeGroup ? activeGroup.name : 'Nessun Gruppo'}
                <ChevronDown size={14} className="text-slate-400" />
              </h1>
              <p className="text-[10px] text-slate-400">{members.length} Partecipanti</p>
            </div>
          </button>

          {/* Menu Dropdown Gruppi */}
          {isDropdownOpen && (
            <div className="absolute top-12 left-0 w-56 bg-slate-900 border border-slate-800 rounded-2xl p-2 shadow-2xl z-50 space-y-1">
              <p className="text-[10px] uppercase font-bold text-slate-500 px-3 py-1">I tuoi gruppi</p>
              {groups.map((group) => (
                <button
                  key={group.id}
                  onClick={() => {
                    setActiveGroup(group)
                    setIsDropdownOpen(false)
                  }}
                  className={`w-full text-left px-3 py-2 rounded-xl text-xs font-medium flex items-center justify-between transition ${
                    activeGroup?.id === group.id
                      ? 'bg-emerald-500/10 text-emerald-400 font-bold'
                      : 'text-slate-300 hover:bg-slate-800'
                  }`}
                >
                  <span>{group.name}</span>
                  <span className="text-[10px] opacity-60">{group.currency}</span>
                </button>
              ))}

              <button
                onClick={() => {
                  setIsDropdownOpen(false)
                  setIsCreateGroupOpen(true)
                }}
                className="w-full text-left px-3 py-2 rounded-xl text-xs font-semibold text-emerald-400 hover:bg-emerald-500/10 flex items-center gap-2 border-t border-slate-800 mt-1 pt-2 transition"
              >
                <PlusCircle size={14} /> Crea Nuovo Gruppo
              </button>
            </div>
          )}
        </div>

        {/* Navigazione Web / Desktop Header */}
        {activeGroup && (
          <div className="hidden md:flex items-center bg-slate-950/60 p-1 rounded-2xl border border-slate-800/80">
            <button
              onClick={() => setActiveTab('expenses')}
              className={`flex items-center gap-2 px-4 py-1.5 text-xs font-bold rounded-xl transition ${
                activeTab === 'expenses'
                  ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20'
                  : 'text-slate-400 hover:text-white'
              }`}
            >
              <Receipt size={15} /> Spese
            </button>
            <button
              onClick={() => setActiveTab('balances')}
              className={`flex items-center gap-2 px-4 py-1.5 text-xs font-bold rounded-xl transition ${
                activeTab === 'balances'
                  ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20'
                  : 'text-slate-400 hover:text-white'
              }`}
            >
              <Scale size={15} /> Saldi
            </button>
            <button
              onClick={() => setActiveTab('members')}
              className={`flex items-center gap-2 px-4 py-1.5 text-xs font-bold rounded-xl transition ${
                activeTab === 'members'
                  ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20'
                  : 'text-slate-400 hover:text-white'
              }`}
            >
              <UsersIcon size={15} /> Membri ({members.length})
            </button>
            <button
              onClick={() => setActiveTab('settings')}
              className={`flex items-center gap-2 px-4 py-1.5 text-xs font-bold rounded-xl transition ${
                activeTab === 'settings'
                  ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20'
                  : 'text-slate-400 hover:text-white'
              }`}
            >
              <Settings size={15} /> Opzioni
            </button>
          </div>
        )}

        {/* Pulsanti Azione Destra */}
        <div className="flex items-center gap-2">
          {activeGroup && (
            <button
              onClick={() => setIsShareGroupOpen(true)}
              title="Invita Membri"
              className="p-2 rounded-xl bg-emerald-500/10 hover:bg-emerald-500/20 text-emerald-400 border border-emerald-500/20 transition flex items-center gap-1.5 text-xs font-bold px-3"
            >
              <UserPlus size={16} /> <span className="hidden sm:inline">Invita</span>
            </button>
          )}

          {/* Nome utente e Logout */}
          <div className="flex items-center gap-2.5 pl-2 border-l border-slate-800">
            <div className="flex items-center gap-2">
              <div className="w-8 h-8 rounded-full bg-emerald-500/20 border border-emerald-500/30 flex items-center justify-center text-emerald-400 font-bold text-xs shrink-0">
                {userInitial}
              </div>
              
              <div className="text-left">
                <p className="text-xs font-bold text-slate-200 max-w-[80px] sm:max-w-none truncate leading-tight">
                  {userFullName.split(' ')[0]}
                </p>
                <p className="text-[10px] text-emerald-400">Online</p>
              </div>
            </div>

            <button
              onClick={onSignOut}
              title="Logout"
              className="p-2 rounded-xl bg-slate-800/80 hover:bg-slate-700 text-slate-400 hover:text-white border border-slate-700 transition shrink-0"
            >
              <LogOut size={18} />
            </button>
          </div>
        </div>
      </div>
    </header>
  )
}