import { useState } from 'react'
import { supabase } from '../lib/supabase'
import { toast } from 'sonner'

export default function Auth() {
  const [loading, setLoading] = useState(false)
  const [isSignUp, setIsSignUp] = useState(false)
  const [isForgotPassword, setIsForgotPassword] = useState(false)
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [fullName, setFullName] = useState('')
  const [message, setMessage] = useState<{ type: 'error' | 'success'; text: string } | null>(null)

  const handleAuth = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    setMessage(null)

    try {
      if (isSignUp) {
        // Registrazione nuovo utente
        const { error } = await supabase.auth.signUp({
          email,
          password,
          options: {
            data: {
              full_name: fullName,
            },
          },
        })
        if (error) throw error
        setMessage({
          type: 'success',
          text: 'Registrazione completata! Controlla la tua email per confermare l\'account o effettua il login.',
        })
      } else {
        // Login utente esistente
        const { error } = await supabase.auth.signInWithPassword({
          email,
          password,
        })
        if (error) {
          toast.error('Credenziali errate o account non trovato', { description: error.message })
        } else {
          toast.success('Bentornato! 👋')
        }
      }
    } catch (err: unknown) {
      const error = err as Error
      setMessage({ type: 'error', text: error.message || 'Si è verificato un errore' })
    } finally {
      setLoading(false)
    }
  }

  // Gestione Recupero Password
  const handleResetPassword = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!email.trim()) {
      toast.error('Inserisci la tua email')
      return
    }

    setLoading(true)
    const { error } = await supabase.auth.resetPasswordForEmail(email, {
      redirectTo: window.location.origin, // Reindirizza l'utente alla PWA dopo il click nella mail
    })
    setLoading(false)

    if (error) {
      toast.error('Errore nell\'invio della mail', { description: error.message })
    } else {
      toast.success('Email di recupero inviata! ✉️', {
        description: 'Controlla la tua casella di posta (inclusa la cartella Spam).',
      })
      setIsForgotPassword(false)
    }
  }
  
  return (
    <div className="min-h-screen bg-slate-900 text-white flex flex-col items-center justify-center p-4">
      <div className="max-w-md w-full bg-slate-800 rounded-2xl p-6 shadow-xl border border-slate-700">
        
        {/* VISTA: Password Dimenticata */}
        {isForgotPassword ? (
          <>
            <h2 className="text-2xl font-bold text-center text-emerald-400 mb-1">
              Recupera Password
            </h2>
            <p className="text-slate-400 text-center text-sm mb-6">
              Inserisci la tua email per ricevere il link di ripristino
            </p>

            {message && (
              <div
                className={`p-3 rounded-xl mb-4 text-sm font-medium ${
                  message.type === 'error'
                    ? 'bg-red-500/10 border border-red-500/20 text-red-400'
                    : 'bg-emerald-500/10 border border-emerald-500/20 text-emerald-400'
                }`}
              >
                {message.text}
              </div>
            )}

            <form onSubmit={handleResetPassword} className="space-y-4">
              <div>
                <label className="block text-xs text-slate-400 font-medium mb-1">Email</label>
                <input
                  type="email"
                  required
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="mario@esempio.it"
                  className="w-full bg-slate-900 border border-slate-700 rounded-xl px-4 py-2.5 text-white placeholder-slate-500 focus:outline-none focus:border-emerald-500"
                />
              </div>

              <button
                type="submit"
                disabled={loading || !email.trim()}
                className="w-full bg-emerald-500 hover:bg-emerald-600 disabled:opacity-50 text-slate-950 font-bold py-3 px-4 rounded-xl transition duration-200 shadow-lg shadow-emerald-500/20 mt-2"
              >
                {loading ? 'Invio in corso...' : 'Invia Link di Recupero'}
              </button>
            </form>

            <div className="mt-6 text-center">
              <button
                type="button"
                onClick={() => {
                  setIsForgotPassword(false)
                  setMessage(null)
                }}
                className="text-slate-400 hover:text-emerald-400 text-sm font-medium transition"
              >
                ← Torna al Login
              </button>
            </div>
          </>
        ) : (
          /* VISTA: Login / Registrazione */
          <>
            <h2 className="text-2xl font-bold text-center text-emerald-400 mb-1">
              {isSignUp ? 'Crea un account' : 'Accedi a SplitExpenses'}
            </h2>
            <p className="text-slate-400 text-center text-sm mb-6">
              {isSignUp ? 'Inserisci i tuoi dati per iniziare' : 'Inserisci le tue credenziali'}
            </p>

            {message && (
              <div
                className={`p-3 rounded-xl mb-4 text-sm font-medium ${
                  message.type === 'error'
                    ? 'bg-red-500/10 border border-red-500/20 text-red-400'
                    : 'bg-emerald-500/10 border border-emerald-500/20 text-emerald-400'
                }`}
              >
                {message.text}
              </div>
            )}

            <form onSubmit={handleAuth} className="space-y-4">
              {isSignUp && (
                <div>
                  <label className="block text-xs text-slate-400 font-medium mb-1">Nome e Cognome</label>
                  <input
                    type="text"
                    required
                    value={fullName}
                    onChange={(e) => setFullName(e.target.value)}
                    placeholder="Mario Rossi"
                    className="w-full bg-slate-900 border border-slate-700 rounded-xl px-4 py-2.5 text-white placeholder-slate-500 focus:outline-none focus:border-emerald-500"
                  />
                </div>
              )}

              <div>
                <label className="block text-xs text-slate-400 font-medium mb-1">Email</label>
                <input
                  type="email"
                  required
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="mario@esempio.it"
                  className="w-full bg-slate-900 border border-slate-700 rounded-xl px-4 py-2.5 text-white placeholder-slate-500 focus:outline-none focus:border-emerald-500"
                />
              </div>

              <div>
                <div className="flex items-center justify-between mb-1">
                  <label className="block text-xs text-slate-400 font-medium">Password</label>
                  {!isSignUp && (
                    <button
                      type="button"
                      onClick={() => {
                        setIsForgotPassword(true)
                        setMessage(null)
                      }}
                      className="text-xs text-emerald-400 hover:underline font-medium"
                    >
                      Password dimenticata?
                    </button>
                  )}
                </div>
                <input
                  type="password"
                  required
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="••••••••"
                  className="w-full bg-slate-900 border border-slate-700 rounded-xl px-4 py-2.5 text-white placeholder-slate-500 focus:outline-none focus:border-emerald-500"
                />
              </div>

              <button
                type="submit"
                disabled={loading}
                className="w-full bg-emerald-500 hover:bg-emerald-600 disabled:opacity-50 text-slate-950 font-bold py-3 px-4 rounded-xl transition duration-200 shadow-lg shadow-emerald-500/20 mt-2"
              >
                {loading ? 'Caricamento...' : isSignUp ? 'Registrati' : 'Accedi'}
              </button>
            </form>

            <div className="mt-6 text-center">
              <button
                type="button"
                onClick={() => {
                  setIsSignUp(!isSignUp)
                  setMessage(null)
                }}
                className="text-slate-400 hover:text-emerald-400 text-sm font-medium transition"
              >
                {isSignUp ? 'Hai già un account? Accedi' : 'Non hai un account? Registrati'}
              </button>
            </div>
          </>
        )}

      </div>
    </div>
  )
}