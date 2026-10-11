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

// Import Saldi e Rimborsi
import { calculateGroupBalances, simplifyDebts } from './lib/balances'
import type { MemberBalance, SettlementTransaction } from './lib/balances'
import SettleDebtModal from './components/SettleDebtModal'

import Auth from './components/Auth'
import Navigation from './components/layout/NavigationMenu'
import CreateGroupModal from './components/CreateGroupModal'
import AddExpenseModal from './components/AddExpenseModal'
import ShareGroupModal from './components/ShareGroupModal'

// Nuovi Componenti Modulari
import Header from './components/layout/Header'
import ExpensesTab from './components/expenses/ExpensesTab'
import BalancesTab from './components/balances/BalancesTab'
import MembersTab from './components/members/MembersTab'
import SettingsTab from './components/settings/SettingsTab'

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
  const [selectedPayerFilter, setSelectedPayerFilter] = useState('all')

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

  // Auto-join tramite parametro URL
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

  // Cambio gruppo attivo
  useEffect(() => {
    if (activeGroup) {
      loadExpenses(activeGroup.id)
      loadMembers(activeGroup.id)
      setEditGroupName(activeGroup.name)
      setEditGroupCurrency(activeGroup.currency)
    }
  }, [activeGroup])

  // Realtime Supabase
  useEffect(() => {
    if (!activeGroup || !user) return

    const channel = supabase
      .channel(`realtime-expenses-${activeGroup.id}`)
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'expenses',
          filter: `group_id=eq.${activeGroup.id}`,
        },
        (payload) => {
          if (payload.eventType === 'INSERT') {
            const newExpense = payload.new as Expense
            if (newExpense.paid_by !== user.id) {
              toast.info('Nuova spesa aggiunta nel gruppo! 📊', {
                description: `${newExpense.description} - € ${Number(newExpense.amount).toFixed(2)}`,
              })
            }
          }
          loadExpenses(activeGroup.id)
        }
      )
      .subscribe()

    return () => {
      supabase.removeChannel(channel)
    }
  }, [activeGroup, user])

  // Controlla stato notifiche push
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
      const success = await unsubscribeFromPushNotifications(user.id)
      if (success) {
        setIsPushSubscribed(false)
        toast.success('Notifiche Web Push disattivate.')
      } else {
        toast.error('Impossibile disattivare le notifiche.')
      }
    } else {
      const success = await subscribeToPushNotifications(user.id)
      if (success) {
        setIsPushSubscribed(true)
        toast.success('Notifiche Web Push attivate con successo! 🎉')
      } else {
        toast.error('Impossibile attivare le notifiche.')
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
    if (!confirm('Sei sicuro di voler eliminare DEFINITIVAMENTE questo gruppo e tutte le sue spese?')) return

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

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 pb-24 relative overflow-hidden">
      {/* Sfumature ambientali */}
      <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[500px] h-[300px] bg-emerald-500/10 rounded-full blur-[120px] pointer-events-none" />
      <div className="absolute top-1/3 -right-40 w-[350px] h-[350px] bg-teal-500/5 rounded-full blur-[100px] pointer-events-none" />
      
      <InstallPrompt />
      <Toaster position="top-center" richColors theme="dark" toastOptions={{ style: { marginTop: 'env(safe-area-inset-top)' } }} />

      {/* HEADER ISOLATO */}
      <Header
        user={user}
        groups={groups}
        activeGroup={activeGroup}
        members={members}
        activeTab={activeTab}
        setActiveTab={setActiveTab}
        setActiveGroup={setActiveGroup}
        setIsCreateGroupOpen={setIsCreateGroupOpen}
        setIsShareGroupOpen={setIsShareGroupOpen}
        isDropdownOpen={isDropdownOpen}
        setIsDropdownOpen={setIsDropdownOpen}
        onSignOut={() => supabase.auth.signOut()}
      />

      {/* AREA CONTENUTO PRINCIPALE */}
      <main className="max-w-xl mx-auto p-4 space-y-5">
        {activeGroup ? (
          <>
            {activeTab === 'members' && (
              <MembersTab
                user={user}
                members={members}
                setIsShareGroupOpen={setIsShareGroupOpen}
              />
            )}

            {activeTab === 'settings' && (
              <SettingsTab
                activeGroup={activeGroup}
                user={user}
                editGroupName={editGroupName}
                setEditGroupName={setEditGroupName}
                editGroupCurrency={editGroupCurrency}
                setEditGroupCurrency={setEditGroupCurrency}
                isSavingGroup={isSavingGroup}
                handleUpdateGroup={handleUpdateGroup}
                isPushSubscribed={isPushSubscribed}
                handleTogglePushNotifications={handleTogglePushNotifications}
                handleLeaveGroup={handleLeaveGroup}
                handleDeleteGroup={handleDeleteGroup}
                setIsCreateGroupOpen={setIsCreateGroupOpen}
              />
            )}

            {activeTab === 'balances' && (
              <BalancesTab
                user={user}
                balances={balances}
                settlements={settlements}
                setSelectedSettlement={setSelectedSettlement}
                setIsSettleOpen={setIsSettleOpen}
              />
            )}

            {activeTab === 'expenses' && (
              <ExpensesTab
                activeGroup={activeGroup}
                user={user}
                expenses={expenses}
                balances={balances}
                members={members}
                searchQuery={searchQuery}
                setSearchQuery={setSearchQuery}
                selectedCategoryFilter={selectedCategoryFilter}
                setSelectedCategoryFilter={setSelectedCategoryFilter}
                selectedPayerFilter={selectedPayerFilter}         
                setSelectedPayerFilter={setSelectedPayerFilter}   
                setIsAddExpenseOpen={setIsAddExpenseOpen}
                setSelectedExpense={setSelectedExpense}
                setIsExpenseDetailOpen={setIsExpenseDetailOpen}
                getCategoryEmoji={getCategoryEmoji}
              />
            )}
          </>
        ) : (
          <div className="card-glass p-8 text-center space-y-4 my-12">
            <div className="w-12 h-12 bg-emerald-500/10 border border-emerald-500/20 rounded-2xl flex items-center justify-center text-emerald-400 mx-auto">
              <span className="text-xl">👥</span>
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

      {/* NAVIGAZIONE MOBILE */}
      {activeGroup && (
        <Navigation
          activeTab={activeTab}
          setActiveTab={setActiveTab}
          onAddExpense={() => setIsAddExpenseOpen(true)}
          onAddMember={() => setIsShareGroupOpen(true)}
          onCreateGroup={() => setIsCreateGroupOpen(true)}
        />
      )}

      {/* MODALI */}
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
            members={members}
            onExpenseAdded={() => loadExpenses(activeGroup.id)}
          />

          <ExpenseDetailModal
            isOpen={isExpenseDetailOpen}
            onClose={() => setIsExpenseDetailOpen(false)}
            expense={selectedExpense}
            currentUserId={user.id}
            members={members}
            onExpenseUpdated={() => loadExpenses(activeGroup.id)}
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
            currentUserId={user.id}
            settlement={selectedSettlement}
            onSettled={() => loadExpenses(activeGroup.id)}
          />
        </>
      )}
    </div>
  )
}