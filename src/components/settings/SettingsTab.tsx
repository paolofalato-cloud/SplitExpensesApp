import React from 'react'
import type { User } from '@supabase/supabase-js'
import type { Group } from '../../lib/groups'
import {
  Settings,
  FolderPlus,
  Save,
  Bell,
  BellCheck,
  LogOut as LeaveIcon,
  Trash2 as DeleteIcon,
} from 'lucide-react'

interface SettingsTabProps {
  activeGroup: Group
  user: User
  editGroupName: string
  setEditGroupName: (name: string) => void
  editGroupCurrency: string
  setEditGroupCurrency: (currency: string) => void
  isSavingGroup: boolean
  handleUpdateGroup: (e: React.FormEvent) => void
  isPushSubscribed: boolean
  handleTogglePushNotifications: () => void
  handleLeaveGroup: () => void
  handleDeleteGroup: () => void
  setIsCreateGroupOpen: (isOpen: boolean) => void
}

export default function SettingsTab({
  activeGroup,
  user,
  editGroupName,
  setEditGroupName,
  editGroupCurrency,
  setEditGroupCurrency,
  isSavingGroup,
  handleUpdateGroup,
  isPushSubscribed,
  handleTogglePushNotifications,
  handleLeaveGroup,
  handleDeleteGroup,
  setIsCreateGroupOpen,
}: SettingsTabProps) {
  return (
    <div className="space-y-6 pb-6">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Settings size={20} className="text-emerald-400" />
          <h2 className="text-base font-bold text-white">Opzioni Gruppo</h2>
        </div>

        <button
          onClick={() => setIsCreateGroupOpen(true)}
          className="text-xs font-semibold text-emerald-400 hover:text-emerald-300 bg-emerald-500/10 hover:bg-emerald-500/20 border border-emerald-500/20 px-3 py-1.5 rounded-xl transition flex items-center gap-1.5"
        >
          <FolderPlus size={14} /> + Nuovo Gruppo
        </button>
      </div>

      {/* Form Informazioni */}
      <form onSubmit={handleUpdateGroup} className="card-glass p-5 space-y-4">
        <h3 className="text-xs font-bold uppercase tracking-wider text-slate-400 border-b border-slate-800/80 pb-2">
          Informazioni di Base
        </h3>

        <div className="space-y-3">
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
        </div>

        <button
          type="submit"
          disabled={isSavingGroup}
          className="btn-primary w-full text-xs py-2.5 flex items-center justify-center gap-2 mt-2"
        >
          <Save size={16} />
          {isSavingGroup ? 'Salvataggio...' : 'Salva Modifiche'}
        </button>
      </form>

      {/* Notifiche Push */}
      <div className="card-glass p-5 space-y-4">
        <h3 className="text-xs font-bold uppercase tracking-wider text-slate-400 border-b border-slate-800/80 pb-2">
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

      {/* Zona Pericolo */}
      <div className="card-glass p-5 space-y-4 border-rose-500/10">
        <h3 className="text-xs font-bold uppercase tracking-wider text-rose-400/80 border-b border-slate-800/80 pb-2">
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
  )
}