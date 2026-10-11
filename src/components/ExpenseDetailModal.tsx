import { useState, useEffect } from 'react'
import { deleteExpense, updateExpense } from '../lib/expenses'
import { X, Trash2, Calendar, User, Edit2, Save, Euro, Receipt, AlertTriangle, Users } from 'lucide-react'
import type { Expense } from '../lib/expenses'
import { toast } from 'sonner'

export interface Member {
  id?: string
  user_id?: string
  full_name?: string
  email?: string
}

interface ExpenseDetailModalProps {
  isOpen: boolean
  onClose: () => void
  expense: Expense | null
  currentUserId: string
  members: Member[]
  onExpenseUpdated: () => void
}

export default function ExpenseDetailModal({
  isOpen,
  onClose,
  expense,
  currentUserId,
  members,
  onExpenseUpdated,
}: ExpenseDetailModalProps) {
  const [isEditing, setIsEditing] = useState(false)
  const [isConfirmingDelete, setIsConfirmingDelete] = useState(false)
  const [description, setDescription] = useState('')
  const [amount, setAmount] = useState('')
  const [category, setCategory] = useState('general')
  const [loading, setLoading] = useState(false)

  const [isCustomSplit, setIsCustomSplit] = useState(false)
  const [selectedSplitMembers, setSelectedSplitMembers] = useState<string[]>([])

  useEffect(() => {
    if (expense) {
      setDescription(expense.description)
      setAmount(expense.amount.toString())
      setCategory(expense.category || 'general')
      setIsEditing(false)
      setIsConfirmingDelete(false)

      const allMemberIds = members.map((m) => m.user_id || m.id).filter(Boolean) as string[]
      const expenseMemberIds = expense.memberIds || allMemberIds

      // Se il numero di partecipanti è inferiore al totale, attiviamo la modalità ridotta
      if (expenseMemberIds.length > 0 && expenseMemberIds.length < allMemberIds.length) {
        setIsCustomSplit(true)
        setSelectedSplitMembers(expenseMemberIds)
      } else {
        setIsCustomSplit(false)
        setSelectedSplitMembers(allMemberIds)
      }
    }
  }, [expense, members])

  if (!isOpen || !expense) return null

  const isPayer = expense.paid_by === currentUserId
  const payerMember = members.find((m) => (m.user_id || m.id) === expense.paid_by)
  const payerName = isPayer ? 'Tu' : payerMember?.full_name || 'Un partecipante'

  const handleDelete = async () => {
    setLoading(true)
    const success = await deleteExpense(expense.id)
    setLoading(false)

    if (success) {
      toast.success('Spesa eliminata! 🗑️')
      await onExpenseUpdated()
      onClose()
    } else {
      toast.error('Errore durante l\'eliminazione della spesa')
    }
  }

  const toggleMemberSplit = (userId: string) => {
    if (selectedSplitMembers.includes(userId)) {
      if (selectedSplitMembers.length === 1) {
        toast.error('La spesa deve essere divisa almeno tra una persona')
        return
      }
      setSelectedSplitMembers(selectedSplitMembers.filter((id) => id !== userId))
    } else {
      setSelectedSplitMembers([...selectedSplitMembers, userId])
    }
  }

  const handleUpdate = async (e: React.FormEvent) => {
    e.preventDefault()
    const parsedAmount = parseFloat(amount)

    if (!description.trim() || isNaN(parsedAmount) || parsedAmount <= 0) {
      toast.error('Inserisci una descrizione e un importo validi')
      return
    }

    const allMemberIds = members.map((m) => m.user_id || m.id).filter(Boolean) as string[]
    const finalSplitMembers = isCustomSplit
      ? selectedSplitMembers
      : (allMemberIds.length > 0 ? allMemberIds : [expense.paid_by])

    if (finalSplitMembers.length === 0) {
      toast.error('Seleziona almeno un partecipante per la divisione')
      return
    }

    setLoading(true)
    const success = await updateExpense(
      expense.id,
      description.trim(),
      parsedAmount,
      category,
      finalSplitMembers
    )
    setLoading(false)

    if (success) {
      toast.success('Spesa e saldi aggiornati! ✨')
      
      expense.description = description.trim()
      expense.amount = parsedAmount
      expense.category = category
      expense.memberIds = finalSplitMembers

      setIsEditing(false)
      await onExpenseUpdated()
      onClose()
    } else {
      toast.error('Errore durante l\'aggiornamento della spesa')
    }
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-sm">
      <div className="w-full max-w-md bg-slate-900 border border-slate-800 rounded-3xl p-6 shadow-2xl relative max-h-[90vh] overflow-y-auto space-y-5">
        <button
          onClick={onClose}
          className="absolute top-5 right-5 p-2 text-slate-400 hover:text-white rounded-xl bg-slate-800/50 hover:bg-slate-800 transition"
        >
          <X size={18} />
        </button>

        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-2xl bg-emerald-500/10 border border-emerald-500/20 flex items-center justify-center text-emerald-400">
            <Receipt size={20} />
          </div>
          <div>
            <h3 className="text-lg font-bold text-white">
              {isEditing ? 'Modifica Spesa' : 'Dettaglio Spesa'}
            </h3>
            <p className="text-xs text-slate-400">
              Registrata il {new Date(expense.created_at).toLocaleDateString('it-IT', {
                day: 'numeric',
                month: 'long',
                year: 'numeric',
              })}
            </p>
          </div>
        </div>

        {isConfirmingDelete ? (
          <div className="bg-rose-500/10 border border-rose-500/20 rounded-2xl p-5 space-y-4 text-center">
            <div className="w-12 h-12 rounded-full bg-rose-500/20 text-rose-400 flex items-center justify-center mx-auto">
              <AlertTriangle size={24} />
            </div>
            <div>
              <h4 className="text-base font-bold text-white">Sei sicuro di voler eliminare?</h4>
              <p className="text-xs text-slate-400 mt-1">
                La spesa "{expense.description}" di €{Number(expense.amount).toFixed(2)} verrà rimossa permanentemente e i saldi ricalcolati.
              </p>
            </div>
            <div className="flex gap-3 pt-2">
              <button
                type="button"
                onClick={() => setIsConfirmingDelete(false)}
                className="btn-secondary flex-1 text-xs py-2.5"
              >
                Annulla
              </button>
              <button
                type="button"
                onClick={handleDelete}
                disabled={loading}
                className="px-4 py-2.5 bg-rose-500 hover:bg-rose-600 text-white font-bold rounded-xl text-xs transition flex-1 flex items-center justify-center gap-1.5 disabled:opacity-50"
              >
                <Trash2 size={15} />
                {loading ? 'Eliminazione...' : 'Sì, Elimina'}
              </button>
            </div>
          </div>
        ) : isEditing ? (
          <form onSubmit={handleUpdate} className="space-y-4">
            <div>
              <label className="block text-xs text-slate-400 font-medium mb-1.5">
                Descrizione
              </label>
              <input
                type="text"
                required
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                placeholder="es. Cena Pizzeria, Spesa..."
                className="w-full bg-slate-950 border border-slate-800 rounded-xl px-4 py-3 text-white placeholder-slate-600 focus:outline-none focus:border-emerald-500 transition text-sm"
              />
            </div>

            <div>
              <label className="block text-xs text-slate-400 font-medium mb-1.5">
                Importo (€)
              </label>
              <div className="relative">
                <input
                  type="number"
                  step="0.01"
                  required
                  value={amount}
                  onChange={(e) => setAmount(e.target.value)}
                  placeholder="0.00"
                  className="w-full bg-slate-950 border border-slate-800 rounded-xl pl-10 pr-4 py-3 text-white placeholder-slate-600 focus:outline-none focus:border-emerald-500 transition text-sm"
                />
                <Euro size={16} className="absolute left-3.5 top-3.5 text-slate-500" />
              </div>
            </div>

            <div>
              <label className="block text-xs text-slate-400 font-medium mb-1.5">
                Categoria
              </label>
              <select
                value={category}
                onChange={(e) => setCategory(e.target.value)}
                className="w-full bg-slate-950 border border-slate-800 rounded-xl px-4 py-3 text-white focus:outline-none focus:border-emerald-500 transition text-sm"
              >
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
                <option value="general">📦 Altro</option>
              </select>
            </div>

            <div className="bg-slate-950 p-3 rounded-2xl border border-slate-800 space-y-2.5">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2 text-xs font-semibold text-slate-300">
                  <Users size={15} className="text-emerald-400" />
                  <span>
                    {isCustomSplit
                      ? `Dividi con ${selectedSplitMembers.length} di ${members.length} membri`
                      : `Divisa equamente con tutti (${members.length})`}
                  </span>
                </div>
                <button
                  type="button"
                  onClick={() => {
                    const nextState = !isCustomSplit
                    setIsCustomSplit(nextState)
                    if (!nextState) {
                      const allIds = members.map((m) => (m.user_id || m.id) as string).filter(Boolean)
                      setSelectedSplitMembers(allIds)
                    }
                  }}
                  className={`relative inline-flex h-5 w-9 shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus:outline-none ${
                    isCustomSplit ? 'bg-emerald-500' : 'bg-slate-800'
                  }`}
                >
                  <span
                    className={`pointer-events-none inline-block h-4 w-4 transform rounded-full bg-white shadow ring-0 transition duration-200 ease-in-out ${
                      isCustomSplit ? 'translate-x-4' : 'translate-x-0'
                    }`}
                  />
                </button>
              </div>

              <div className="text-[11px] text-slate-500 flex justify-between items-center">
                <span>Seleziona un numero ridotto di persone</span>
                {isCustomSplit && (
                  <button
                    type="button"
                    onClick={() => {
                      const allIds = members.map((m) => (m.user_id || m.id) as string).filter(Boolean)
                      setSelectedSplitMembers(allIds)
                    }}
                    className="text-emerald-400 font-medium hover:underline text-[10px]"
                  >
                    Seleziona tutti
                  </button>
                )}
              </div>

              {isCustomSplit && (
                <div className="pt-2 border-t border-slate-800/80 space-y-1.5 max-h-36 overflow-y-auto">
                  {members.map((member) => {
                    const mId = (member.user_id || member.id) as string
                    const isSelected = selectedSplitMembers.includes(mId)
                    return (
                      <button
                        type="button"
                        key={mId}
                        onClick={() => toggleMemberSplit(mId)}
                        className={`w-full flex items-center justify-between p-2 rounded-lg text-xs transition ${
                          isSelected
                            ? 'bg-emerald-500/10 text-emerald-400 font-semibold border border-emerald-500/20'
                            : 'text-slate-400 hover:bg-slate-900'
                        }`}
                      >
                        <span>{member.full_name} {mId === currentUserId && '(Tu)'}</span>
                        <span className={`w-4 h-4 rounded-md border flex items-center justify-center text-[10px] ${
                          isSelected ? 'bg-emerald-500 border-emerald-500 text-slate-950 font-bold' : 'border-slate-700'
                        }`}>
                          {isSelected ? '✓' : ''}
                        </span>
                      </button>
                    )
                  })}
                </div>
              )}
            </div>

            <div className="flex gap-3 pt-3">
              <button
                type="button"
                onClick={() => setIsEditing(false)}
                className="btn-secondary flex-1 text-xs py-2.5"
              >
                Annulla
              </button>
              <button
                type="submit"
                disabled={loading || !description.trim() || !amount}
                className="btn-primary flex-1 text-xs py-2.5 flex items-center justify-center gap-1.5 disabled:opacity-50"
              >
                <Save size={15} />
                {loading ? 'Salvataggio...' : 'Salva Modifiche'}
              </button>
            </div>
          </form>
        ) : (
          <>
            <div className="space-y-1">
              <span className="text-[10px] uppercase font-extrabold tracking-wider text-emerald-400 bg-emerald-500/10 border border-emerald-500/20 px-2.5 py-1 rounded-full inline-block">
                {expense.category || 'Generale'}
              </span>
              <h3 className="text-xl font-extrabold text-white">{expense.description}</h3>
              <p className="text-3xl font-black text-white pt-1">
                € {Number(expense.amount).toFixed(2)}
              </p>
            </div>

            <div className="bg-slate-950/60 border border-slate-800 rounded-2xl p-4 space-y-3 text-xs text-slate-300">
              <div className="flex items-center justify-between">
                <span className="text-slate-400 flex items-center gap-1.5">
                  <User size={14} className="text-slate-500" /> Pagato da
                </span>
                <span className="font-semibold text-white">
                  {payerName}
                </span>
              </div>

              <div className="flex items-center justify-between pt-2 border-t border-slate-800/60">
                <span className="text-slate-400 flex items-center gap-1.5">
                  <Calendar size={14} className="text-slate-500" /> Data
                </span>
                <span className="font-medium text-slate-200">
                  {new Date(expense.created_at).toLocaleDateString('it-IT', {
                    day: 'numeric',
                    month: 'long',
                    year: 'numeric',
                  })}
                </span>
              </div>
            </div>

            <div className="flex gap-3 pt-2">
              <button
                type="button"
                onClick={onClose}
                className="btn-secondary flex-1 text-xs py-2.5"
              >
                Chiudi
              </button>

              {isPayer && (
                <>
                  <button
                    type="button"
                    onClick={() => setIsEditing(true)}
                    className="px-3.5 py-2.5 bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-700 rounded-xl text-xs font-bold transition flex items-center justify-center gap-1.5"
                  >
                    <Edit2 size={15} />
                    Modifica
                  </button>

                  <button
                    type="button"
                    onClick={() => setIsConfirmingDelete(true)}
                    disabled={loading}
                    className="px-3.5 py-2.5 bg-rose-500/10 hover:bg-rose-500/20 text-rose-400 border border-rose-500/30 rounded-xl text-xs font-bold transition flex items-center justify-center gap-1.5 disabled:opacity-50"
                  >
                    <Trash2 size={15} />
                    Elimina
                  </button>
                </>
              )}
            </div>
          </>
        )}
      </div>
    </div>
  )
}