export default function UIStyleGuide() {
  return (
    <div className="max-w-2xl mx-auto space-y-6 p-4">
      {/* Header del Gruppo */}
      <div className="card-glass p-6">
        <div className="flex items-center justify-between mb-4">
          <div>
            <span className="text-xs font-semibold text-emerald-400 tracking-wider uppercase">Gruppo Attivo</span>
            <h2 className="text-2xl font-bold text-white">Vacanze Estate 🏖️</h2>
          </div>
          <span className="bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 px-3 py-1 rounded-full text-xs font-bold">
            In Pareggio
          </span>
        </div>

        {/* Resoconto Saldi */}
        <div className="grid grid-cols-2 gap-3 mt-4">
          <div className="bg-slate-950/50 p-4 rounded-xl border border-emerald-500/20">
            <p className="text-xs text-slate-400 mb-1">Ti devono in totale</p>
            <p className="text-xl font-extrabold text-emerald-400">+ € 145,00</p>
          </div>
          <div className="bg-slate-950/50 p-4 rounded-xl border border-rose-500/20">
            <p className="text-xs text-slate-400 mb-1">Devi dare in totale</p>
            <p className="text-xl font-extrabold text-rose-400">- € 32,50</p>
          </div>
        </div>
      </div>

      {/* Lista Spese Recenti */}
      <div className="card-glass p-6">
        <h3 className="text-lg font-bold text-white mb-4">Spese Recenti</h3>
        
        <div className="space-y-3">
          {/* Singola Spesa 1 */}
          <div className="flex items-center justify-between p-3.5 bg-slate-950/40 rounded-xl border border-slate-800/60 hover:border-slate-700 transition">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-indigo-500/10 border border-indigo-500/20 flex items-center justify-center text-lg">
                🍕
              </div>
              <div>
                <p className="font-semibold text-sm text-slate-200">Cena Pizzeria</p>
                <p className="text-xs text-slate-400">Pagato da <span className="text-slate-300 font-medium">Marco</span></p>
              </div>
            </div>
            <div className="text-right">
              <p className="font-bold text-sm text-white">€ 64,00</p>
              <p className="text-xs text-rose-400 font-medium">La tua quota: € 16,00</p>
            </div>
          </div>

          {/* Singola Spesa 2 */}
          <div className="flex items-center justify-between p-3.5 bg-slate-950/40 rounded-xl border border-slate-800/60 hover:border-slate-700 transition">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-emerald-500/10 border border-emerald-500/20 flex items-center justify-center text-lg">
                🛒
              </div>
              <div>
                <p className="font-semibold text-sm text-slate-200">Spesa Supermercato</p>
                <p className="text-xs text-slate-400">Pagato da <span className="text-emerald-400 font-medium">Te</span></p>
              </div>
            </div>
            <div className="text-right">
              <p className="font-bold text-sm text-white">€ 85,50</p>
              <p className="text-xs text-emerald-400 font-medium">Ti devono: € 42,75</p>
            </div>
          </div>
        </div>
      </div>

      {/* Pulsanti Azione Rapidi */}
      <div className="flex gap-3">
        <button className="btn-primary flex-1">
          + Aggiungi Spesa
        </button>
        <button className="btn-secondary">
          Salda Debiti
        </button>
      </div>
    </div>
  )
}