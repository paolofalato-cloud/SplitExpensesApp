import { useState, useEffect } from 'react'
import { addExpense } from '../lib/expenses'
import { X, Receipt, Euro, Users } from 'lucide-react'
import { toast } from 'sonner'
import type { GroupMember } from '../lib/groups'

interface AddExpenseModalProps {
  isOpen: boolean
  onClose: () => void
  groupId: string
  currentUserId: string
  members: GroupMember[]
  onExpenseAdded: () => void
}

export default function AddExpenseModal({
  isOpen,
  onClose,
  groupId,
  currentUserId,
  members,
  onExpenseAdded,
}: AddExpenseModalProps) {
  const [description, setDescription] = useState('')
  const [amount, setAmount] = useState('')
  const [category, setCategory] = useState('food')
  const [loading, setLoading] = useState(false)
  
  // Toggle per dividere con tutti oppure selezionare manualmente
  const [isCustomSplit, setIsCustomSplit] = useState(false)
  const [selectedSplitMembers, setSelectedSplitMembers] = useState<string[]>([])

  useEffect(() => {
    if (isOpen && members.length > 0) {
      setSelectedSplitMembers(members.map((m) => m.user_id))
      setIsCustomSplit(false)
    }
  }, [isOpen, members])

  if (!isOpen) return null

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    const parsedAmount = parseFloat(amount)

    if (!description.trim() || isNaN(parsedAmount) || parsedAmount <= 0) {
      toast.error('Inserisci una descrizione e un importo validi')
      return
    }

    // Se il toggle non è attivo, dividiamo con tutti i membri del gruppo
    const finalSplitMembers = isCustomSplit
      ? selectedSplitMembers
      : members.map((m) => m.user_id)

    if (finalSplitMembers.length === 0) {
      toast.error('Seleziona almeno un partecipante per la divisione')
      return
    }

    setLoading(true)

    const success = await addExpense(
      groupId,
      description.trim(),
      parsedAmount,
      currentUserId,
      finalSplitMembers,
      category
    )
    setLoading(false)

    if (success) {
      toast.success('Spesa registrata! 💸', {
        description: `${description.trim()} - €${parsedAmount.toFixed(2)}`,
      })

      setDescription('')
      setAmount('')
      setIsCustomSplit(false)
      onExpenseAdded()
      onClose()
    } else {
      toast.error('Errore durante il salvataggio della spesa', {
        description: 'Riprova tra qualche istante',
      })
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

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-sm">
      <div className="w-full max-w-md bg-slate-900 border border-slate-800 rounded-3xl p-6 shadow-2xl relative max-h-[90vh] overflow-y-auto">
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
              <option value="transport">🚗 Auto & Trasporti</option>
              <option value="kids">👶 Bambini & Scuola</option>
              <option value="health">🏥 Salute & Farmacia</option>
              <option value="home">🏠 Casa & Bollette</option>
              <option value="pets">🐾 Animali Domestici</option>
              <option value="shopping">🛍️ Shopping & Abbigliamento</option>
              <option value="leisure">🎉 Svago & Intrattenimento</option>
              <option value="travel">🏖️ Viaggi & Vacanze</option>
              <option value="general">📦 Altro</option>
            </select>
          </div>

          {/* Toggle e Selezione Personalizzata Membri */}
          <div className="bg-slate-950 p-3 rounded-2xl border border-slate-800 space-y-2.5">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2 text-xs font-semibold text-slate-300">
                <Users size={15} className="text-emerald-400" />
                <span>Dividi con tutti i membri ({members.length})</span>
              </div>
              <button
                type="button"
                onClick={() => setIsCustomSplit(!isCustomSplit)}
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

            {isCustomSplit && (
              <div className="pt-2 border-t border-slate-800/80 space-y-1.5 max-h-36 overflow-y-auto">
                <p className="text-[11px] text-slate-400 pb-1">Seleziona chi partecipa a questa spesa:</p>
                {members.map((member) => {
                  const isSelected = selectedSplitMembers.includes(member.user_id)
                  return (
                    <button
                      type="button"
                      key={member.user_id}
                      onClick={() => toggleMemberSplit(member.user_id)}
                      className={`w-full flex items-center justify-between p-2 rounded-lg text-xs transition ${
                        isSelected
                          ? 'bg-emerald-500/10 text-emerald-400 font-semibold border border-emerald-500/20'
                          : 'text-slate-400 hover:bg-slate-900'
                      }`}
                    >
                      <span>{member.full_name} {member.user_id === currentUserId && '(Tu)'}</span>
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