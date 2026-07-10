import { shortenWalletAddress } from '../../wallet/address'
import { useTronBalances } from '../../hooks/useTronBalances'
import { UsdcLogo } from './CoinLogos'

function TrxLogo({ size = 20 }: { size?: number }) {
  return (
    <div
      className="rounded-full bg-[#EF0027]/20 border border-[#EF0027]/40 flex items-center justify-center shrink-0"
      style={{ width: size, height: size }}
    >
      <span className="text-[#EF0027] font-bold" style={{ fontSize: size * 0.38 }}>
        T
      </span>
    </div>
  )
}

interface Props {
  address: string
  walletLabel: string
  loadingLabel: string
  fallbackUsdt?: number
  fallbackTrx?: number
}

export default function WalletBalanceBar({
  address,
  walletLabel,
  loadingLabel,
  fallbackUsdt,
  fallbackTrx,
}: Props) {
  const { balances, loading, error } = useTronBalances(address)

  const usdt =
    !loading && !error
      ? balances.usdt
      : typeof fallbackUsdt === 'number' && Number.isFinite(fallbackUsdt)
        ? fallbackUsdt
        : null
  const trx =
    !loading && !error
      ? balances.trx
      : typeof fallbackTrx === 'number' && Number.isFinite(fallbackTrx)
        ? fallbackTrx
        : null

  return (
    <div className="rounded-xl bg-white/[0.07] border border-white/[0.12] px-5 py-3 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
      <div className="flex items-center gap-2 text-sm text-gray-400 min-w-0">
        <svg className="w-4 h-4 shrink-0 text-gray-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth="2"
            d="M13.828 10.172a4 4 0 00-5.656 0l-4 4a4 4 0 105.656 5.656l1.102-1.101m-.758-4.899a4 4 0 005.656 0l4-4a4 4 0 00-5.656-5.656l-1.1 1.1"
          />
        </svg>
        <span className="shrink-0">{walletLabel}:</span>
        <span className="font-mono text-gray-300 truncate">{shortenWalletAddress(address)}</span>
      </div>

      <div className="flex items-center gap-6 sm:gap-8">
        <div className="flex items-center gap-2">
          <UsdcLogo size={20} />
          <span className="text-sm text-gray-300 tabular-nums">
            $ {loading ? loadingLabel : usdt != null ? usdt.toFixed(2) : '--'}{' '}
            <span className="text-gray-500">USDC</span>
          </span>
        </div>
        <div className="flex items-center gap-2">
          <TrxLogo size={20} />
          <span className="text-sm text-gray-300 tabular-nums">
            {loading ? loadingLabel : trx != null ? trx.toFixed(4) : '--'}{' '}
            <span className="text-gray-500">TRX</span>
          </span>
        </div>
      </div>
    </div>
  )
}
