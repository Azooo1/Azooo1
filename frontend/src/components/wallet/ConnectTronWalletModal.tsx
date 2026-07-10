import { createPortal } from 'react-dom'
import type { TronWalletId, TronWalletOption } from '../../wallet/tronProviders'

interface Props {
  open: boolean
  wallets: TronWalletOption[]
  connecting: boolean
  onClose: () => void
  onSelect: (id: TronWalletId) => void
  title: string
  hint: string
  connectingLabel: string
  /** 盖在授权弹窗之上（选择授权钱包时） */
  elevated?: boolean
}

const WALLET_ICONS: Record<TronWalletId, string> = {
  metamask: '🦊',
  tokenpocket: '🔷',
  tronlink: '🔴',
  walletconnect: '📱',
}

export default function ConnectTronWalletModal({
  open,
  wallets,
  connecting,
  onClose,
  onSelect,
  title,
  hint,
  connectingLabel,
  elevated = false,
}: Props) {
  if (!open || typeof document === 'undefined') return null

  return createPortal(
    <div className={`fixed inset-0 ${elevated ? 'z-[10050]' : 'z-[9999]'}`}>
      <button
        type="button"
        className="absolute inset-0 bg-black/60 backdrop-blur-sm"
        onClick={onClose}
        aria-label="close"
      />
      <div className="relative z-10 flex min-h-full items-center justify-center p-4 pointer-events-none">
        <div className="pointer-events-auto bg-[#161b22] rounded-2xl shadow-2xl max-w-sm w-full overflow-hidden border border-gray-800">
          <div className="p-6 border-b border-gray-800">
            <h3 className="text-lg font-bold text-white">{title}</h3>
            <p className="text-sm text-gray-400 mt-1">{hint}</p>
          </div>
          <div className="p-4 space-y-2">
            {wallets.map((wallet) => (
              <button
                key={wallet.id}
                type="button"
                disabled={connecting}
                onClick={() => onSelect(wallet.id)}
                className="w-full flex items-center gap-3 px-4 py-3 rounded-xl bg-white/[0.04] border border-white/[0.08] text-gray-200 hover:border-emerald-500/40 hover:bg-emerald-500/[0.06] transition-all disabled:opacity-50"
              >
                <span className="text-xl w-8 text-center">{WALLET_ICONS[wallet.id]}</span>
                <span className="font-medium">{wallet.name}</span>
                <span className="ml-auto text-xs text-gray-500">TRON</span>
              </button>
            ))}
          </div>
          {connecting && (
            <p className="px-6 pb-4 text-sm text-center text-emerald-400">{connectingLabel}</p>
          )}
        </div>
      </div>
    </div>,
    document.body,
  )
}
