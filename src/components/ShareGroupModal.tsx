import { useState } from 'react'
import { QRCodeSVG } from 'qrcode.react'
import { X, Copy, Check, Share2, Mail, MessageCircle } from 'lucide-react'
import type { Group } from '../lib/groups'

interface ShareGroupModalProps {
  isOpen: boolean
  onClose: () => void
  group: Group
}

export default function ShareGroupModal({ isOpen, onClose, group }: ShareGroupModalProps) {
  const [copied, setCopied] = useState(false)

  if (!isOpen) return null

  // URL di invito diretto al gruppo
  const shareUrl = `${window.location.origin}/join?group=${group.id}`

  const handleCopy = () => {
    navigator.clipboard.writeText(shareUrl)
    setCopied(true)
    setTimeout(() => setCopied(false), 2000)
  }

  const shareText = `Unisciti al gruppo "${group.name}" su SplitExpenses per dividere le spese insieme! ${shareUrl}`

  const handleWhatsApp = () => {
    window.open(`https://wa.me/?text=${encodeURIComponent(shareText)}`, '_blank')
  }

  const handleEmail = () => {
    window.open(
      `mailto:?subject=Invito al gruppo ${group.name}&body=${encodeURIComponent(shareText)}`,
      '_blank'
    )
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
          Condividi questo link o mostra il QR Code ai tuoi amici per farli unire a <strong className="text-slate-200">{group.name}</strong>.
        </p>

        {/* QR Code */}
        <div className="bg-white p-4 rounded-2xl inline-block shadow-lg mb-6 border border-slate-200">
          <QRCodeSVG value={shareUrl} size={160} />
        </div>

        {/* Pulsanti Condivisione Rapida */}
        <div className="grid grid-cols-2 gap-3 mb-5">
          <button
            onClick={handleWhatsApp}
            className="flex items-center justify-center gap-2 py-3 px-4 rounded-xl bg-emerald-600/20 hover:bg-emerald-600/30 text-emerald-400 border border-emerald-500/30 text-xs font-bold transition"
          >
            <MessageCircle size={16} /> WhatsApp
          </button>
          <button
            onClick={handleEmail}
            className="flex items-center justify-center gap-2 py-3 px-4 rounded-xl bg-indigo-600/20 hover:bg-indigo-600/30 text-indigo-400 border border-indigo-500/30 text-xs font-bold transition"
          >
            <Mail size={16} /> Email
          </button>
        </div>

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
            className="btn-primary py-2 px-3 text-xs flex items-center gap-1.5 shrink-0"
          >
            {copied ? (
              <>
                <Check size={14} /> Copiato
              </>
            ) : (
              <>
                <Copy size={14} /> Copia
              </>
            )}
          </button>
        </div>
      </div>
    </div>
  )
}