
import type { User } from '@supabase/supabase-js'
import type { GroupMember } from '../../lib/groups'
import { Users as UsersIcon, UserPlus } from 'lucide-react'

interface MembersTabProps {
  user: User
  members: GroupMember[]
  setIsShareGroupOpen: (isOpen: boolean) => void
}

export default function MembersTab({ user, members, setIsShareGroupOpen }: MembersTabProps) {
  return (
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
  )
}