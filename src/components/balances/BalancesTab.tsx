import type { User } from '@supabase/supabase-js'
import type { MemberBalance, SettlementTransaction } from '../../lib/balances'
import { Scale, ArrowRight, CheckCircle2, ShieldCheck } from 'lucide-react'

interface BalancesTabProps {
  user: User
  balances: MemberBalance[]
  settlements: SettlementTransaction[]
  setSelectedSettlement: (st: SettlementTransaction) => void
  setIsSettleOpen: (isOpen: boolean) => void
}

export default function BalancesTab({
  user,
  balances,
  settlements,
  setSelectedSettlement,
  setIsSettleOpen,
}: BalancesTabProps) {
  return (
    <div className="space-y-6">
      {/* SEZIONE TRANSAZIONI CONSIGLIATE PER SALDARE */}
      <div>
        <h2 className="text-base font-bold text-white mb-3 flex items-center gap-2">
          <Scale size={18} className="text-emerald-400" /> Modo più rapido per saldare
        </h2>

        {settlements.length > 0 ? (
          <div className="space-y-2.5">
            {settlements.map((st, idx) => {
              // Verifichiamo se l'utente corrente è coinvolto direttamente in questo rimborso
              const isUserPayer = st.fromUserId === user.id
              const isUserPayee = st.toUserId === user.id

              return (
                <div
                  key={idx}
                  className={`p-4 rounded-2xl border flex items-center justify-between gap-3 transition ${
                    isUserPayer
                      ? 'bg-rose-500/10 border-rose-500/30'
                      : isUserPayee
                      ? 'bg-emerald-500/10 border-emerald-500/30'
                      : 'bg-slate-900 border-slate-800'
                  }`}
                >
                  <div className="space-y-1">
                    <div className="flex items-center gap-2 text-sm text-slate-200">
                      <span className={`font-bold ${isUserPayer ? 'text-rose-400 underline' : 'text-slate-300'}`}>
                        {isUserPayer ? 'Tu' : st.fromName}
                      </span>
                      <ArrowRight size={14} className="text-slate-500 shrink-0" />
                      <span className={`font-bold ${isUserPayee ? 'text-emerald-400 underline' : 'text-slate-300'}`}>
                        {isUserPayee ? 'Tu' : st.toName}
                      </span>
                    </div>
                    <p className="text-[11px] text-slate-400">
                      {isUserPayer
                        ? 'Devi effettuare questo saldo'
                        : isUserPayee
                        ? 'In attesa di ricezione'
                        : 'Transazione consigliata nel gruppo'}
                    </p>
                  </div>

                  <div className="flex items-center gap-3 shrink-0">
                    <span className="font-extrabold text-white text-base">
                      € {st.amount.toFixed(2)}
                    </span>
                    <button
                      onClick={() => {
                        setSelectedSettlement(st)
                        setIsSettleOpen(true)
                      }}
                      className={`text-xs py-2 px-3.5 font-bold rounded-xl transition shadow-md ${
                        isUserPayer
                          ? 'bg-rose-500 hover:bg-rose-600 text-white shadow-rose-500/20'
                          : 'btn-primary'
                      }`}
                    >
                      {isUserPayer ? 'Paga ora' : isUserPayee ? 'Conferma ricezione' : 'Salda'}
                    </button>
                  </div>
                </div>
              )
            })}
          </div>
        ) : (
          <div className="card-glass p-8 text-center space-y-2">
            <CheckCircle2 size={36} className="text-emerald-400 mx-auto" />
            <p className="text-sm font-bold text-white">Tutti i saldi sono in pareggio!</p>
            <p className="text-xs text-slate-400">Non ci sono debiti pendenti all'interno del gruppo.</p>
          </div>
        )}
      </div>

      {/* RIEPILOGO DETTAGLIATO PARTECIPANTI */}
      <div>
        <h3 className="text-xs font-bold uppercase tracking-wider text-slate-400 mb-3 px-1">
          Riepilogo Partecipanti
        </h3>
        <div className="space-y-2">
          {balances.map((b) => {
            const isMe = b.userId === user.id
            return (
              <div
                key={b.userId}
                className={`p-4 rounded-2xl border flex items-center justify-between transition ${
                  isMe
                    ? 'bg-slate-900 border-emerald-500/30 shadow-lg shadow-emerald-500/5'
                    : 'bg-slate-900/60 border-slate-800/80'
                }`}
              >
                <div className="space-y-0.5">
                  <div className="flex items-center gap-2">
                    <p className="font-bold text-sm text-slate-100">
                      {b.fullName} {isMe && '(Tu)'}
                    </p>
                    {isMe && (
                      <span className="px-2 py-0.5 rounded-md text-[10px] font-bold bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
                        Il tuo bilancio
                      </span>
                    )}
                  </div>
                  <p className="text-[11px] text-slate-400 font-medium">
                    Speso totale: <span className="text-slate-200">€ {b.paidTotal.toFixed(2)}</span> | Quota dovuta: <span className="text-slate-200">€ {b.owedTotal.toFixed(2)}</span>
                  </p>
                </div>

                <div className="text-right shrink-0">
                  {b.netBalance > 0 ? (
                    <span className="text-sm font-extrabold text-emerald-400">
                      + € {b.netBalance.toFixed(2)}
                    </span>
                  ) : b.netBalance < 0 ? (
                    <span className="text-sm font-extrabold text-rose-400">
                      - € {Math.abs(b.netBalance).toFixed(2)}
                    </span>
                  ) : (
                    <span className="text-xs font-semibold text-slate-500 flex items-center gap-1 justify-end">
                      <ShieldCheck size={13} /> Pareggiato
                    </span>
                  )}
                </div>
              </div>
            )
          })}
        </div>
      </div>
    </div>
  )
}