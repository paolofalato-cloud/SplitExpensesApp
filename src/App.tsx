import type { User } from '@supabase/supabase-js'
import { useEffect, useState } from 'react'
import { supabase } from './lib/supabase'
import { getUserGroups, joinGroupById, getGroupMembers, updateGroup, leaveGroup, deleteGroup } from './lib/groups'
import type { Group, GroupMember } from './lib/groups'
import { getGroupExpenses } from './lib/expenses'
import type { Expense } from './lib/expenses'
import ExpenseDetailModal from './components/ExpenseDetailModal'
import InstallPrompt from './components/InstallPrompt'
import { Toaster, toast } from 'sonner'
import { subscribeToPushNotifications, unsubscribeFromPushNotifications, checkPushSubscription } from './lib/push'

// Import per Saldi e Rimborsi
import { calculateGroupBalances, simplifyDebts } from './lib/balances'
import type { MemberBalance, SettlementTransaction } from './lib/balances'
import SettleDebtModal from './components/SettleDebtModal'

import Auth from './components/Auth'
import Navigation from './components/Navigation'
import CreateGroupModal from './components/CreateGroupModal'
import AddExpenseModal from './components/AddExpenseModal'
import ShareGroupModal from './components/ShareGroupModal'

import {
  LogOut,
  Wallet,
  ArrowUpRight,
  ArrowDownLeft,
  Plus,
  Scale,
  Receipt,
  ChevronDown,
  PlusCircle,
  UserPlus,
  Users as UsersIcon,
  ArrowRight,
  CheckCircle2,
  Settings,
  Save,
  X,
  Search,
  Bell, 
  BellCheck,
  LogOut as LeaveIcon,
  Trash2 as DeleteIcon,
} from 'lucide-react'

