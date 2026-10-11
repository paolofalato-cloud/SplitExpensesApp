import type { User } from '@supabase/supabase-js'
import type { Group, GroupMember } from '../../lib/groups'
import type { Expense } from '../../lib/expenses'
import type { MemberBalance } from '../../lib/balances'
import {
  Wallet,
  ArrowDownLeft,
  ArrowUpRight,
  Receipt,
  Plus,
  Search,
  X,
} from 'lucide-react'

interface ExpensesTabProps {
  activeGroup: Group
  user: User
  expenses: Expense[]
  balances: MemberBalance[]
  members: GroupMember[]
  searchQuery: string
  setSearchQuery: (query: string) => void
  selectedCategoryFilter: string
  setSelectedCategoryFilter: (category: string) => void
  selectedPayerFilter: string
  setSelectedPayerFilter: (payer: string) => void
  setIsAddExpenseOpen: (isOpen: boolean) => void
  setSelectedExpense: (expense: Expense) => void
  setIsExpenseDetailOpen: (isOpen: boolean) => void
  getCategoryEmoji: (category: string) => string
}

export default function ExpensesTab({
  activeGroup,
  user,
  expenses,
  balances,
  members,
  searchQuery,
  setSearchQuery,
  selectedCategoryFilter,
  setSelectedCategoryFilter,
  selectedPayerFilter,
  setSelectedPayerFilter,
  setIsAddExpenseOpen,
  setSelectedExpense,
  setIsExpenseDetailOpen,
  getCategoryEmoji,
}: ExpensesTabProps) {
  
  const filteredExpenses = expenses.filter((exp) => {
    const matchesSearch = exp.description.toLowerCase().includes(searchQuery.toLowerCase())
    const matchesCategory = selectedCategoryFilter === 'all' || exp.category === selectedCategoryFilter
    const matchesPayer = selectedPayerFilter === 'all' || exp.paid_by === selectedPayerFilter
    return matchesSearch && matchesCategory && matchesPayer
  })

  const myBalance = balances.find((b) => b.userId === user.id)?.netBalance || 0

  return (
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
                + € {myBalance > 0 ? myBalance.toFixed(2) : '0.00'}
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
                - € {myBalance < 0 ? Math.abs(myBalance).toFixed(2) : '0.00'}
              </p>
            </div>
          </div>
        </div>
      </div>

      <div className="space-y-3 pt-2">
        <div className="flex items-center justify-between px-1">
          <h2 className="text-base font-bold text-white flex items-center gap-2">
            <Receipt size={18} className="text-emerald-400" />
            Spese del Gruppo
          </h2>

          <button
            onClick={() => setIsAddExpenseOpen(true)}
            className="btn-primary text-xs py-1.5 px-3 flex items-center gap-1.5 shadow-md shadow-emerald-500/10"
          >
            <Plus size={15} /> Aggiungi
          </button>
        </div>
                    
        {/* BARRA DI RICERCA E FILTRI (CATEGORIA & PAGATORE) */}
        <div className="flex flex-col gap-2">
          <div className="relative w-full">
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

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
            <select
              value={selectedCategoryFilter}
              onChange={(e) => setSelectedCategoryFilter(e.target.value)}
              className="bg-slate-900 border border-slate-800 rounded-xl px-3 py-2 text-xs text-slate-300 focus:outline-none focus:border-emerald-500 transition"
            >
              <option value="all">📁 Tutte le categorie</option>
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

            <select
              value={selectedPayerFilter}
              onChange={(e) => setSelectedPayerFilter(e.target.value)}
              className="bg-slate-900 border border-slate-800 rounded-xl px-3 py-2 text-xs text-slate-300 focus:outline-none focus:border-emerald-500 transition"
            >
              <option value="all">👤 Pagato da: Tutti</option>
              {members.map((member) => (
                <option key={member.user_id} value={member.user_id}>
                  {member.user_id === user.id ? 'Tu' : member.full_name}
                </option>
              ))}
            </select>
          </div>
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

          const renderExpenseCard = (exp: Expense) => {
            const payerMember = members.find((m) => m.user_id === exp.paid_by)
            const payerName = exp.paid_by === user.id ? 'Tu' : payerMember?.full_name || 'Un partecipante'

            return (
              <div
                key={exp.id}
                onClick={() => {
                  setSelectedExpense(exp)
                  setIsExpenseDetailOpen(true)
                }}
                className="flex items-center justify-between p-4 bg-slate-900/90 rounded-2xl border border-slate-800/80 hover:border-slate-700 transition cursor-pointer active:scale-[0.99]"
              >
                <div className="flex items-center gap-3.5">
                  <div className="w-11 h-11 rounded-2xl bg-slate-800/80 border border-slate-700 flex items-center justify-center text-xl shrink-0">
                    {getCategoryEmoji(exp.category)}
                  </div>
                  <div>
                    <p className="font-semibold text-sm text-slate-100">{exp.description}</p>
                    <p className="text-xs text-slate-400 font-medium mt-0.5">
                      Pagato da <span className="text-slate-200 font-semibold">{payerName}</span>
                    </p>
                    <p className="text-[10px] text-slate-500 mt-0.5">
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
          }

          return (
            <div className="space-y-6">
              {thisMonthList.length > 0 && (
                <div className="space-y-2.5">
                  <h3 className="text-[11px] font-bold uppercase tracking-wider text-slate-400 px-1">
                    Questo Mese ({thisMonthList.length})
                  </h3>
                  {thisMonthList.map(renderExpenseCard)}
                </div>
              )}

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
  )
}