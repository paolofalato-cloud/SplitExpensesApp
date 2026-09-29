import { useState } from 'react'
import { addExpense } from '../lib/expenses'
import { X, Receipt, Euro } from 'lucide-react'
import { toast } from 'sonner'

interface AddExpenseModalProps {
  isOpen: boolean
  onClose: () => void
  groupId: string
  currentUserId: string
  onExpenseAdded: () => void
}

export default function AddExpenseModal({
  isOpen,
  onClose,
  groupId,
  currentUserId,
  onExpenseAdded,
}: AddExpenseModalProps) {
  const [description, setDescription] = useState('')
  const [amount, setAmount] = useState('')
  const [category, setCategory] = useState('food')
  const [loading, setLoading] = useState(false)

  if (!isOpen) return null

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    const parsedAmount = parseFloat(amount)

    if (!description.trim() || isNaN(parsedAmount) || parsedAmount <= 0) {
      toast.error('Inserisci una descrizione e un importo validi')
      return
    }

    setLoading(true)
    // Per ora dividiamo tra l'utente corrente (puoi estendere a tutti i membri)
    const success = await addExpense(
      groupId,
      description.trim(),
      parsedAmount,
      currentUserId,
      [currentUserId],
      category
    )
    setLoading(false)

    if (success) {
      // Notifica in-app di successo
      toast.success('Spesa registrata! 💸', {
        description: `${description.trim()} - €${parsedAmount.toFixed(2)}`,
      })

      setDescription('')
      setAmount('')
      onExpenseAdded()
      onClose()
    } else {
      // Notifica in-app di errore
      toast.error('Errore durante il salvataggio della spesa', {
        description: 'Riprova tra qualche istante',
      })
    }
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-sm">
      <div className="w-full max-w-md bg-slate-900 border border-slate-800 rounded-3xl p-6 shadow-2xl relative">
        <button
          onClick={onClose}
          className="absolute top-5 right-5 p-2 text-slate-400 hover:text-white rounded-xl bg-slate-800/50 hover:bg-slate-800 transition"
        >
          <X size={18} />
        </button>

        <div className="flex items-center gap-3 mb-5">
          <div className="w-10 h-10 rounded-2xl bg-emerald-500/10 border border-emerald-500/20 flex items-center justify-center text-emerald-400">
            <Receipt size={20} />
          </div>
          <div>
            <h3 className="text-lg font-bold text-white">Aggiungi Spesa</h3>
            <p className="text-xs text-slate-400">Inserisci i dettagli del pagamento</p>
          </div>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-xs text-slate-400 font-medium mb-1.5">Descrizione</label>
            <input
              type="text"
              required
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="es. Cena Pizzeria, Spesa, Benzina..."
              className="w-full bg-slate-950 border border-slate-800 rounded-xl px-4 py-3 text-white placeholder-slate-600 focus:outline-none focus:border-emerald-500 transition text-sm"
            />
          </div>

          <div>
            <label className="block text-xs text-slate-400 font-medium mb-1.5">Importo (€)</label>
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
            <label className="block text-xs text-slate-400 font-medium mb-1.5">Categoria</label>
            <select
              value={category}
              onChange={(e) => setCategory(e.target.value)}
              className="w-full bg-slate-950 border border-slate-800 rounded-xl px-4 py-3 text-white focus:outline-none focus:border-emerald-500 transition text-sm"
            >
              <option value="food">🍕 Cibo & Ristoranti</option>
              <option value="groceries">🛒 Supermercato</option>
              <option value="transport">🚗 Trasporti & Viaggi</option>
              <option value="home">🏠 Casa & Bollette</option>
              <option value="leisure">🎉 Svago & Intrattenimento</option>
              <option value="general">📦 Altro</option>
            </select>
          </div>

          <div className="flex gap-3 pt-2">
            <button
              type="button"
              onClick={onClose}
              className="btn-secondary flex-1 text-sm py-2.5"
            >
              Annulla
            </button>
            <button
              type="submit"
              disabled={loading || !description.trim() || !amount}
              className="btn-primary flex-1 text-sm py-2.5 disabled:opacity-50"
            >
              {loading ? 'Salvataggio...' : 'Salva Spesa'}
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}