export default function App() {
  const [user, setUser] = useState<User | null>(null)
  const [loading, setLoading] = useState(true)
  const [activeTab, setActiveTab] = useState('expenses')

  // Stati Gruppi
  const [groups, setGroups] = useState<Group[]>([])
  const [activeGroup, setActiveGroup] = useState<Group | null>(null)
  const [members, setMembers] = useState<GroupMember[]>([])
  const [isCreateGroupOpen, setIsCreateGroupOpen] = useState(false)
  const [isShareGroupOpen, setIsShareGroupOpen] = useState(false)
  const [isDropdownOpen, setIsDropdownOpen] = useState(false)
  const [editGroupName, setEditGroupName] = useState('')
  const [editGroupCurrency, setEditGroupCurrency] = useState('EUR')
  const [isSavingGroup, setIsSavingGroup] = useState(false)

  // Stati Spese
  const [expenses, setExpenses] = useState<Expense[]>([])
  const [isAddExpenseOpen, setIsAddExpenseOpen] = useState(false)
  const [selectedExpense, setSelectedExpense] = useState<Expense | null>(null)
  const [isExpenseDetailOpen, setIsExpenseDetailOpen] = useState(false)

  // Stati Filtro e Ricerca Spese
  const [searchQuery, setSearchQuery] = useState('')
  const [selectedCategoryFilter, setSelectedCategoryFilter] = useState('all')

  // Stati Saldi e Rimborsi
  const [balances, setBalances] = useState<MemberBalance[]>([])
  const [settlements, setSettlements] = useState<SettlementTransaction[]>([])
  const [selectedSettlement, setSelectedSettlement] = useState<SettlementTransaction | null>(null)
  const [isSettleOpen, setIsSettleOpen] = useState(false)

  const [isPushSubscribed, setIsPushSubscribed] = useState(false)

  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }) => {
      setUser(session?.user ?? null)
      setLoading(false)
    })

    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((_event, session) => {
      setUser(session?.user ?? null)
      setLoading(false)
    })

    return () => subscription.unsubscribe()
  }, [])

  // Auto-join se è presente il parametro group nell'URL
  useEffect(() => {
    const params = new URLSearchParams(window.location.search)
    const inviteGroupId = params.get('group')

    if (inviteGroupId && user) {
      joinGroupById(inviteGroupId).then((success) => {
        if (success) {
          window.history.replaceState({}, document.title, window.location.pathname)
          loadGroups()
        }
      })
    }
  }, [user])

  // Carica i gruppi dell'utente
  useEffect(() => {
    if (user) {
      loadGroups()
    }
  }, [user])

  // Quando cambia il gruppo attivo, ricarica dati, membri e saldi
  useEffect(() => {
    if (activeGroup) {
      loadExpenses(activeGroup.id)
      loadMembers(activeGroup.id)
      setEditGroupName(activeGroup.name)
      setEditGroupCurrency(activeGroup.currency)
    }
  }, [activeGroup])

  // Notifiche Realtime: ascolta INSERIMENTO, MODIFICA ed ELIMINAZIONE spese nel gruppo attivo
  useEffect(() => {
    if (!activeGroup || !user) return

    const channel = supabase
      .channel(`realtime-expenses-${activeGroup.id}`)
      .on(
        'postgres_changes',
        {
          event: '*', // Ascolta tutti gli eventi (INSERT, UPDATE, DELETE)
          schema: 'public',
          table: 'expenses',
          filter: `group_id=eq.${activeGroup.id}`,
        },
        (payload) => {
          if (payload.eventType === 'INSERT') {
            const newExpense = payload.new as Expense
            if (newExpense.paid_by !== user.id) {
              toast.info('Nuova spesa aggiunta nel gruppo! 📊', {
                description: `${newExpense.description} - €${Number(newExpense.amount).toFixed(2)}`,
              })
            }
          }

          // In tutti i casi (INSERT, UPDATE, DELETE), ricarica spese e saldi
          loadExpenses(activeGroup.id)
        }
      )
      .subscribe()

    return () => {
      supabase.removeChannel(channel)
    }
  }, [activeGroup, user])

  // Controlla lo stato delle notifiche quando l'utente si autentica
  useEffect(() => {
    if (user) {
      checkPushSubscription(user.id).then((isSubscribed) => {
        setIsPushSubscribed(isSubscribed)
      })
    }
  }, [user])

  const handleTogglePushNotifications = async () => {
    if (!user) return

    if (isPushSubscribed) {
      // Se sono già attive, le DISABILITIAMO
      const success = await unsubscribeFromPushNotifications(user.id)
      if (success) {
        setIsPushSubscribed(false)
        toast.success('Notifiche Web Push disattivate.')
      } else {
        toast.error('Impossibile disattivare le notifiche.')
      }
    } else {
      // Se sono inattive, le ATTIBIAMO
      const success = await subscribeToPushNotifications(user.id)
      if (success) {
        setIsPushSubscribed(true)
        toast.success('Notifiche Web Push attivate con successo! 🎉')
      } else {
        toast.error('Impossibile attivare le notifiche. Assicurati di essere su localhost o HTTPS.')
      }
    }
  }

  const loadGroups = async () => {
    const fetchedGroups = await getUserGroups()
    setGroups(fetchedGroups)
    if (fetchedGroups.length > 0 && !activeGroup) {
      setActiveGroup(fetchedGroups[0])
    }
  }

  const loadExpenses = async (groupId: string) => {
    const fetchedExpenses = await getGroupExpenses(groupId)
    setExpenses(fetchedExpenses)
    await loadBalances(groupId)
  }

  const loadMembers = async (groupId: string) => {
    const fetchedMembers = await getGroupMembers(groupId)
    setMembers(fetchedMembers)
  }

  const loadBalances = async (groupId: string) => {
    const calculatedBalances = await calculateGroupBalances(groupId)
    setBalances(calculatedBalances)
    setSettlements(simplifyDebts(calculatedBalances))
  }

  const handleGroupCreated = (newGroup: Group) => {
    setGroups((prev) => [newGroup, ...prev])
    setActiveGroup(newGroup)
  }

  const handleUpdateGroup = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!activeGroup || !editGroupName.trim()) return

    setIsSavingGroup(true)
    const success = await updateGroup(activeGroup.id, editGroupName.trim(), editGroupCurrency)
    setIsSavingGroup(false)

    if (success) {
      const updated = { ...activeGroup, name: editGroupName.trim(), currency: editGroupCurrency }
      setActiveGroup(updated)
      setGroups((prev) => prev.map((g) => (g.id === updated.id ? updated : g)))
      toast.success('Impostazioni gruppo salvate con successo!')
    }
  }

  const handleLeaveGroup = async () => {
    if (!activeGroup || !user) return
    if (!confirm('Sei sicuro di voler abbandonare questo gruppo?')) return

    const success = await leaveGroup(activeGroup.id, user.id)
    if (success) {
      const updatedGroups = groups.filter((g) => g.id !== activeGroup.id)
      setGroups(updatedGroups)
      setActiveGroup(updatedGroups.length > 0 ? updatedGroups[0] : null)
    }
  }

  const handleDeleteGroup = async () => {
    if (!activeGroup) return
    if (!confirm('Sei sicuro di voler eliminare DEFINITIVAMENTE questo gruppo e tutte le sue spese? L\'azione è irreversibile.')) return

    const success = await deleteGroup(activeGroup.id)
    if (success) {
      const updatedGroups = groups.filter((g) => g.id !== activeGroup.id)
      setGroups(updatedGroups)
      setActiveGroup(updatedGroups.length > 0 ? updatedGroups[0] : null)
    }
  }

  const getCategoryEmoji = (cat: string) => {
    switch (cat) {
      case 'food': return '🍕'
      case 'groceries': return '🛒'
      case 'home': return '🏠'
      case 'kids': return '👶'
      case 'health': return '🏥'
      case 'transport': return '🚗'
      case 'pets': return '🐾'
      case 'shopping': return '🛍️'
      case 'leisure': return '🎉'
      case 'travel': return '🏖️'
      case 'settlement': return '🤝'
      default: return '📦'
    }
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-slate-950 text-white flex items-center justify-center">
        <div className="w-8 h-8 border-4 border-emerald-500 border-t-transparent rounded-full animate-spin"></div>
      </div>
    )
  }

  if (!user) {
    return <Auth />
  }

  const filteredExpenses = expenses.filter((exp) => {
    const matchesSearch = exp.description.toLowerCase().includes(searchQuery.toLowerCase())
    const matchesCategory = selectedCategoryFilter === 'all' || exp.category === selectedCategoryFilter
    return matchesSearch && matchesCategory
  })

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 pb-24 relative overflow-hidden">

      {/* --- SFUMATURE DI SFONDO AMBIENTALI --- */}
      <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[500px] h-[300px] bg-emerald-500/10 rounded-full blur-[120px] pointer-events-none" />
      <div className="absolute top-1/3 -right-40 w-[350px] h-[350px] bg-teal-500/5 rounded-full blur-[100px] pointer-events-none" />
      
      {/* Banner Installazione PWA */}
      <InstallPrompt />

      {/* Componente globale per le notifiche toast */}
      <Toaster position="top-center" richColors theme="dark" />

      {/* Header Top Responsive */}
      <header className="sticky top-0 z-30 bg-slate-900/90 backdrop-blur-md border-b border-slate-800 px-4 py-3">
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
            <div className="flex items-center gap-2 pl-2 border-l border-slate-800">
              <div className="hidden sm:block text-right">
                <p className="text-xs font-bold text-slate-200 leading-tight">
                  {user?.user_metadata?.full_name || 'Utente'}
                </p>
                <p className="text-[10px] text-emerald-400">Online</p>
              </div>

              <button
                onClick={() => supabase.auth.signOut()}
                title="Logout"
                className="p-2 rounded-xl bg-slate-800/80 hover:bg-slate-700 text-slate-400 hover:text-white border border-slate-700 transition"
              >
                <LogOut size={18} />
              </button>
            </div>
          </div>
        </div>
      </header>

      {/* Area Contenuto Principale */}
      <main className="max-w-xl mx-auto p-4 space-y-5">
        {activeGroup ? (
          <>
            {/* SCHEDA MEMBRI */}
            {activeTab === 'members' && (
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <h2 className="text-base font-bold text-white flex items-center gap-2">
                    <UsersIcon size={18} className="text-emerald-400" /> Membri del Gruppo
                  </h2>
                  <button
                    onClick={() => setIsShareGroupOpen(true)}
                    className="btn-primary text-xs py-2 px-3 flex items-center gap-1.5"
                  >
                    <UserPlus size={14} /> Condividi QR / Link
                  </button>
                </div>

                <div className="space-y-2">
                  {members.map((member) => (
                    <div
                      key={member.user_id}
                      className="flex items-center justify-between p-3.5 bg-slate-900/90 rounded-2xl border border-slate-800"
                    >
                      <div className="flex items-center gap-3">
                        <div className="w-9 h-9 rounded-xl bg-slate-800 border border-slate-700 flex items-center justify-center font-bold text-xs text-slate-300">
                          {member.full_name?.charAt(0).toUpperCase() || 'U'}
                        </div>
                        <div>
                          <p className="font-semibold text-sm text-slate-100">
                            {member.full_name} {member.user_id === user.id && '(Tu)'}
                          </p>
                          <p className="text-[11px] text-slate-500">{member.email}</p>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* SCHEDA OPZIONI */}
            {activeTab === 'settings' && (
              <div className="space-y-6">
                <div className="flex items-center gap-2 mb-2">
                  <Settings size={20} className="text-emerald-400" />
                  <h2 className="text-base font-bold text-white">Impostazioni Gruppo</h2>
                </div>

                <form onSubmit={handleUpdateGroup} className="card-glass p-5 space-y-4">
                  <div>
                    <label className="block text-xs font-semibold text-slate-300 mb-1">
                      Nome del Gruppo
                    </label>
                    <input
                      type="text"
                      value={editGroupName}
                      onChange={(e) => setEditGroupName(e.target.value)}
                      required
                      className="input-field"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-semibold text-slate-300 mb-1">
                      Valuta Predefinita
                    </label>
                    <select
                      value={editGroupCurrency}
                      onChange={(e) => setEditGroupCurrency(e.target.value)}
                      className="input-field"
                    >
                      <option value="EUR">EUR (€)</option>
                      <option value="USD">USD ($)</option>
                      <option value="GBP">GBP (£)</option>
                      <option value="CHF">CHF (CHF)</option>
                    </select>
                  </div>

                  <div className="pt-4 border-t border-slate-800 space-y-3">
                    <h3 className="text-xs font-bold uppercase tracking-wider text-slate-400">
                      Notifiche & Preferenze
                    </h3>

                    <button
                      type="button"
                      onClick={(e) => {
                        e.preventDefault()
                        e.stopPropagation()
                        handleTogglePushNotifications()
                      }}
                      className={`w-full p-3.5 border rounded-2xl text-xs font-semibold flex items-center justify-between transition active:scale-[0.99] ${
                        isPushSubscribed
                          ? 'bg-emerald-500/10 border-emerald-500/30 text-emerald-400'
                          : 'bg-slate-900 border-slate-800 hover:border-slate-700 text-slate-200'
                      }`}
                    >
                      <span className="flex items-center gap-2">
                        {isPushSubscribed ? (
                          <BellCheck size={16} className="text-emerald-400" />
                        ) : (
                          <Bell size={16} className="text-slate-400" />
                        )}
                        {isPushSubscribed ? 'Notifiche Push Attive' : 'Attiva Notifiche Web Push'}
                      </span>

                      <span
                        className={`text-[10px] px-2 py-0.5 rounded-full font-bold ${
                          isPushSubscribed ? 'bg-emerald-500/20 text-emerald-300' : 'text-slate-500'
                        }`}
                      >
                        {isPushSubscribed ? 'Abilitato' : 'Inattivo'}
                      </span>
                    </button>
                  </div>

                  <button
                    type="submit"
                    disabled={isSavingGroup}
                    className="btn-primary w-full text-xs py-2.5 flex items-center justify-center gap-2"
                  >
                    <Save size={16} />
                    {isSavingGroup ? 'Salvataggio...' : 'Salva Modifiche'}
                  </button>
                </form>

                <div className="pt-4 border-t border-slate-800 space-y-3">
                  <h3 className="text-xs font-bold uppercase tracking-wider text-slate-400">
                    Gestione Avanzata
                  </h3>

                  <div className="space-y-2.5">
                    <button
                      onClick={handleLeaveGroup}
                      className="w-full p-3.5 bg-slate-900 border border-slate-800 hover:border-slate-700 text-slate-300 rounded-2xl text-xs font-semibold flex items-center justify-between transition"
                    >
                      <span className="flex items-center gap-2">
                        <LeaveIcon size={16} className="text-amber-400" /> Abbandona Gruppo
                      </span>
                      <span className="text-[10px] text-slate-500">Rimuoviti dal gruppo</span>
                    </button>

                    {activeGroup.created_by === user.id && (
                      <button
                        onClick={handleDeleteGroup}
                        className="w-full p-3.5 bg-rose-500/10 border border-rose-500/20 hover:bg-rose-500/20 text-rose-400 rounded-2xl text-xs font-semibold flex items-center justify-between transition"
                      >
                        <span className="flex items-center gap-2">
                          <DeleteIcon size={16} /> Elimina Gruppo
                        </span>
                        <span className="text-[10px] opacity-70">Azione irreversibile</span>
                      </button>
                    )}
                  </div>
                </div>
              </div>
            )}

            {/* SCHEDA SALDI */}
            {activeTab === 'balances' && (
              <div className="space-y-5">
                <div>
                  <h2 className="text-base font-bold text-white mb-3 flex items-center gap-2">
                    <Scale size={18} className="text-emerald-400" /> Modo più rapido per saldare
                  </h2>

                  {settlements.length > 0 ? (
                    <div className="space-y-2.5">
                      {settlements.map((st, idx) => (
                        <div
                          key={idx}
                          className="p-4 bg-slate-900 border border-slate-800 rounded-2xl flex items-center justify-between gap-3"
                        >
                          <div className="flex items-center gap-2 text-sm text-slate-300">
                            <span className="font-semibold text-rose-400">{st.fromName}</span>
                            <ArrowRight size={14} className="text-slate-500" />
                            <span className="font-semibold text-emerald-400">{st.toName}</span>
                          </div>
                          <div className="flex items-center gap-3">
                            <span className="font-bold text-white text-base">
                              € {st.amount.toFixed(2)}
                            </span>
                            <button
                              onClick={() => {
                                setSelectedSettlement(st)
                                setIsSettleOpen(true)
                              }}
                              className="btn-primary text-xs py-1.5 px-3"
                            >
                              Salda
                            </button>
                          </div>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <div className="card-glass p-6 text-center space-y-2">
                      <CheckCircle2 size={32} className="text-emerald-400 mx-auto" />
                      <p className="text-sm font-semibold text-white">Tutti i saldi sono in pareggio!</p>
                      <p className="text-xs text-slate-400">Non ci sono debiti pendenti nel gruppo.</p>
                    </div>
                  )}
                </div>

                <div>
                  <h3 className="text-xs font-bold uppercase tracking-wider text-slate-400 mb-3">
                    Riepilogo Partecipanti
                  </h3>
                  <div className="space-y-2">
                    {balances.map((b) => (
                      <div
                        key={b.userId}
                        className="p-3.5 bg-slate-900/60 border border-slate-800/80 rounded-2xl flex items-center justify-between"
                      >
                        <div>
                          <p className="font-semibold text-sm text-slate-200">
                            {b.fullName} {b.userId === user.id && '(Tu)'}
                          </p>
                          <p className="text-[11px] text-slate-500">
                            Speso: € {b.paidTotal.toFixed(2)} • Quota: € {b.owedTotal.toFixed(2)}
                          </p>
                        </div>
                        <div className="text-right">
                          {b.netBalance > 0 ? (
                            <span className="text-sm font-extrabold text-emerald-400">
                              + € {b.netBalance.toFixed(2)}
                            </span>
                          ) : b.netBalance < 0 ? (
                            <span className="text-sm font-extrabold text-rose-400">
                              - € {Math.abs(b.netBalance).toFixed(2)}
                            </span>
                          ) : (
                            <span className="text-xs font-medium text-slate-500">In pareggio</span>
                          )}
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            )}

            {/* SCHEDA SPESE */}
            {activeTab === 'expenses' && (
              <>
                {/* --- HERO CARD (Riepilogo Totale & Saldi) --- */}
                <div className="relative overflow-hidden rounded-3xl bg-gradient-to-br from-slate-900 via-slate-900 to-emerald-950/40 border border-slate-800 p-6 shadow-2xl">
                  <div className="absolute top-0 right-0 w-32 h-32 bg-emerald-500/10 rounded-full blur-2xl pointer-events-none" />

                  <div className="flex items-center justify-between mb-4">
                    <span className="text-xs font-semibold tracking-wider uppercase text-slate-400 flex items-center gap-1.5">
                      <Wallet size={14} className="text-emerald-400" /> Saldo in {activeGroup.name}
                    </span>
                    <span className="px-2.5 py-1 rounded-full text-xs font-bold bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
                      {expenses.length} Spese
                    </span>
                  </div>

                  <div className="mb-6">
                    <p className="text-3xl font-extrabold text-white tracking-tight">
                      € {expenses.reduce((sum, exp) => sum + Number(exp.amount), 0).toFixed(2)}
                    </p>
                    <p className="text-xs text-slate-400 mt-1">Totale spese registrate nel gruppo</p>
                  </div>

                  <div className="grid grid-cols-2 gap-3 pt-4 border-t border-slate-800/80">
                    <div className="flex items-center gap-2.5">
                      <div className="w-8 h-8 rounded-lg bg-emerald-500/10 border border-emerald-500/20 flex items-center justify-center text-emerald-400">
                        <ArrowDownLeft size={16} />
                      </div>
                      <div>
                        <p className="text-[11px] text-slate-400 font-medium">Ti devono</p>
                        <p className="text-sm font-bold text-emerald-400">
                          + € {(balances.find((b) => b.userId === user.id)?.netBalance || 0) > 0
                            ? (balances.find((b) => b.userId === user.id)?.netBalance || 0).toFixed(2)
                            : '0.00'}
                        </p>
                      </div>
                    </div>

                    <div className="flex items-center gap-2.5">
                      <div className="w-8 h-8 rounded-lg bg-rose-500/10 border border-rose-500/20 flex items-center justify-center text-rose-400">
                        <ArrowUpRight size={16} />
                      </div>
                      <div>
                        <p className="text-[11px] text-slate-400 font-medium">Devi dare</p>
                        <p className="text-sm font-bold text-rose-400">
                          - € {(balances.find((b) => b.userId === user.id)?.netBalance || 0) < 0
                            ? Math.abs(balances.find((b) => b.userId === user.id)?.netBalance || 0).toFixed(2)
                            : '0.00'}
                        </p>
                      </div>
                    </div>
                  </div>
                </div>

                <div className="space-y-3">
                  <div className="flex items-center justify-between px-1">
                    <h2 className="text-base font-bold text-white flex items-center gap-2">
                      <Receipt size={18} className="text-emerald-400" />
                      Spese del Gruppo
                    </h2>

                    {/* Pulsante sempre visibile in cima alla lista */}
                    <button
                      onClick={() => setIsAddExpenseOpen(true)}
                      className="btn-primary text-xs py-1.5 px-3 flex items-center gap-1.5 shadow-md shadow-emerald-500/10"
                    >
                      <Plus size={15} /> Aggiungi
                    </button>
                  </div>
                              
                  {/* BARRA DI RICERCA E FILTRI CATEGORIA */}
                  <div className="flex flex-col sm:flex-row gap-2">
                    <div className="relative flex-1">
                      <input
                        type="text"
                        placeholder="Cerca spesa..."
                        value={searchQuery}
                        onChange={(e) => setSearchQuery(e.target.value)}
                        className="w-full bg-slate-900 border border-slate-800 rounded-xl pl-9 pr-8 py-2 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-emerald-500 transition"
                      />
                      <Search size={14} className="absolute left-3 top-2.5 text-slate-500" />
                      {searchQuery && (
                        <button
                          type="button"
                          onClick={() => setSearchQuery('')}
                          className="absolute right-3 top-2.5 text-slate-500 hover:text-white"
                        >
                          <X size={12} />
                        </button>
                      )}
                    </div>

                    <select
                      value={selectedCategoryFilter}
                      onChange={(e) => setSelectedCategoryFilter(e.target.value)}
                      className="bg-slate-900 border border-slate-800 rounded-xl px-3 py-2 text-xs text-slate-300 focus:outline-none focus:border-emerald-500 transition"
                    >
                      <option value="all">Tutte le categorie</option>
                      <option value="food">🍕 Cibo & Ristoranti</option>
                      <option value="groceries">🛒 Supermercato</option>
                      <option value="home">🏠 Casa & Bollette</option>
                      <option value="kids">👶 Bambini & Scuola</option>
                      <option value="health">🏥 Salute & Farmacia</option>
                      <option value="transport">🚗 Auto & Trasporti</option>
                      <option value="pets">🐾 Animali Domestici</option>
                      <option value="shopping">🛍️ Shopping & Abbigliamento</option>
                      <option value="leisure">🎉 Svago & Intrattenimento</option>
                      <option value="travel">🏖️ Viaggi & Vacanze</option>
                      <option value="settlement">🤝 Rimborsi</option>
                      <option value="general">📦 Altro</option>
                    </select>
                  </div>

                  {/* LISTA SPESE SUDDIVISA PER PERIODO */}
                  {filteredExpenses.length > 0 ? (() => {
                    const now = new Date()
                    const currentMonth = now.getMonth()
                    const currentYear = now.getFullYear()

                    const thisMonthList = filteredExpenses.filter((exp) => {
                      const d = new Date(exp.created_at)
                      return d.getMonth() === currentMonth && d.getFullYear() === currentYear
                    })

                    const olderList = filteredExpenses.filter((exp) => !thisMonthList.includes(exp))

                    const renderExpenseCard = (exp: typeof filteredExpenses[0]) => (
                      <div
                        key={exp.id}
                        onClick={() => {
                          setSelectedExpense(exp)
                          setIsExpenseDetailOpen(true)
                        }}
                        className="flex items-center justify-between p-4 bg-slate-900/90 rounded-2xl border border-slate-800/80 hover:border-slate-700 transition cursor-pointer active:scale-[0.99]"
                      >
                        <div className="flex items-center gap-3.5">
                          <div className="w-11 h-11 rounded-2xl bg-slate-800/80 border border-slate-700 flex items-center justify-center text-xl">
                            {getCategoryEmoji(exp.category)}
                          </div>
                          <div>
                            <p className="font-semibold text-sm text-slate-100">{exp.description}</p>
                            <p className="text-xs text-slate-400">
                              {new Date(exp.created_at).toLocaleDateString('it-IT', {
                                day: 'numeric',
                                month: 'short',
                                year: 'numeric',
                              })}
                            </p>
                          </div>
                        </div>
                        <div className="text-right">
                          <p className="font-bold text-sm text-white">€ {Number(exp.amount).toFixed(2)}</p>
                        </div>
                      </div>
                    )

                    return (
                      <div className="space-y-6">
                        {/* Questo Mese */}
                        {thisMonthList.length > 0 && (
                          <div className="space-y-2.5">
                            <h3 className="text-[11px] font-bold uppercase tracking-wider text-slate-400 px-1">
                              Questo Mese ({thisMonthList.length})
                            </h3>
                            {thisMonthList.map(renderExpenseCard)}
                          </div>
                        )}

                        {/* Precedenti */}
                        {olderList.length > 0 && (
                          <div className="space-y-2.5">
                            <h3 className="text-[11px] font-bold uppercase tracking-wider text-slate-400 px-1 pt-2">
                              Spese Precedenti ({olderList.length})
                            </h3>
                            {olderList.map(renderExpenseCard)}
                          </div>
                        )}
                      </div>
                    )
                  })() : (
                    <div className="card-glass p-8 text-center space-y-3">
                      <p className="text-slate-400 text-sm">
                        {expenses.length === 0
                          ? 'Non ci sono ancora spese in questo gruppo.'
                          : 'Nessuna spesa corrisponde ai filtri impostati.'}
                      </p>
                      {expenses.length === 0 && (
                        <button
                          onClick={() => setIsAddExpenseOpen(true)}
                          className="btn-primary text-xs py-2 px-4 inline-flex items-center gap-1.5"
                        >
                          <Plus size={16} /> Aggiungi la prima spesa
                        </button>
                      )}
                    </div>
                  )}
                </div>
              </>
            )}
          </>
        ) : (
          <div className="card-glass p-8 text-center space-y-4 my-12">
            <div className="w-12 h-12 bg-emerald-500/10 border border-emerald-500/20 rounded-2xl flex items-center justify-center text-emerald-400 mx-auto">
              <PlusCircle size={24} />
            </div>
            <div>
              <h2 className="text-lg font-bold text-white">Nessun Gruppo Trovato</h2>
              <p className="text-xs text-slate-400 mt-1 max-w-xs mx-auto">
                Crea il tuo primo gruppo per iniziare a registrare e dividere le spese.
              </p>
            </div>
            <button
              onClick={() => setIsCreateGroupOpen(true)}
              className="btn-primary text-sm py-2.5 px-5"
            >
              Crea un Gruppo
            </button>
          </div>
        )}
      </main>

      {/* Navigazione Mobile */}
      <Navigation
        activeTab={activeTab}
        setActiveTab={setActiveTab}
        onAddExpense={() => {
          if (activeGroup) setIsAddExpenseOpen(true)
          else setIsCreateGroupOpen(true)
        }}
      />

      {/* Modali */}
      <CreateGroupModal
        isOpen={isCreateGroupOpen}
        onClose={() => setIsCreateGroupOpen(false)}
        onGroupCreated={handleGroupCreated}
      />

      {activeGroup && (
        <>
          <AddExpenseModal
            isOpen={isAddExpenseOpen}
            onClose={() => setIsAddExpenseOpen(false)}
            groupId={activeGroup.id}
            currentUserId={user.id}
            onExpenseAdded={() => loadExpenses(activeGroup.id)}
          />

          <ExpenseDetailModal
            isOpen={isExpenseDetailOpen}
            onClose={() => setIsExpenseDetailOpen(false)}
            expense={selectedExpense}
            currentUserId={user.id}
            members={members}
            onExpenseUpdated={() => {
              if (activeGroup) {
                loadExpenses(activeGroup.id)
              }
            }}
          />

          <ShareGroupModal
            isOpen={isShareGroupOpen}
            onClose={() => setIsShareGroupOpen(false)}
            group={activeGroup}
          />

          <SettleDebtModal
            isOpen={isSettleOpen}
            onClose={() => setIsSettleOpen(false)}
            groupId={activeGroup.id}
            settlement={selectedSettlement}
            onSettled={() => loadExpenses(activeGroup.id)}
          />
        </>
      )}
    </div>
  )
}