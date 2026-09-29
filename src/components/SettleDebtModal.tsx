import { useState } from 'react'
import { addSettlement } from '../lib/expenses'
import { X, CheckCircle, ArrowRight } from 'lucide-react'
import type { SettlementTransaction } from '../lib/balances'

interface SettleDebtModalProps {
  isOpen: boolean
  onClose: () => void
  groupId: string
  settlement: SettlementTransaction | null
  onSettled: () => void
}

export default function SettleDebtModal({
  isOpen,
  onClose,
  groupId,
  settlement,
  onSettled,
}: SettleDebtModalProps) {
  const [loading, setLoading] = useState(false)

  if (!isOpen || !settlement) return null

  const handleSettle = async () => {
    setLoading(true)
    const success = await addSettlement(
      groupId,
      settlement.fromUserId,
      settlement.toUserId,
      settlement.amount
    )
    setLoading(false)

    if (success) {
      onSettled()
      onClose()
    }
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-sm">
      <div className="w-full max-w-md bg-slate-900 border border-slate-800 rounded-3xl p-6 shadow-2xl relative text-center">
        <button
          onClick={onClose}
          className="absolute top-5 right-5 p-2 text-slate-400 hover:text-white rounded-xl bg-slate-800/50 hover:bg-slate-800 transition"
        >
          <X size={18} />
        </button>

        <div className="w-12 h-12 rounded-2xl bg-emerald-500/10 border border-emerald-500/20 flex items-center justify-center text-emerald-400 mx-auto mb-3">
          <CheckCircle size={24} />
        </div>

        <h3 className="text-xl font-bold text-white mb-1">Registra Rimborso</h3>
        <p className="text-xs text-slate-400 mb-6">
          Conferma che il pagamento di pareggio è stato inviato ed effettuato.
        </p>

        {/* Box Dettaglio Pagamento */}
        <div className="bg-slate-950 border border-slate-800 rounded-2xl p-4 mb-6 space-y-3">
          <div className="flex items-center justify-between text-sm font-semibold">
            <span className="text-rose-400">{settlement.fromName}</span>
            <ArrowRight size={16} className="text-slate-500" />
            <span className="text-emerald-400">{settlement.toName}</span>
          </div>
          <p className="text-2xl font-black text-white">€ {settlement.amount.toFixed(2)}</p>
        </div>

        <div className="flex gap-3">
          <button
            type="button"
            onClick={onClose}
            className="btn-secondary flex-1 text-sm py-2.5"
          >
            Annulla
          </button>
          <button
            onClick={handleSettle}
            disabled={loading}
            className="btn-primary flex-1 text-sm py-2.5 disabled:opacity-50"
          >
            {loading ? 'Registrazione...' : 'Conferma Saldo'}
          </button>
        </div>
      </div>
    </div>
  )
}