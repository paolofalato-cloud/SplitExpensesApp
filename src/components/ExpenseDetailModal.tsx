import { useState } from 'react'
import { deleteExpense } from '../lib/expenses'
import { X, Trash2, Calendar, User } from 'lucide-react'
import type { Expense } from '../lib/expenses'

interface ExpenseDetailModalProps {
  isOpen: boolean
  onClose: () => void
  expense: Expense | null
  currentUserId: string
  onExpenseDeleted: () => void
}

export default function ExpenseDetailModal({
  isOpen,
  onClose,
  expense,
  currentUserId,
  onExpenseDeleted,
}: ExpenseDetailModalProps) {
  const [loading, setLoading] = useState(false)

  if (!isOpen || !expense) return null

  const isPayer = expense.paid_by === currentUserId

  const handleDelete = async () => {
    if (!confirm('Sei sicuro di voler eliminare questa spesa?')) return

    setLoading(true)
    const success = await deleteExpense(expense.id)
    setLoading(false)

    if (success) {
      onExpenseDeleted()
      onClose()
    }
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-sm">
      <div className="w-full max-w-md bg-slate-900 border border-slate-800 rounded-3xl p-6 shadow-2xl relative space-y-5">
        <button
          onClick={onClose}
          className="absolute top-5 right-5 p-2 text-slate-400 hover:text-white rounded-xl bg-slate-800/50 hover:bg-slate-800 transition"
        >
          <X size={18} />
        </button>

        {/* Intestazione Spesa */}
        <div className="space-y-1">
          <span className="text-[10px] uppercase font-extrabold tracking-wider text-emerald-400 bg-emerald-500/10 border border-emerald-500/20 px-2.5 py-1 rounded-full inline-block">
            {expense.category}
          </span>
          <h3 className="text-xl font-extrabold text-white">{expense.description}</h3>
          <p className="text-3xl font-black text-white pt-1">
            € {Number(expense.amount).toFixed(2)}
          </p>
        </div>

        {/* Informazioni Principali */}
        <div className="bg-slate-950/60 border border-slate-800 rounded-2xl p-4 space-y-3 text-xs text-slate-300">
          <div className="flex items-center justify-between">
            <span className="text-slate-400 flex items-center gap-1.5">
              <User size={14} className="text-slate-500" /> Pagato da
            </span>
            <span className="font-semibold text-white">
              {isPayer ? 'Tu' : 'Un partecipante'}
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

        {/* Pulsante Elimina Spesa (visibile solo se chi visualizza è chi ha pagato o ha creato) */}
        <div className="flex gap-3 pt-2">
          <button
            type="button"
            onClick={onClose}
            className="btn-secondary flex-1 text-xs py-2.5"
          >
            Chiudi
          </button>

          {isPayer && (
            <button
              onClick={handleDelete}
              disabled={loading}
              className="px-4 py-2.5 bg-rose-500/10 hover:bg-rose-500/20 text-rose-400 border border-rose-500/30 rounded-xl text-xs font-bold transition flex items-center justify-center gap-1.5 disabled:opacity-50"
            >
              <Trash2 size={15} />
              {loading ? 'Eliminazione...' : 'Elimina Spesa'}
            </button>
          )}
        </div>
      </div>
    </div>
  )
}