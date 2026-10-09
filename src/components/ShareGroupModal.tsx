import { useState } from 'react'
import { QRCodeSVG } from 'qrcode.react'
import { X, Copy, Check, Share2, Mail, MessageCircle, Send } from 'lucide-react'
import { supabase } from '../lib/supabase' // <--- Import essenziale del client
import { toast } from 'sonner'
import type { Group } from '../lib/groups'

interface ShareGroupModalProps {
  isOpen: boolean
  onClose: () => void
  group: Group
}

export default function ShareGroupModal({ isOpen, onClose, group }: ShareGroupModalProps) {
  const [copied, setCopied] = useState(false)
  const [inviteEmail, setInviteEmail] = useState('')
  const [sendingEmail, setSendingEmail] = useState(false)

  if (!isOpen) return null

  // URL di invito diretto al gruppo
  const shareUrl = `${window.location.origin}/join?group=${group.id}`

  const handleCopy = () => {
    navigator.clipboard.writeText(shareUrl)
    setCopied(true)
    setTimeout(() => setCopied(false), 2000)
    toast.success('Link copiato negli appunti!')
  }

  const shareText = `Unisciti al gruppo "${group.name}" su SplitExpenses per dividere le spese insieme! ${shareUrl}`

  const handleWhatsApp = () => {
    window.open(`https://wa.me/?text=${encodeURIComponent(shareText)}`, '_blank')
  }

  // Invio tramite Brevo passando per la Supabase Edge Function
  const handleSendEmailViaBrevo = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!inviteEmail.trim()) {
      toast.error('Inserisci un indirizzo email valido')
      return
    }

    setSendingEmail(true)
    try {
      const { error } = await supabase.functions.invoke('send-invite', {
        body: {
          email: inviteEmail,
          groupName: group.name,
          inviteUrl: shareUrl,
          templateId: 2, // Sostituisci con il tuo ID template numerico di Brevo
        },
      })

      if (error) throw error

      toast.success('Email di invito inviata con successo! ✉️')
      setInviteEmail('')
    } catch (err: unknown) {
      const error = err as Error
      toast.error('Impossibile inviare l\'email', { description: error.message })
    } finally {
      setSendingEmail(false)
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
          <Share2 size={24} />
        </div>

        <h3 className="text-xl font-bold text-white mb-1">Invita nel gruppo</h3>
        <p className="text-xs text-slate-400 mb-6">
          Fai scansionare il QR code dal vivo, usa WhatsApp o invia l'invito ufficiale via email per <strong className="text-slate-200">{group.name}</strong>.
        </p>

        {/* QR Code */}
        <div className="bg-white p-4 rounded-2xl inline-block shadow-lg mb-6 border border-slate-200">
          <QRCodeSVG value={shareUrl} size={140} />
        </div>

        {/* Condivisione WhatsApp */}
        <div className="mb-4">
          <button
            onClick={handleWhatsApp}
            className="w-full flex items-center justify-center gap-2 py-3 px-4 rounded-xl bg-emerald-600/20 hover:bg-emerald-600/30 text-emerald-400 border border-emerald-500/30 text-xs font-bold transition"
          >
            <MessageCircle size={16} /> Condividi su WhatsApp
          </button>
        </div>

        {/* Form Invio Email con Template Brevo */}
        <form onSubmit={handleSendEmailViaBrevo} className="mb-5 text-left">
          <label className="block text-xs text-slate-400 font-medium mb-1.5 flex items-center gap-1.5">
            <Mail size={14} /> Invia invito via Email (Brevo)
          </label>
          <div className="flex gap-2">
            <input
              type="email"
              value={inviteEmail}
              onChange={(e) => setInviteEmail(e.target.value)}
              placeholder="amico@esempio.it"
              className="bg-slate-950 border border-slate-800 rounded-xl px-3 py-2.5 text-xs text-white placeholder-slate-600 flex-1 focus:outline-none focus:border-emerald-500"
            />
            <button
              type="submit"
              disabled={sendingEmail || !inviteEmail.trim()}
              className="bg-emerald-500 hover:bg-emerald-600 disabled:opacity-50 text-slate-950 font-bold px-4 py-2.5 rounded-xl text-xs flex items-center gap-1 transition shrink-0"
            >
              {sendingEmail ? 'Invio...' : <><Send size={14} /> Invia</>}
            </button>
          </div>
        </form>

        {/* Box Copia Link */}
        <div className="flex items-center gap-2 bg-slate-950 border border-slate-800 p-2 pl-3 rounded-xl text-left">
          <input
            type="text"
            readOnly
            value={shareUrl}
            className="bg-transparent text-xs text-slate-400 flex-1 focus:outline-none select-all"
          />
          <button
            onClick={handleCopy}
            className="bg-slate-800 hover:bg-slate-700 text-white py-2 px-3 text-xs rounded-lg flex items-center gap-1.5 shrink-0 transition"
          >
            {copied ? <><Check size={14} /> Copiato</> : <><Copy size={14} /> Copia</>}
          </button>
        </div>
      </div>
    </div>
  )
}