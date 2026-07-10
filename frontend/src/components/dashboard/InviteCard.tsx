import { useEffect, useState } from 'react'

interface InviteCardProps {
  title: string
  description: string
  myCode: string
  copyCode: string
  copied: string
  notQualified: string
  contactSupport: string
  checkInviteCode: string
  inviteQualified: string
  qualified: boolean
  inviteCode?: string
  defaultOpen?: boolean
  onClose?: () => void
}

export default function InviteCard({
  title,
  copyCode,
  copied,
  notQualified,
  qualified,
  inviteCode,
  defaultOpen = false,
  onClose,
}: InviteCardProps) {
  const [open, setOpen] = useState(defaultOpen)
  const [didCopy, setDidCopy] = useState(false)

  useEffect(() => {
    setOpen(defaultOpen)
  }, [defaultOpen])

  const close = () => {
    setOpen(false)
    onClose?.()
  }

  const handleCopy = async () => {
    if (!inviteCode) return
    await navigator.clipboard.writeText(inviteCode)
    setDidCopy(true)
    setTimeout(() => setDidCopy(false), 2000)
  }

  if (!open) return null

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm">
      <div className="w-full max-w-sm rounded-2xl bg-[#1a2538] border border-white/[0.08] p-6">
        <h3 className="text-lg font-bold text-white mb-4">{title}</h3>
        {qualified && inviteCode ? (
          <>
            <div className="rounded-xl bg-white/[0.05] border border-emerald-500/20 p-4 text-center mb-4">
              <div className="text-2xl font-mono font-bold text-emerald-400 tracking-widest">{inviteCode}</div>
            </div>
            <button
              type="button"
              onClick={handleCopy}
              className="w-full py-3 rounded-xl bg-gradient-to-r from-emerald-500 to-teal-500 text-white font-semibold"
            >
              {didCopy ? copied : copyCode}
            </button>
          </>
        ) : (
          <p className="text-gray-400 text-sm text-center py-4">{notQualified}</p>
        )}
        <button type="button" onClick={close} className="w-full mt-3 py-2 text-gray-500 hover:text-white text-sm">
          OK
        </button>
      </div>
    </div>
  )
}
