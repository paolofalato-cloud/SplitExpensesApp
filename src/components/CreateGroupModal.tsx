import { useState } from 'react'
import { createGroup} from '../lib/groups'
import type { Group } from '../lib/groups'
import { X, Users } from 'lucide-react'

interface CreateGroupModalProps {
  isOpen: boolean
  onClose: () => void
  onGroupCreated: (group: Group) => void
}

export default function CreateGroupModal({ isOpen, onClose, onGroupCreated }: CreateGroupModalProps) {
  const [name, setName] = useState('')
  const [currency, setCurrency] = useState('EUR')
  const [loading, setLoading] = useState(false)

  if (!isOpen) return null

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!name.trim()) return

    setLoading(true)
    const newGroup = await createGroup(name.trim(), currency)
    setLoading(false)

    if (newGroup) {
      setName('')
      onGroupCreated(newGroup)
      onClose()
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
            <Users size={20} />
          </div>
          <div>
            <h3 className="text-lg font-bold text-white">Nuovo Gruppo</h3>
            <p className="text-xs text-slate-400">Crea uno spazio per dividere le spese</p>
          </div>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-xs text-slate-400 font-medium mb-1.5">Nome del Gruppo</label>
            <input
              type="text"
              required
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="es. Vacanze Estate, Casa, Bar..."
              className="w-full bg-slate-950 border border-slate-800 rounded-xl px-4 py-3 text-white placeholder-slate-600 focus:outline-none focus:border-emerald-500 transition text-sm"
            />
          </div>

          <div>
            <label className="block text-xs text-slate-400 font-medium mb-1.5">Valuta</label>
            <select
              value={currency}
              onChange={(e) => setCurrency(e.target.value)}
              className="w-full bg-slate-950 border border-slate-800 rounded-xl px-4 py-3 text-white focus:outline-none focus:border-emerald-500 transition text-sm"
            >
              <option value="EUR">Euro (€)</option>
              <option value="USD">Dollaro ($)</option>
              <option value="GBP">Sterlina (£)</option>
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
              disabled={loading || !name.trim()}
              className="btn-primary flex-1 text-sm py-2.5 disabled:opacity-50"
            >
              {loading ? 'Creazione...' : 'Crea Gruppo'}
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}